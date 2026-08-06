<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { AkButton, AkChip, AkEmptyState, AkIcon, AkIconButton, AkInput, AkList, AkPageHeader } from '@rafael_dias/akoma'
import { useBacklogStore } from '@/stores/backlog'
import MediaCard from '@/components/media/MediaCard.vue'
import CategoryPill from '@/components/ui/CategoryPill.vue'
import { haptic } from '@/utils/haptic'
import { MEDIA_TYPES, STATUS_OPTIONS, STATUS_VARIANTS, TYPE_LABELS } from '@/types/media'
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
  <div class="ak-app-page ak-app-scroll">
    <div class="page-body stack--lg">
      <AkPageHeader
        label="Coleção"
        title="Fila"
        :meta="`${filtered.length} de ${typeCount} na fila de ${TYPE_LABELS[filterType]}`"
        variant="flush"
      />

      <section class="stack">
        <div class="backlog__search-row">
          <AkInput
            v-model="filterCreator"
            class="flex-1"
            label="Diretor, autor, artista…"
            placeholder="Ex.: Juan Rulfo, Nolan…"
            type="search"
            autocomplete="off"
          />
          <AkIconButton
            v-if="filterCreator"
            class="backlog__clear"
            variant="ghost"
            label="Limpar busca"
            icon="x-outline"
            @click="clearCreator"
          />
        </div>

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

      <section class="stack">
        <div class="chip-row">
          <CategoryPill
            v-for="type in MEDIA_TYPES"
            :key="type"
            :type="type"
            :active="filterType === type"
            @click="filterType = type"
          />
        </div>

        <div class="chip-row">
          <AkChip
            v-for="s in STATUS_OPTIONS"
            :key="s.value"
            :active="filterStatus === s.value"
            :color="`var(--${STATUS_VARIANTS[s.value] === 'accent' ? 'accent' : STATUS_VARIANTS[s.value]})`"
            @click="filterStatus = filterStatus === s.value ? null : s.value"
          >
            {{ s.label }}
          </AkChip>
        </div>
      </section>

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
          <AkIcon name="bullet-list-outline" :size="24" />
        </template>
        <template v-if="!store.totalCount" #action>
          <AkButton @click="router.push('/search')">Buscar mídias</AkButton>
        </template>
      </AkEmptyState>

      <template v-else>
        <p class="backlog__hint">
          <AkIcon
            :name="canReorder ? 'swap-vertical-arrows-outline' : 'filter-outline'"
            :size="14"
          />
          {{
            canReorder
              ? 'Segure um instante e arraste para reorganizar.'
              : 'Limpe os filtros para reorganizar a fila.'
          }}
        </p>

        <AkList v-if="canReorder">
          <draggable
            :key="filterType"
            v-model="dragList"
            item-key="id"
            v-bind="dragOptions"
            class="backlog__list"
            :class="{ 'backlog__list--dragging': isDragging }"
            @choose="onChoose"
            @unchoose="onUnchoose"
            @start="onDragStart"
            @end="onDragEnd"
          >
            <template #item="{ element, index }">
              <div
                class="backlog__item"
                :class="{
                  'backlog__item--pressing': pressingId === element.id,
                  'backlog__item--settled': settledId === element.id,
                }"
              >
                <MediaCard
                  :item="element"
                  reorderable
                  :drag-active="isDragging"
                  :suppress-click="suppressCardClick"
                  :divider="index < dragList.length - 1"
                />
              </div>
            </template>
          </draggable>
        </AkList>

        <AkList v-else :key="`static-${filterType}`">
          <MediaCard
            v-for="(item, i) in filtered"
            :key="item.id"
            :item="item"
            :divider="i < filtered.length - 1"
          />
        </AkList>
      </template>
    </div>
  </div>
</template>

<style scoped>
.backlog__search-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.backlog__hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-tertiary);
}

/* Drag affordances — accent-tinted, no elevation (patterns.md). */
.backlog__list--dragging > .backlog__item:not(.backlog__ghost):not(.backlog__drag) {
  opacity: 0.55;
}

.backlog__list--dragging > .backlog__item.backlog__chosen:not(.backlog__ghost):not(.backlog__drag) {
  opacity: 0 !important;
  pointer-events: none;
}

.backlog__item--pressing :deep(.ak-list-row) {
  transform: scale(0.985);
  background: var(--accent-soft);
  border-radius: var(--radius-md);
  transition:
    transform 0.16s var(--ease-spring),
    background 0.16s var(--ease-smooth);
}

.backlog__item--settled :deep(.ak-list-row) {
  animation: backlog-settle 0.52s var(--ease-spring);
}

@keyframes backlog-settle {
  0% {
    transform: scale(1.025);
    background: var(--accent-soft);
  }
  55% {
    transform: scale(0.995);
  }
  100% {
    transform: scale(1);
    background: transparent;
  }
}

.backlog__list :deep(.backlog__ghost .ak-list-row) {
  opacity: 0;
}

.backlog__list :deep(.backlog__ghost) {
  position: relative;
  min-height: 80px;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  outline: 2px dashed color-mix(in srgb, var(--accent) 45%, transparent);
  outline-offset: -2px;
  opacity: 1 !important;
}

.backlog__list :deep(.backlog__drag) {
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-md);
}

@media (prefers-reduced-motion: reduce) {
  .backlog__item--pressing :deep(.ak-list-row),
  .backlog__item--settled :deep(.ak-list-row) {
    transition: none;
    animation: none;
  }
}
</style>
