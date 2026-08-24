<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import {
  AkButton,
  AkChip,
  AkEmptyState,
  AkIcon,
  AkIconButton,
  AkInput,
  AkList,
  AkListRow,
  AkPageHeader,
  AkSheet,
} from '@rafael_dias/akoma'
import { useBacklogStore } from '@/stores/backlog'
import MediaTile from '@/components/media/MediaTile.vue'
import { haptic } from '@/utils/haptic'
import { MEDIA_TYPES, STATUS_OPTIONS, TYPE_COLORS, TYPE_LABELS } from '@/types/media'
import type { BacklogStatus, BacklogItem, MediaType } from '@/types/media'

type DragIndexEvent = {
  oldIndex?: number
  newIndex?: number
}

const store = useBacklogStore()
const router = useRouter()
const route = useRoute()

const filterType = ref<MediaType>('movie')
const filterStatus = ref<BacklogStatus | null>(null)
const filterCreator = ref('')

const typeSheetOpen = ref(false)
const searchOpen = ref(false)
const searchAnchor = ref<HTMLElement | null>(null)

const STATUS_VALUES = STATUS_OPTIONS.map((s) => s.value)

function parseStatus(value: unknown): BacklogStatus | null {
  if (typeof value === 'string' && STATUS_VALUES.includes(value as BacklogStatus)) {
    return value as BacklogStatus
  }
  return null
}

function buildBacklogQuery(creator: string, status: BacklogStatus | null) {
  const query: Record<string, string> = {}
  const trimmedCreator = creator.trim()
  if (trimmedCreator) query.creator = trimmedCreator
  if (status) query.status = status
  return query
}

function syncRouteFromFilters() {
  router.replace({
    path: '/backlog',
    query: buildBacklogQuery(filterCreator.value, filterStatus.value),
  })
}

function preferredTypeForStatus(status: BacklogStatus): MediaType {
  let best: MediaType = filterType.value
  let bestCount = store.filteredItems(best, status).length
  for (const type of MEDIA_TYPES) {
    const count = store.filteredItems(type, status).length
    if (count > bestCount) {
      bestCount = count
      best = type
    }
  }
  return best
}

watch(
  () => route.query.creator,
  (value) => {
    filterCreator.value = typeof value === 'string' ? value : ''
    if (filterCreator.value) searchOpen.value = true
  },
  { immediate: true },
)

watch(
  () => route.query.status,
  (value) => {
    const status = parseStatus(value)
    filterStatus.value = status
    if (status && store.filteredItems(filterType.value, status).length === 0) {
      filterType.value = preferredTypeForStatus(status)
    }
  },
  { immediate: true },
)

watch(filterCreator, (value) => {
  const next = value.trim()
  const current = typeof route.query.creator === 'string' ? route.query.creator : ''
  if (next === current) return
  syncRouteFromFilters()
})

watch(filterStatus, (value) => {
  const current = parseStatus(route.query.status)
  if (value === current) return
  syncRouteFromFilters()
})

watch(searchOpen, async (open) => {
  if (!open) return
  await nextTick()
  searchAnchor.value?.querySelector('input')?.focus()
})

const creatorSuggestions = computed(() => {
  const query = filterCreator.value.trim().toLowerCase()
  const creators = store.uniqueCreatorsFor(filterType.value, filterStatus.value)
  if (!query) return creators.slice(0, 8)
  return creators.filter((name) => name.toLowerCase().includes(query)).slice(0, 8)
})

const filtered = computed(() =>
  store.filteredItems(filterType.value, filterStatus.value, filterCreator.value),
)

const typeCount = computed(() => store.countForType(filterType.value, filterStatus.value))

const isFiltered = computed(() => Boolean(filterStatus.value || filterCreator.value.trim()))
const canReorder = computed(() => !isFiltered.value)

const dragList = ref<BacklogItem[]>([])
const suppressCardClick = ref(false)
const isDragging = ref(false)
const pressingId = ref<string | null>(null)
const settledId = ref<string | null>(null)

let settleTimer: ReturnType<typeof setTimeout> | undefined

