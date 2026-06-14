<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { useBacklogStore } from '@/stores/backlog'
import MediaCard from '@/components/media/MediaCard.vue'
import CategoryPill from '@/components/ui/CategoryPill.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { haptic } from '@/utils/haptic'
import { MEDIA_TYPES, STATUS_OPTIONS, TYPE_LABELS } from '@/types/media'
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

const canReorder = computed(() => !filterStatus.value && !filterCreator.value.trim())

const dragList = ref<BacklogItem[]>([])
const suppressCardClick = ref(false)
const isDragging = ref(false)
const pressingId = ref<string | null>(null)
const settledId = ref<string | null>(null)

let settleTimer: ReturnType<typeof setTimeout> | undefined

const dragOptions = {
  animation: 260,
  easing: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
  delay: 120,
  delayOnTouchOnly: true,
  distance: 10,
  touchStartThreshold: 8,
  ghostClass: 'backlog__ghost',
  chosenClass: 'backlog__chosen',
  dragClass: 'backlog__drag',
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
  filterCreator.value = name
}

function clearCreator() {
  filterCreator.value = ''
}
</script>



<template>

  <div class="backlog">

    <header class="backlog__header reveal">

      <span class="page-label">Coleção</span>

      <h1 class="page-title">Fila</h1>

      <p class="backlog__count">
        {{ filtered.length }} de {{ typeCount }} na fila de {{ TYPE_LABELS[filterType] }}
      </p>

    </header>



    <div class="backlog__search reveal reveal-d1">

      <label class="backlog__search-label" for="creator-filter">Diretor, autor, artista…</label>

      <div class="backlog__search-row">

        <input

          id="creator-filter"

          v-model="filterCreator"

          class="backlog__search-input"

          type="search"

          placeholder="Ex.: Juan Rulfo, Nolan…"

          autocomplete="off"

        />

        <button

          v-if="filterCreator"

          class="backlog__search-clear tap-scale"

          type="button"

          aria-label="Limpar busca"

          @click="clearCreator"

        >

          ×

        </button>

      </div>

      <div v-if="creatorSuggestions.length" class="creator-chips">

        <button

          v-for="name in creatorSuggestions"

          :key="name"

          class="creator-chip tap-scale"

          :class="{ 'creator-chip--on': filterCreator === name }"

          type="button"

          @click="applyCreator(name)"

        >

          {{ name }}

        </button>

      </div>

    </div>



    <div class="backlog__filters reveal reveal-d2">

      <div class="filter-scroll">
        <CategoryPill
          v-for="type in MEDIA_TYPES"
          :key="type"
          :type="type"
          :active="filterType === type"
          @click="filterType = type"
        />
      </div>



      <div class="status-row">

        <button

          v-for="s in STATUS_OPTIONS"

          :key="s.value"

          class="status-chip tap-scale"
          :class="[
            `status-chip--${s.value}`,
            { 'status-chip--on': filterStatus === s.value },
          ]"

          type="button"

          @click="filterStatus = filterStatus === s.value ? null : s.value"

        >

          {{ s.label }}

        </button>

      </div>

    </div>



    <EmptyState

      v-if="!filtered.length"

      title="Nada por aqui"

      :description="

        store.totalCount

          ? 'Nenhum item corresponde aos filtros.'

          : 'Adicione mídias pela busca ou cadastro manual.'

      "

      :action-label="store.totalCount ? undefined : 'Buscar mídias'"

      @action="router.push('/search')"

    />



    <p v-if="filtered.length && canReorder" class="backlog__drag-hint reveal reveal-d3">
      <span class="backlog__drag-hint-icon" aria-hidden="true">↕</span>
      Segure um instante e arraste para reorganizar.
    </p>

    <draggable
      v-if="filtered.length && canReorder"
      :key="filterType"
      v-model="dragList"
      item-key="id"
      v-bind="dragOptions"
      class="backlog__list backlog__list--reorder"
      :class="{ 'backlog__list--dragging': isDragging }"
      @choose="onChoose"
      @unchoose="onUnchoose"
      @start="onDragStart"
      @end="onDragEnd"
    >
      <template #item="{ element }">
        <div
          class="backlog__item"
          :class="{
            'backlog__item--pressing': pressingId === element.id,
            'backlog__item--settled': settledId === element.id,
          }"
        >
          <MediaCard
            :item="element"
            variant="row"
            reorderable
            :drag-active="isDragging"
            :suppress-click="suppressCardClick"
          />
        </div>
      </template>
    </draggable>

    <div v-else-if="filtered.length" :key="`static-${filterType}`" class="backlog__list">
      <p v-if="!canReorder" class="backlog__drag-hint">
        Limpe os filtros para reorganizar a fila.
      </p>
      <MediaCard v-for="item in filtered" :key="item.id" :item="item" variant="row" />
    </div>

  </div>

</template>



<style scoped>

.backlog {

  padding: calc(28px + var(--safe-top)) 20px 24px;

}



.backlog__header {

  margin-bottom: 20px;

}



.backlog__header .page-label {

  display: block;

  margin-bottom: 4px;

}



.backlog__count {

  margin-top: 6px;

  font-size: 14px;

  color: var(--text-secondary);

}



.backlog__search {

  margin-bottom: 18px;

}



.backlog__search-label {

  display: block;

  font-size: 12px;

  font-weight: 700;

  letter-spacing: 0.06em;

  text-transform: uppercase;

  color: var(--text-tertiary);

  margin-bottom: 8px;

}



.backlog__search-row {

  display: flex;

  gap: 8px;

  align-items: center;

}



