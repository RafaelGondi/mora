import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { isFirebaseConfigured, initFirebase } from '@/lib/firebase'
import {
  removeBacklogItem,
  startBacklogSync,
  upsertBacklogItem,
} from '@/services/firestore/backlogSync'
import type {
  BacklogItem,
  BacklogStatus,
  ManualEntryInput,
  MediaType,
  SearchResult,
} from '@/types/media'
import { MEDIA_TYPES } from '@/types/media'
import { isLocalCover } from '@/utils/coverUrl'

const STORAGE_KEY = 'mora-backlog'
const LEGACY_STORAGE_KEY = 'ante-backlog'

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'error'

const ACTIVE_QUEUE_STATUSES: BacklogStatus[] = ['want', 'in_progress']

function statusesForFilter(status?: BacklogStatus | null): BacklogStatus[] {
  if (status) return [status]
  return ACTIVE_QUEUE_STATUSES
}

function compareWithinType(a: BacklogItem, b: BacklogItem): number {
  const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER
  const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER
  if (orderA !== orderB) return orderA - orderB
  return b.addedAt.localeCompare(a.addedAt)
}

function sortWithinType(list: BacklogItem[]): BacklogItem[] {
  return [...list].sort(compareWithinType)
}

function ensureSortOrders(list: BacklogItem[]): BacklogItem[] {
  const result = list.map((item) => ({ ...item }))

  for (const type of MEDIA_TYPES) {
    const group = result.filter((item) => item.type === type)
    const ordered = sortWithinType(group)
    ordered.forEach((item, index) => {
      const ref = result.find((entry) => entry.id === item.id)
      if (ref) ref.sortOrder = index
    })
  }

  return result
}

function normalizeItem(item: BacklogItem): BacklogItem {
  return {
    ...item,
    creator: item.creator ?? item.subtitle,
  }
}

function loadItems(): BacklogItem[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    const items = raw ? ensureSortOrders((JSON.parse(raw) as BacklogItem[]).map(normalizeItem)) : []
    if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
    return items
  } catch {
    return []
  }
}

function cacheItems(items: BacklogItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore quota errors */
  }
}

function uid() {
  return crypto.randomUUID()
}

function toBacklogItem(
  data: Pick<
    BacklogItem,
    | 'externalId'
    | 'type'
    | 'title'
    | 'creator'
    | 'coverUrl'
    | 'overview'
    | 'year'
    | 'rating'
    | 'manual'
    | 'whereToWatch'
  >,
): BacklogItem {
  const now = new Date().toISOString()
  return {
    id: uid(),
    externalId: data.externalId,
    type: data.type,
    title: data.title,
    creator: data.creator,
    coverUrl: data.coverUrl,
    status: 'want',
    addedAt: now,
    updatedAt: now,
    overview: data.overview,
    year: data.year,
    rating: data.rating,
    manual: data.manual,
    whereToWatch: data.whereToWatch,
  }
}

function mergeItems(remote: BacklogItem[], local: BacklogItem[]): BacklogItem[] {
  const byId = new Map<string, BacklogItem>()

  for (const item of remote) byId.set(item.id, item)

  for (const item of local) {
    const remoteItem = byId.get(item.id)
    if (!remoteItem) {
      byId.set(item.id, item)
      continue
    }

    const localIsNewer = item.updatedAt > remoteItem.updatedAt
    let merged = localIsNewer ? item : remoteItem

    if (isLocalCover(item.coverUrl) && !merged.coverUrl) {
      merged = { ...merged, coverUrl: item.coverUrl }
    }

    byId.set(item.id, merged)
  }

  return [...byId.values()]
}

function localOnlyItems(remote: BacklogItem[], merged: BacklogItem[]) {
  const remoteIds = new Set(remote.map((item) => item.id))
  return merged.filter((item) => !remoteIds.has(item.id))
}