const dragOptions = {
  animation: 260,
  easing: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
  delay: 160,
  delayOnTouchOnly: true,
  distance: 10,
  touchStartThreshold: 8,
  ghostClass: 'shelf__ghost',
  chosenClass: 'shelf__chosen',
  dragClass: 'shelf__drag',
  emptyInsertThreshold: 8,
}

watch(
  filtered,
  (items) => {
    dragList.value = [...items]
  },
  { immediate: true },
)

function clearPressState() {
  pressingId.value = null
}

function onChoose(evt: DragIndexEvent) {
  if (isDragging.value) return
  const item = dragList.value[evt.oldIndex ?? -1]
  if (item) {
    pressingId.value = item.id
    haptic('press')
  }
}

function onUnchoose() {
  if (!isDragging.value) clearPressState()
}

function onDragStart() {
  clearPressState()
  isDragging.value = true
  suppressCardClick.value = true
  haptic('lift')
}

function onReorder() {
  if (!canReorder.value) return
  store.applyTypeOrder(
    filterType.value,
    dragList.value.map((item) => item.id),
  )
}

function onDragEnd(evt: DragIndexEvent) {
  onReorder()

  const moved = evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex
  if (moved) {
    const item = dragList.value[evt.newIndex ?? -1]
    if (item) {
      if (settleTimer) clearTimeout(settleTimer)
      settledId.value = item.id
      settleTimer = setTimeout(() => {
        settledId.value = null
      }, 520)
      haptic('drop')
    }
  }

  isDragging.value = false
  window.setTimeout(() => {
    suppressCardClick.value = false
  }, 120)
}

function applyCreator(name: string) {
  filterCreator.value = filterCreator.value === name ? '' : name
}

function closeSearch() {
  filterCreator.value = ''
  searchOpen.value = false
}

function selectType(type: MediaType) {
  filterType.value = type
  typeSheetOpen.value = false
}
</script>

<template>
  <div class="ak-app-page ak-app-scroll">
    <!-- The tab bar already says "Fila", so the page title carries the thing
         that actually changes: which shelf you're on, and how deep it is. -->
    <AkPageHeader label="Fila" variant="flush" size="md">
      <template #title>
        <button class="shelf-title" type="button" @click="typeSheetOpen = true">
          {{ TYPE_LABELS[filterType] }}
          <AkIcon name="caret-down-outline" :size="20" />
        </button>
      </template>
      <template #meta>
        <span class="numeric">{{ typeCount }}</span>
        {{ typeCount === 1 ? 'item na fila' : 'itens na fila' }}
        <template v-if="isFiltered">· {{ filtered.length }} com os filtros</template>
      </template>
      <template #actions>
        <AkIconButton
          variant="ghost"
          :label="searchOpen ? 'Fechar busca' : 'Buscar por autor'"
          :icon="searchOpen ? 'x-outline' : 'search-outline'"
          @click="searchOpen ? closeSearch() : (searchOpen = true)"
        />
      </template>
    </AkPageHeader>

    <div class="page-body page-body--flush-top stack--lg">
      <section v-if="searchOpen" ref="searchAnchor" class="stack">
        <AkInput
          v-model="filterCreator"
          label="Diretor, autor, artista…"
          placeholder="Ex.: Juan Rulfo, Nolan…"
          type="search"
          autocomplete="off"
        />
        <div v-if="creatorSuggestions.length" class="chip-row">
          <AkChip
            v-for="name in creatorSuggestions"
            :key="name"
            :active="filterCreator === name"
            @click="applyCreator(name)"
          >
            {{ name }}
          </AkChip>
        </div>
      </section>

      <div class="chip-row">
        <AkChip
          v-for="s in STATUS_OPTIONS"
          :key="s.value"
          :active="filterStatus === s.value"
          @click="filterStatus = filterStatus === s.value ? null : s.value"
        >
          {{ s.label }}
        </AkChip>
      </div>

      <AkEmptyState
        v-if="!filtered.length"
        title="Nada por aqui"
        :description="
          store.totalCount
            ? 'Nenhum item corresponde aos filtros.'
            : 'Adicione mídias pela busca ou cadastro manual.'
        "
      >
        <template #icon>
          <AkIcon name="grid-outline" :size="24" />
        </template>
        <template v-if="!store.totalCount" #action>
          <AkButton @click="router.push('/search')">Buscar mídias</AkButton>
        </template>
      </AkEmptyState>

      <template v-else>
        <p class="shelf-hint">
          <AkIcon
            :name="canReorder ? 'swap-vertical-arrows-outline' : 'funnel-outline'"
            :size="14"
          />
          {{
            canReorder
              ? 'Segure um instante e arraste para reorganizar.'
              : 'Limpe os filtros para reorganizar.'
          }}
        </p>

        <draggable
          v-if="canReorder"
          :key="filterType"
          v-model="dragList"
          item-key="id"
          v-bind="dragOptions"
          class="shelf-grid"
          :class="{ 'shelf-grid--dragging': isDragging }"
          @choose="onChoose"
          @unchoose="onUnchoose"
          @start="onDragStart"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <div
              class="shelf-cell"
              :class="{
                'shelf-cell--pressing': pressingId === element.id,
                'shelf-cell--settled': settledId === element.id,
              }"
            >
              <MediaTile :item="element" :suppress-click="suppressCardClick" />
            </div>
          </template>
        </draggable>

        <div v-else :key="`static-${filterType}`" class="shelf-grid">
          <MediaTile v-for="item in filtered" :key="item.id" :item="item" />
        </div>
      </template>
    </div>

    <AkSheet v-model:open="typeSheetOpen" title="Mudar categoria" close-label="Fechar">
      <div class="sheet-body">
        <AkList>
          <AkListRow
            v-for="(type, i) in MEDIA_TYPES"
            :key="type"
            interactive
            :divider="i < MEDIA_TYPES.length - 1"
            @click="selectType(type)"
          >
            <template #leading>
              <span class="type-dot" :style="{ background: TYPE_COLORS[type] }" />
            </template>
            <span class="row-title">{{ TYPE_LABELS[type] }}</span>
            <template #subtitle>
              <span class="text-xs text-muted">
                {{ store.countForType(type, filterStatus) }} na fila
              </span>
            </template>
            <template #trailing>
              <AkIcon
                v-if="filterType === type"
                name="check-outline"
                :size="18"
                class="text-accent"
              />
            </template>
          </AkListRow>
        </AkList>
      </div>
    </AkSheet>
  </div>
