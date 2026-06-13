<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CoverImage from '@/components/media/CoverImage.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { TYPE_LABELS } from '@/types/media'
import type { BacklogItem } from '@/types/media'

const props = defineProps<{
  item: BacklogItem
  variant?: 'grid' | 'row' | 'strip'
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
  router.push(`/item/${props.item.id}`)
}
</script>

<template>
  <article
    class="card tap-scale"
    :class="`card--${variant ?? 'grid'}`"
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
      <p v-if="item.subtitle || item.year" class="card__meta">
        {{ item.subtitle || item.year }}
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
  transition: box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.card--row:active {
  box-shadow: var(--shadow-md);
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
