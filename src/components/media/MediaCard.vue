<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CoverImage from '@/components/media/CoverImage.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { TYPE_LABELS, itemCreator, supportsWhereToWatch, formatWhereToWatch } from '@/types/media'
import type { BacklogItem } from '@/types/media'

const props = defineProps<{
  item: BacklogItem
  variant?: 'grid' | 'row' | 'strip'
  reorderable?: boolean
  dragActive?: boolean
  suppressClick?: boolean
}>()

const router = useRouter()

const typeColor = computed(() => {
  const map = {
    movie: 'var(--movie)',
    series: 'var(--series)',
    book: 'var(--book)',
    game: 'var(--game)',
    album: 'var(--album)',
    other: 'var(--other)',
  }
  return map[props.item.type]
})

function openDetail() {
  if (props.suppressClick) return
  router.push(`/item/${props.item.id}`)
}
</script>

<template>
  <article
    class="card"
    :class="[
      `card--${variant ?? 'grid'}`,
      {
        'card--reorderable': reorderable && variant === 'row',
        'card--drag-active': dragActive && variant === 'row',
        'tap-scale': !reorderable,
      },
    ]"
    role="button"
    tabindex="0"
    @click="openDetail"
    @keydown.enter="openDetail"
  >
    <div class="card__cover-wrap">
      <CoverImage
        :src="item.coverUrl"
        :alt="`Capa de ${item.title}`"
        :fallback-letter="item.title.charAt(0)"
        :accent="typeColor"
        class="card__cover"
      />
      <div class="card__shine" aria-hidden="true" />
    </div>
    <div class="card__body">
      <span class="card__type" :style="{ color: typeColor }">{{ TYPE_LABELS[item.type] }}</span>
      <h3 class="card__title">{{ item.title }}</h3>
      <p v-if="itemCreator(item) || item.year" class="card__meta">
        {{ [itemCreator(item), item.year].filter(Boolean).join(' · ') }}
      </p>
      <p v-if="supportsWhereToWatch(item.type) && formatWhereToWatch(item.whereToWatch)" class="card__watch">
        {{ formatWhereToWatch(item.whereToWatch) }}
      </p>
      <p v-if="item.userRating" class="card__rating" :aria-label="`Nota ${item.userRating} de 5`">
        <span aria-hidden="true">★</span> {{ item.userRating }}/5
      </p>
      <StatusBadge v-if="variant !== 'strip'" :status="item.status" />
    </div>
  </article>
</template>

<style scoped>
.card {
  cursor: pointer;
  text-align: left;
}

.card--grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card--row {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow 0.28s var(--ease-smooth),
    transform 0.28s var(--ease-spring),
    border-color 0.28s var(--ease-smooth),
    background 0.28s var(--ease-smooth);
}

.card--row:active:not(.card--reorderable) {
  box-shadow: var(--shadow-md);
}

.card--row.card--reorderable {
  cursor: grab;
  -webkit-user-select: none;
  user-select: none;
}

.card--row.card--reorderable:active,
.card--row.card--drag-active {
  cursor: grabbing;
}

.card--row.card--reorderable:active .card__cover :deep(.cover-img),
.card--row.card--reorderable:active .card__shine,
.card--row.card--drag-active .card__cover :deep(.cover-img),
.card--row.card--drag-active .card__shine {
  transform: none;
}

.card--strip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 128px;
  flex-shrink: 0;
  scroll-snap-align: start;
}

.card__cover-wrap {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--bg-soft);
  box-shadow: var(--shadow-sm);
}

.card--grid .card__cover-wrap,
.card--strip .card__cover-wrap {
  aspect-ratio: 2/3;
}

.card--row .card__cover-wrap {
  width: 56px;
  height: 84px;
  flex-shrink: 0;
}

.card__cover {
  width: 100%;
  height: 100%;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.card:active .card__cover :deep(.cover-img) {
  transform: scale(1.06);
}

.card__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    125deg,
    transparent 40%,
    rgba(255, 255, 255, 0.25) 50%,
    transparent 60%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.card:active .card__shine {
  transform: translateX(100%);
}

.card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.card--row .card__body {
  flex: 1;
}

.card__type {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card__title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card--row .card__title {
  font-size: 15px;
  -webkit-line-clamp: 1;
}

.card__meta {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__rating {
  font-size: 12px;
  font-weight: 600;
  color: #c99212;
  width: fit-content;
}

.card__rating span {
  font-size: 11px;
}

.card__watch {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  width: fit-content;
}

@media (prefers-reduced-motion: reduce) {
  .card__cover,
  .card__shine,
  .card--row {
    transition: none;
  }

  .card:active .card__cover,
  .card:active .card__shine {
    transform: none;
  }
}
</style>