</template>

<style scoped>
/* The page title doubles as the shelf switcher. */
.shelf-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-display);
  font-size: var(--text-display-md);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  cursor: pointer;
}

.shelf-title:focus-visible {
  outline: none;
  border-radius: var(--radius-sm);
  box-shadow: var(--focus-ring);
}

.shelf-title:active {
  opacity: 0.7;
}

.type-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  display: block;
}

.shelf-hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-tertiary);
}

/* Three across reads well at phone widths and scales to big backlogs. */
.shelf-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5) var(--space-3);
}

@media (min-width: 420px) {
  .shelf-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* Drag affordances — tint the cell, never lift it. */
.shelf-grid--dragging .shelf-cell:not(.shelf__ghost):not(.shelf__drag) {
  opacity: 0.55;
}

.shelf-grid--dragging .shelf-cell.shelf__chosen:not(.shelf__ghost):not(.shelf__drag) {
  opacity: 0 !important;
  pointer-events: none;
}

.shelf-cell--pressing :deep(.tile__cover) {
  transform: scale(0.95);
  box-shadow: 0 0 0 3px var(--accent-soft);
  border-radius: var(--cover-radius);
}

.shelf-cell--settled :deep(.tile__cover) {
  animation: shelf-settle 0.52s var(--ease-spring);
}

@keyframes shelf-settle {
  0% { transform: scale(1.06); }
  55% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.shelf-grid :deep(.shelf__ghost .tile__hit) {
  opacity: 0;
}

.shelf-grid :deep(.shelf__ghost) {
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  outline: 2px dashed color-mix(in srgb, var(--accent) 45%, transparent);
  outline-offset: -2px;
  opacity: 1 !important;
}

.shelf-grid :deep(.shelf__drag) {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .shelf-cell--pressing :deep(.tile__cover),
  .shelf-cell--settled :deep(.tile__cover) {
    transition: none;
    animation: none;
  }
}
</style>
