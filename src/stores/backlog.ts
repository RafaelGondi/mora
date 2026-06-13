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

const STORAGE_KEY = 'mora-backlog'
const LEGACY_STORAGE_KEY = 'ante-backlog'

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'error'

function loadItems(): BacklogItem[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    const items = raw ? (JSON.parse(raw) as BacklogItem[]) : []
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
    'externalId' | 'type' | 'title' | 'subtitle' | 'coverUrl' | 'overview' | 'year' | 'rating' | 'manual'
  >,
): BacklogItem {
  const now = new Date().toISOString()
  return {
    id: uid(),
    externalId: data.externalId,
    type: data.type,
    title: data.title,
    subtitle: data.subtitle,
    coverUrl: data.coverUrl,
    status: 'want',
    addedAt: now,
    updatedAt: now,
    overview: data.overview,
    year: data.year,
    rating: data.rating,
    manual: data.manual,
  }
}

function mergeItems(remote: BacklogItem[], local: BacklogItem[]): BacklogItem[] {
  const byId = new Map<string, BacklogItem>()

  for (const item of remote) byId.set(item.id, item)

  for (const item of local) {
    const remoteItem = byId.get(item.id)
    if (!remoteItem || item.updatedAt > remoteItem.updatedAt) {
      byId.set(item.id, item)
    }
  }

  return [...byId.values()].sort((a, b) => b.addedAt.localeCompare(a.addedAt))
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
          const merged = mergeItems(remoteItems, items.value)
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

  function isInBacklog(externalId: string, type: MediaType) {
    return items.value.some((i) => i.externalId === externalId && i.type === type)
  }

  function addFromSearch(result: SearchResult) {
    if (isInBacklog(result.externalId, result.type)) return null
    const item = toBacklogItem({
      externalId: result.externalId,
      type: result.type,
      title: result.title,
      subtitle: result.subtitle,
      coverUrl: result.coverUrl,
      overview: result.overview,
      year: result.year,
      rating: result.rating,
      manual: result.manual,
    })
    items.value.unshift(item)
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
      subtitle: input.subtitle?.trim() || undefined,
      coverUrl: input.coverUrl?.trim() || undefined,
      overview: input.overview?.trim() || undefined,
      year: input.year?.trim() || undefined,
      manual: true,
    })
    items.value.unshift(item)
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

  function getItem(id: string) {
    return items.value.find((i) => i.id === id)
  }

  function filteredItems(type?: MediaType | null, status?: BacklogStatus | null) {
    return items.value.filter((i) => {
      if (type && i.type !== type) return false
      if (status && i.status !== status) return false
      return true
    })
  }

  const recentItems = computed(() =>
    [...items.value].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 6),
  )

  return {
    items,
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
    getItem,
    filteredItems,
  }
})
