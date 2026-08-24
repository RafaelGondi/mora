<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AkListRow } from '@rafael_dias/akoma'
import CoverImage from '@/components/media/CoverImage.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import {
  TYPE_COLORS,
  TYPE_LABELS,
  formatReadingPeriod,
  formatWhereToWatch,
  itemCreator,
  supportsReadingDates,
  supportsWhereToWatch,
} from '@/types/media'
import type { BacklogItem } from '@/types/media'

const props = defineProps<{
  item: BacklogItem
  reorderable?: boolean
  dragActive?: boolean
  suppressClick?: boolean
  divider?: boolean
}>()

const router = useRouter()

const typeColor = computed(() => TYPE_COLORS[props.item.type])

const meta = computed(() =>
  [itemCreator(props.item), props.item.year].filter(Boolean).join(' · '),
)

const readingPeriod = computed(() =>
  supportsReadingDates(props.item.type)
    ? formatReadingPeriod(props.item.readingStartedAt, props.item.readingFinishedAt)
    : undefined,
)

const watchOn = computed(() =>
  supportsWhereToWatch(props.item.type) ? formatWhereToWatch(props.item.whereToWatch) : undefined,
)

function openDetail() {
  if (props.suppressClick) return
  void router.push(`/item/${props.item.id}`)
}
</script>

<template>
  <AkListRow
    class="media-row"
    :class="{ 'media-row--dragging': dragActive }"
    padding="md"
    :divider="divider ?? true"
  >
    <template #leading>
      <div class="cover cover--row">
        <CoverImage
          :src="item.coverUrl"
          :alt="`Capa de ${item.title}`"
          :fallback-letter="item.title.charAt(0)"
          :accent="typeColor"
        />
      </div>
    </template>

    <button class="media-row__title row-title" type="button" @click="openDetail">
      {{ item.title }}
    </button>

    <template #subtitle>
      <div class="row-meta">
        <span class="cat-label" :style="{ color: typeColor }">{{ TYPE_LABELS[item.type] }}</span>
        <span v-if="meta" class="truncate">{{ meta }}</span>
      </div>
      <div v-if="readingPeriod || watchOn || item.userRating" class="row-meta">
        <span v-if="readingPeriod">{{ readingPeriod }}</span>
        <span v-if="watchOn">{{ watchOn }}</span>
        <span v-if="item.userRating" :aria-label="`Nota ${item.userRating} de 5`">
          <span aria-hidden="true">★</span> {{ item.userRating }}/5
        </span>
      </div>
    </template>

    <template #trailing>
      <div class="media-row__trailing">
        <StatusBadge :status="item.status" :type="item.type" />
        <span v-if="reorderable" class="media-row__grip" aria-hidden="true" />
      </div>
    </template>
  </AkListRow>
</template>

<style scoped>
.media-row :deep(.ak-list-row__content) {
  min-width: 0;
  overflow: hidden;
}

.media-row__title {
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 650;
  font-size: var(--text-base);
  letter-spacing: -0.01em;
  text-align: left;
}

.media-row__title:focus-visible {
  outline: none;
  border-radius: var(--radius-sm);
  box-shadow: var(--focus-ring);
}

.media-row__trailing {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

/* Drag affordance — the row itself is the handle when reorderable. */
.media-row__grip {
  width: 16px;
  height: 16px;
  background: var(--text-tertiary);
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M4 9h16M4 15h16'/%3E%3C/svg%3E");
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  cursor: grab;
}

.media-row--dragging {
  background: var(--bg-soft);
  border-radius: var(--radius-md);
}
</style>
