<script setup lang="ts">
import { computed, ref } from 'vue'
import CoverImage from '@/components/media/CoverImage.vue'
import { TYPE_LABELS } from '@/types/media'
import type { SearchResult } from '@/types/media'

const props = defineProps<{
  result: SearchResult
  inBacklog?: boolean
}>()

const emit = defineEmits<{ add: [] }>()

const justAdded = ref(false)

const typeColor = computed(() => {
  const map = {
    movie: 'var(--movie)',
    series: 'var(--series)',
    book: 'var(--book)',
    game: 'var(--game)',
    album: 'var(--album)',
    other: 'var(--other)',
  }
  return map[props.result.type]
})

function handleAdd() {
  if (props.inBacklog) return
  justAdded.value = true
  emit('add')
  setTimeout(() => (justAdded.value = false), 600)
}
</script>

<template>
  <article class="result">
    <div class="result__cover-wrap">
      <CoverImage
        :src="result.coverUrl"
        :alt="`Capa de ${result.title}`"
        :fallback-letter="result.title.charAt(0)"
        :accent="typeColor"
        class="result__cover"
      />
    </div>
    <div class="result__info">
      <span class="result__type" :style="{ color: typeColor }">{{ TYPE_LABELS[result.type] }}</span>
      <h3 class="result__title">{{ result.title }}</h3>
      <p class="result__meta">
        <span v-if="result.year">{{ result.year }}</span>
        <span v-if="result.subtitle"> · {{ result.subtitle }}</span>
        <span v-if="result.rating"> · ★ {{ result.rating.toFixed(1) }}</span>
      </p>
      <p v-if="result.overview" class="result__overview">{{ result.overview }}</p>
    </div>
    <button
      class="result__btn tap-scale"
      :class="{
        'result__btn--added': inBacklog,
        'result__btn--pop': justAdded,
      }"
      type="button"
      :disabled="inBacklog"
      @click="handleAdd"
    >
      <span
        class="result__btn-icon"
        :class="inBacklog ? 'result__btn-icon--check' : 'result__btn-icon--plus'"
        aria-hidden="true"
      />
    </button>
  </article>
</template>

<style scoped>
.result {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 14px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.25s ease;
}

.result:active {
  box-shadow: var(--shadow-md);
}

.result__cover-wrap {
  width: 64px;
  height: 92px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-soft);
  box-shadow: var(--shadow-sm);
}

.result__cover {
  width: 100%;
  height: 100%;
}

.result__cover :deep(.cover-placeholder) {
  font-size: 1.4rem;
}

.result__info {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
}

.result__type {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.result__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  margin: 4px 0;
}

.result__meta {
  font-size: 12px;
  color: var(--text-tertiary);
}

.result__overview {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.45;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result__btn {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  align-self: center;
  padding: 0;
  line-height: 0;
  box-shadow: var(--shadow-sm);
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.result__btn-icon {
  width: 18px;
  height: 18px;
  background: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(0.34, 1.5, 0.64, 1);
}

.result__btn-icon--plus {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M12 5v14M5 12h14'/%3E%3C/svg%3E");
}

.result__btn-icon--check {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E");
}

.result__btn--pop .result__btn-icon {
  animation: add-pop 0.5s cubic-bezier(0.34, 1.6, 0.64, 1);
}

@keyframes add-pop {
  0% { transform: scale(1) rotate(0deg); }
  40% { transform: scale(1.4) rotate(90deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.result__btn--added {
  background: var(--game);
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .result__btn--pop .result__btn-icon {
    animation: none;
  }
}
</style>