export const useBacklogStore = defineStore('backlog', () => {
  const items = ref<BacklogItem[]>(loadItems())
  const syncStatus = ref<SyncStatus>(isFirebaseConfigured() ? 'connecting' : 'local')
  const syncError = ref<string | null>(null)
  const firebaseUid = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null
  let applyingRemote = false
  let firebaseUserId: string | null = null
  const pendingItems = new Map<string, BacklogItem>()

  async function flushPendingItems() {
    if (!firebaseUserId || pendingItems.size === 0) return
    for (const item of pendingItems.values()) {
      try {
        await upsertBacklogItem(firebaseUserId, item)
        pendingItems.delete(item.id)
        syncStatus.value = 'synced'
        syncError.value = null
      } catch (err) {
        syncStatus.value = 'error'
        syncError.value = err instanceof Error ? err.message : 'Erro ao salvar na nuvem'
      }
    }
  }

  async function syncLocalOnlyItems(remote: BacklogItem[], merged: BacklogItem[]) {
    if (!firebaseUserId || applyingRemote) return
    for (const item of localOnlyItems(remote, merged)) {
      try {
        await upsertBacklogItem(firebaseUserId, item)
        syncStatus.value = 'synced'
        syncError.value = null
      } catch (err) {
        syncStatus.value = 'error'
        syncError.value = err instanceof Error ? err.message : 'Erro ao salvar na nuvem'
      }
    }
  }

  async function persistItem(item: BacklogItem) {
    cacheItems(items.value)
    if (!isFirebaseConfigured() || applyingRemote) return

    if (!firebaseUserId) {
      pendingItems.set(item.id, item)
      return
    }

    try {
      await upsertBacklogItem(firebaseUserId, item)
      pendingItems.delete(item.id)
      syncStatus.value = 'synced'
      syncError.value = null
    } catch (err) {
      syncStatus.value = 'error'
      syncError.value = err instanceof Error ? err.message : 'Erro ao salvar na nuvem'
    }
  }

  async function persistRemove(id: string) {
    cacheItems(items.value)
    if (!isFirebaseConfigured() || applyingRemote || !firebaseUserId) return
    try {
      await removeBacklogItem(firebaseUserId, id)
      syncStatus.value = 'synced'
      syncError.value = null
    } catch (err) {
      syncStatus.value = 'error'
      syncError.value = err instanceof Error ? err.message : 'Erro ao remover da nuvem'
    }
  }

  async function initSync() {
    if (!isFirebaseConfigured()) {
      syncStatus.value = 'local'
      return
    }

    syncStatus.value = 'connecting'
    syncError.value = null

    try {
      const user = await initFirebase()
      firebaseUserId = user?.uid ?? null
      firebaseUid.value = firebaseUserId

      if (!firebaseUserId) {
        syncStatus.value = 'local'
        return
      }

      if (unsubscribe) unsubscribe()

      unsubscribe = await startBacklogSync(
        items.value,
        (remoteItems) => {
          applyingRemote = true
          const merged = ensureSortOrders(mergeItems(remoteItems, items.value).map(normalizeItem))
          items.value = merged
          cacheItems(merged)
          applyingRemote = false
          syncStatus.value = 'synced'
          syncError.value = null
          void syncLocalOnlyItems(remoteItems, merged)
        },
        (err) => {
          syncStatus.value = 'error'
          syncError.value = err.message
        },
      )

      await flushPendingItems()
    } catch (err) {
      syncStatus.value = 'error'
      syncError.value = err instanceof Error ? err.message : 'Erro ao conectar com Firebase'
    }
  }

  const orderedItems = computed(() => items.value)

  const totalCount = computed(() => items.value.length)

  const byStatus = computed(() => {
    const map: Record<BacklogStatus, number> = {
      want: 0,
      in_progress: 0,
      completed: 0,
      dropped: 0,
    }
    for (const item of items.value) map[item.status]++
    return map
  })

  const byType = computed(() => {
    const map: Record<MediaType, number> = {
      movie: 0,
      series: 0,
      book: 0,
      game: 0,
      album: 0,
      other: 0,
    }
    for (const item of items.value) map[item.type]++
    return map
  })

  function nextBottomSortOrder(type: MediaType) {
    const sameType = items.value.filter((item) => item.type === type)
    if (!sameType.length) return 0
    const max = Math.max(...sameType.map((item) => item.sortOrder ?? 0))
    return max + 1
  }

  function isInBacklog(externalId: string, type: MediaType) {
    return items.value.some((i) => i.externalId === externalId && i.type === type)
  }

  function addFromSearch(result: SearchResult) {
    if (isInBacklog(result.externalId, result.type)) return null
    const item = toBacklogItem({
      externalId: result.externalId,
      type: result.type,
      title: result.title,
      creator: result.creator ?? result.subtitle,
      coverUrl: result.coverUrl,
      overview: result.overview,
      year: result.year,
      rating: result.rating,
      manual: result.manual,
    })
    item.sortOrder = nextBottomSortOrder(result.type)
    items.value.push(item)
    void persistItem(item)
    return item
  }

  function addManual(input: ManualEntryInput) {
    const title = input.title.trim()
    if (!title) return null

    const item = toBacklogItem({
      externalId: `manual-${uid()}`,
      type: input.type,
      title,
      creator: input.creator?.trim() || undefined,
      coverUrl: input.coverUrl?.trim() || undefined,
      overview: input.overview?.trim() || undefined,
      year: input.year?.trim() || undefined,
      whereToWatch: input.whereToWatch?.trim() || undefined,
      manual: true,
    })
    item.sortOrder = nextBottomSortOrder(input.type)
    items.value.push(item)
    void persistItem(item)
    return item
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
    void persistRemove(id)
  }

  function updateStatus(id: string, status: BacklogStatus) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.status = status
      item.updatedAt = new Date().toISOString()
      void persistItem(item)
    }
  }

  function updateNotes(id: string, notes: string) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.notes = notes
      item.updatedAt = new Date().toISOString()
      void persistItem(item)
    }
  }

  function updateUserRating(id: string, userRating: number | undefined) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.userRating = userRating
      item.updatedAt = new Date().toISOString()
      void persistItem(item)
    }
  }

  function updateCoverUrl(id: string, coverUrl: string | undefined) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.coverUrl = coverUrl
      item.updatedAt = new Date().toISOString()
      void persistItem(item)
    }
  }

  function updateCreator(id: string, creator: string) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.creator = creator.trim() || undefined
      item.updatedAt = new Date().toISOString()
      void persistItem(item)
    }
  }

  function updateWhereToWatch(id: string, whereToWatch: string) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.whereToWatch = whereToWatch.trim() || undefined
      item.updatedAt = new Date().toISOString()
      void persistItem(item)
    }
  }

  function getItem(id: string) {
    return items.value.find((i) => i.id === id)
  }

  function itemsOfType(type: MediaType) {
    return sortWithinType(items.value.filter((item) => item.type === type))
  }

  function itemPosition(id: string) {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return -1
    return itemsOfType(item.type).findIndex((entry) => entry.id === id)
  }

  function applyTypeOrder(type: MediaType, orderedIds: string[]) {
    const before = new Map(items.value.map((item) => [item.id, item.sortOrder]))
    const now = new Date().toISOString()

    orderedIds.forEach((id, index) => {
      const item = items.value.find((entry) => entry.id === id)
      if (!item || item.type !== type) return
      if (item.sortOrder !== index) {
        item.sortOrder = index
        item.updatedAt = now
      }
    })

    cacheItems(items.value)

    for (const item of items.value) {
      if (item.type === type && before.get(item.id) !== item.sortOrder) {
        void persistItem(item)
      }
    }
  }

  function moveToTop(id: string) {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return

    const ordered = itemsOfType(item.type)
    const index = ordered.findIndex((entry) => entry.id === id)
    if (index <= 0) return

    const [picked] = ordered.splice(index, 1)
    if (!picked) return
    ordered.unshift(picked)
    applyTypeOrder(item.type, ordered.map((entry) => entry.id))
  }

  function moveUp(id: string) {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return

    const ordered = itemsOfType(item.type)
    const index = ordered.findIndex((entry) => entry.id === id)
    if (index <= 0) return

    const prev = ordered[index - 1]
    const current = ordered[index]
    if (!prev || !current) return

    ordered[index - 1] = current
    ordered[index] = prev
    applyTypeOrder(item.type, ordered.map((entry) => entry.id))
  }

  function moveDown(id: string) {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return

    const ordered = itemsOfType(item.type)
    const index = ordered.findIndex((entry) => entry.id === id)
    if (index < 0 || index >= ordered.length - 1) return

    const next = ordered[index + 1]
    const current = ordered[index]
    if (!next || !current) return

    ordered[index + 1] = current
    ordered[index] = next
    applyTypeOrder(item.type, ordered.map((entry) => entry.id))
  }

  function filteredItems(
    type: MediaType,
    status?: BacklogStatus | null,
    creatorQuery?: string | null,
  ) {
    const allowedStatuses = statusesForFilter(status)
    const query = creatorQuery?.trim().toLowerCase()
    const list = items.value.filter((item) => {
      if (item.type !== type) return false
      if (!allowedStatuses.includes(item.status)) return false
      if (query) {
        const creator = (item.creator ?? item.subtitle ?? '').toLowerCase()
        if (!creator.includes(query)) return false
      }
      return true
    })

    return sortWithinType(list)
  }

  function countForType(type: MediaType, status?: BacklogStatus | null) {
    const allowedStatuses = statusesForFilter(status)
    return items.value.filter(
      (item) => item.type === type && allowedStatuses.includes(item.status),
    ).length
  }

  function uniqueCreatorsFor(type: MediaType, status?: BacklogStatus | null) {
    const allowedStatuses = statusesForFilter(status)
    const names = new Set<string>()
    for (const item of items.value) {
      if (item.type !== type) continue
      if (!allowedStatuses.includes(item.status)) continue
      const name = item.creator?.trim()
      if (name) names.add(name)
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'pt'))
  }

  const recentItems = computed(() =>
    [...items.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
  )

  return {
    items,
    orderedItems,
    syncStatus,
    syncError,
    firebaseUid,
    totalCount,
    byStatus,
    byType,
    recentItems,
    initSync,
    isInBacklog,
    addFromSearch,
    addManual,
    removeItem,
    updateStatus,
    updateNotes,
    updateUserRating,
    updateCoverUrl,
    updateCreator,
    updateWhereToWatch,
    moveToTop,
    moveUp,
    moveDown,
    applyTypeOrder,
    itemPosition,
    uniqueCreatorsFor,
    getItem,
    filteredItems,
    countForType,
  }
})
