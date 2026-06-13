<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBacklogStore } from '@/stores/backlog'
import CoverImage from '@/components/media/CoverImage.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { STATUS_OPTIONS, TYPE_LABELS } from '@/types/media'
import type { BacklogStatus } from '@/types/media'

const route = useRoute()
const router = useRouter()
const store = useBacklogStore()

const item = computed(() => store.getItem(route.params.id as string))

const typeColor = computed(() => {
  if (!item.value) return 'var(--accent)'
  const map = {
    movie: 'var(--movie)',
    series: 'var(--series)',
    book: 'var(--book)',
    game: 'var(--game)',
    album: 'var(--album)',
    other: 'var(--other)',
  }
  return map[item.value.type]
})

function updateStatus(status: BacklogStatus) {
  if (item.value) store.updateStatus(item.value.id, status)
}

function updateNotes(e: Event) {
  if (item.value) store.updateNotes(item.value.id, (e.target as HTMLTextAreaElement).value)
}

function remove() {
  if (item.value && confirm('Remover este item da fila?')) {
    store.removeItem(item.value.id)
    router.push('/backlog')
  }
}
</script>

<template>
  <div v-if="item" class="detail">
    <button class="detail__back tap-scale" type="button" @click="router.back()">← Voltar</button>

    <div class="detail__hero reveal">
      <div class="detail__cover-wrap">
        <CoverImage
          :src="item.coverUrl"
          :alt="`Capa de ${item.title}`"
          :fallback-letter="item.title.charAt(0)"
          :accent="typeColor"
          class="detail__cover"
        />
      </div>
      <div class="detail__info">
        <span class="detail__type" :style="{ color: typeColor }">{{ TYPE_LABELS[item.type] }}</span>
        <h1>{{ item.title }}</h1>
        <p v-if="item.subtitle || item.year" class="detail__meta">
          {{ [item.subtitle, item.year].filter(Boolean).join(' · ') }}
        </p>
        <StatusBadge :status="item.status" />
      </div>
    </div>

    <section v-if="item.overview" class="detail__section reveal reveal-d1">
      <h2>Sinopse</h2>
      <p>{{ item.overview }}</p>
    </section>

    <section class="detail__section reveal reveal-d2">
      <h2>Status</h2>
      <div class="detail__status-grid">
        <button
          v-for="s in STATUS_OPTIONS"
          :key="s.value"
          class="status-btn tap-scale"
          :class="{ 'status-btn--on': item.status === s.value }"
          type="button"
          @click="updateStatus(s.value)"
        >
          {{ s.label }}
        </button>
      </div>
    </section>

    <section class="detail__section reveal reveal-d3">
      <h2>Notas pessoais</h2>
      <textarea
        class="detail__notes"
        :value="item.notes ?? ''"
        placeholder="O que você achou? Por que quer ver?"
        rows="4"
        @change="updateNotes"
      />
    </section>

    <button class="detail__remove tap-scale reveal reveal-d4" type="button" @click="remove">
      Remover da fila
    </button>
  </div>

  <div v-else class="detail__missing">
    <p>Item não encontrado.</p>
    <button type="button" @click="router.push('/backlog')">Voltar à fila</button>
  </div>
</template>

<style scoped>
.detail {
  padding: calc(16px + var(--safe-top)) 20px 24px;
}

.detail__back {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.detail__hero {
  display: flex;
  gap: 20px;
  margin-bottom: 28px;
}

.detail__cover-wrap {
  width: 120px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  background: var(--bg-soft);
  animation: cover-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes cover-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.detail__cover {
  width: 100%;
  aspect-ratio: 2/3;
}

.detail__cover :deep(.cover-placeholder) {
  font-size: 3rem;
}

.detail__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.detail__type {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.detail__info h1 {
  font-size: 24px;
  line-height: 1.15;
}

.detail__meta {
  font-size: 14px;
  color: var(--text-secondary);
}

.detail__section {
  margin-bottom: 24px;
}

.detail__section h2 {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 10px;
}

.detail__section p {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.detail__status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.status-btn {
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: var(--bg-elevated);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.status-btn--on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(91, 76, 219, 0.25);
}

.detail__notes {
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  font-size: 15px;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.detail__notes:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.detail__remove {
  width: 100%;
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: #dc2626;
  font-weight: 600;
  font-size: 14px;
  background: var(--bg-elevated);
  transition: all 0.25s ease;
}

.detail__remove:active {
  background: rgba(220, 38, 38, 0.06);
}

.detail__missing {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .detail__cover-wrap {
    animation: none;
  }

  .status-btn--on {
    transform: none;
  }
}
</style>
