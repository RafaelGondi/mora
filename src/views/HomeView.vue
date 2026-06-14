<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBacklogStore } from '@/stores/backlog'
import MediaCard from '@/components/media/MediaCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useCountUp } from '@/composables/useMotion'
import { TYPE_LABELS } from '@/types/media'
import type { BacklogStatus, MediaType } from '@/types/media'

const store = useBacklogStore()
const router = useRouter()

const HOME_STATUS_LABELS: Partial<Record<BacklogStatus, string>> = {
  want: 'Quero ver',
  in_progress: 'Andamento',
  completed: 'Feitos',
}

const statusCards = computed(() =>
  (['want', 'in_progress', 'completed'] as BacklogStatus[]).map((status) => ({
    status,
    label: HOME_STATUS_LABELS[status] ?? status,
    value: store.byStatus[status],
  })),
)

function goToStatus(status: BacklogStatus) {
  router.push({ path: '/backlog', query: { status } })
}

const { display: totalDisplay, animate: animateTotal } = useCountUp(() => store.totalCount)

const typeBreakdown = computed(() =>
  (['movie', 'series', 'book', 'game', 'album', 'other'] as MediaType[])
    .map((type) => ({ type, label: TYPE_LABELS[type], count: store.byType[type] }))
    .filter((t) => t.count > 0),
)

onMounted(() => animateTotal())
watch(() => store.totalCount, () => animateTotal())
</script>

<template>
  <div class="home">
    <header class="home__header reveal">
      <span class="page-label">Sua coleção</span>
      <h1 class="page-title">
        Mora<span class="home__dot" aria-hidden="true">.</span>
      </h1>
      <p class="home__tagline">Tudo que você quer ver, ler, jogar ou ouvir.</p>
    </header>

    <section class="summary reveal reveal-d1" aria-label="Resumo">
      <div class="summary__hero">
        <span class="summary__num">{{ totalDisplay }}</span>
        <span class="summary__label">na fila</span>
      </div>
      <div class="summary__stats">
        <button
          v-for="card in statusCards"
          :key="card.status"
          class="summary__stat tap-scale"
          type="button"
          @click="goToStatus(card.status)"
        >
          <span class="summary__stat-val">{{ card.value }}</span>
          <span class="summary__stat-lbl">{{ card.label }}</span>
        </button>
      </div>
    </section>

    <div v-if="typeBreakdown.length" class="types reveal reveal-d2">
      <div v-for="t in typeBreakdown" :key="t.type" class="types__row">
        <span class="types__dot" :class="`types__dot--${t.type}`" />
        <span class="types__name">{{ t.label }}</span>
        <div class="types__track">
          <div
            class="types__fill"
            :class="`types__fill--${t.type}`"
            :style="{ width: `${(t.count / store.totalCount) * 100}%` }"
          />
        </div>
        <span class="types__count">{{ t.count }}</span>
      </div>
    </div>

    <section class="recent reveal reveal-d3">
      <div class="section-head">
        <h2>Recentes</h2>
        <button
          v-if="store.recentItems.length"
          class="section-head__link tap-scale"
          type="button"
          @click="router.push('/backlog')"
        >
          Ver tudo →
        </button>
      </div>

      <EmptyState
        v-if="!store.recentItems.length"
        title="Fila vazia"
        description="Busque mídias ou cadastre manualmente para começar."
        action-label="Começar a buscar"
        @action="router.push('/search')"
      />

      <div v-else class="recent__list">
        <MediaCard
          v-for="item in store.recentItems"
          :key="item.id"
          :item="item"
          variant="row"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding: calc(28px + var(--safe-top)) 20px 24px;
}

.home__header {
  margin-bottom: 28px;
}

.home__header .page-label {
  display: block;
  margin-bottom: 4px;
}

.home__dot {
  color: var(--accent);
  animation: dot-pulse 2.5s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.home__tagline {
  margin-top: 8px;
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.summary__hero {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.summary__num {
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.summary__label {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
}

.summary__stats {
  display: flex;
  gap: 12px;
}

.summary__stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  background: var(--bg);
  border-radius: var(--radius-md);
  border: none;
  text-align: left;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.summary__stat:active {
  transform: scale(0.97);
}

.summary__stat-val {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.summary__stat-lbl {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.types {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 32px;
}

.types__row {
  display: grid;
  grid-template-columns: 8px 52px 1fr 24px;
  align-items: center;
  gap: 10px;
}

.types__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.types__dot--movie { background: var(--movie); }
.types__dot--series { background: var(--series); }
.types__dot--book { background: var(--book); }
.types__dot--game { background: var(--game); }
.types__dot--album { background: var(--album); }
.types__dot--other { background: var(--other); }

.types__name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.types__track {
  height: 6px;
  background: var(--bg-muted);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.types__fill {
  height: 100%;
  border-radius: var(--radius-full);
  min-width: 4px;
  transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.types__fill--movie { background: var(--movie); }
.types__fill--series { background: var(--series); }
.types__fill--book { background: var(--book); }
.types__fill--game { background: var(--game); }
.types__fill--album { background: var(--album); }
.types__fill--other { background: var(--other); }

.types__count {
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  color: var(--text-tertiary);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.section-head h2 {
  font-size: 20px;
}

.section-head__link {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.recent__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.recent__list :deep(.card--row) {
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .home__dot {
    animation: none;
  }

  .types__fill {
    transition: none;
  }
}
</style>