.backlog__search-input {

  flex: 1;

  padding: 12px 14px;

  border: 1px solid var(--border-strong);

  border-radius: var(--radius-md);

  background: var(--bg-elevated);

  font-size: 15px;

  color: var(--text);

  box-shadow: var(--shadow-sm);

}



.backlog__search-input:focus {

  outline: none;

  border-color: var(--accent);

  box-shadow: 0 0 0 3px var(--accent-soft);

}



.backlog__search-clear {

  width: 36px;

  height: 36px;

  border-radius: var(--radius-sm);

  border: 1px solid var(--border);

  background: var(--bg-elevated);

  font-size: 20px;

  line-height: 1;

  color: var(--text-secondary);

}



.creator-chips {

  display: flex;

  gap: 8px;

  overflow-x: auto;

  margin-top: 10px;

  padding-bottom: 2px;

  -ms-overflow-style: none;

  scrollbar-width: none;

}



.creator-chips::-webkit-scrollbar {

  display: none;

}



.creator-chip {

  padding: 7px 12px;

  border-radius: var(--radius-full);

  border: 1px solid var(--border);

  background: var(--bg-elevated);

  font-size: 12px;

  font-weight: 600;

  color: var(--text-secondary);

  white-space: nowrap;

}



.creator-chip--on {

  background: var(--accent-soft);

  border-color: transparent;

  color: var(--accent);

}



.backlog__filters {

  margin-bottom: 20px;

}



.filter-scroll {

  display: flex;

  gap: 8px;

  overflow-x: auto;

  overflow-y: visible;

  margin: 0 -20px 14px;

  padding: 6px 20px;

  -ms-overflow-style: none;

  scrollbar-width: none;

}



.filter-scroll::-webkit-scrollbar {

  display: none;

}



.status-row {

  display: flex;

  flex-wrap: wrap;

  gap: 8px;

}



.status-chip {

  padding: 7px 14px;

  font-size: 12px;

  font-weight: 600;

  color: var(--text-secondary);

  background: var(--bg-elevated);

  border: 1px solid var(--border);

  border-radius: var(--radius-full);

  transition: all 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);

}



.status-chip--on {
  border-color: transparent;
}

.status-chip--on.status-chip--want {
  background: var(--status-want-bg);
  color: var(--status-want-fg);
}

.status-chip--on.status-chip--in_progress {
  background: var(--status-progress-bg);
  color: var(--status-progress-fg);
}

.status-chip--on.status-chip--completed {
  background: var(--status-completed-bg);
  color: var(--status-completed-fg);
}

.status-chip--on.status-chip--dropped {
  background: var(--status-dropped-bg);
  color: var(--status-dropped-fg);
}



.backlog__drag-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -8px 0 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.backlog__drag-hint-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 11px;
  animation: backlog-hint-pulse 2.4s var(--ease-smooth) infinite;
}

@keyframes backlog-hint-pulse {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.85;
  }
  50% {
    transform: translateY(-2px);
    opacity: 1;
  }
}

.backlog__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  width: 100%;
}

.backlog__item {
  width: 100%;
  max-width: 100%;
}

.backlog__item :deep(.card--row) {
  width: 100%;
}

.backlog__list--reorder > .backlog__item {
  touch-action: pan-y;
}

.backlog__list--reorder:not(.backlog__list--dragging) > .backlog__item {
  transition: transform 0.32s var(--ease-spring);
}

.backlog__list--dragging > .backlog__item {
  touch-action: none;
  transition: none !important;
}

.backlog__list--dragging > .backlog__item:not(.backlog__ghost):not(.backlog__drag) {
  opacity: 0.55;
}

.backlog__list--dragging > .backlog__item.backlog__chosen:not(.backlog__ghost):not(.backlog__drag) {
  opacity: 0 !important;
  pointer-events: none;
}

.backlog__item--pressing :deep(.card--row) {
  transform: scale(0.985);
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
  background: color-mix(in srgb, var(--accent-soft) 55%, var(--bg-elevated));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
  transition:
    transform 0.16s var(--ease-spring),
    box-shadow 0.16s var(--ease-smooth),
    border-color 0.16s var(--ease-smooth),
    background 0.16s var(--ease-smooth);
}

.backlog__item--settled :deep(.card--row) {
  animation: backlog-settle 0.52s var(--ease-spring);
}

@keyframes backlog-settle {
  0% {
    transform: scale(1.025);
    border-color: var(--accent);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 22%, transparent);
  }
  55% {
    transform: scale(0.995);
  }
  100% {
    transform: scale(1);
    border-color: var(--border);
    box-shadow: var(--shadow-sm);
  }
}

.backlog__list :deep(.backlog__ghost .card--row) {
  opacity: 0;
}

.backlog__list :deep(.backlog__ghost) {
  position: relative;
  min-height: 88px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--accent-soft) 70%, transparent);
  outline: 2px dashed color-mix(in srgb, var(--accent) 45%, transparent);
  outline-offset: -2px;
  opacity: 1 !important;
}

.backlog__list :deep(.backlog__drag) {
  z-index: 20;
}

.backlog__list :deep(.backlog__drag .card--row) {
  transform: scale(1.03);
  border-color: var(--accent);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.16),
    0 0 0 1px color-mix(in srgb, var(--accent) 25%, transparent);
  opacity: 0.98;
  transition: none;
  cursor: grabbing;
}

@media (prefers-reduced-motion: reduce) {
  .backlog__drag-hint-icon,
  .backlog__item--settled :deep(.card--row) {
    animation: none !important;
  }

  .backlog__list--reorder:not(.backlog__list--dragging) > .backlog__item,
  .backlog__item--pressing :deep(.card--row) {
    transition: none !important;
  }

  .backlog__list :deep(.backlog__drag .card--row) {
    transform: none;
  }
}

</style>


