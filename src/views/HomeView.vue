<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AkButton, AkEmptyState, AkIcon, AkList, AkProgress, AkSectionHeader } from '@rafael_dias/akoma'
import { useBacklogStore } from '@/stores/backlog'
import MediaCard from '@/components/media/MediaCard.vue'
import { useCountUp } from '@/composables/useMotion'
import { MEDIA_TYPES, TYPE_COLORS, TYPE_LABELS } from '@/types/media'
import type { BacklogStatus } from '@/types/media'

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
  void router.push({ path: '/backlog', query: { status } })
}

const { display: totalDisplay, animate: animateTotal } = useCountUp(() => store.totalCount)

const typeBreakdown = computed(() =>
  MEDIA_TYPES.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    color: TYPE_COLORS[type],
    count: store.byType[type],
  })).filter((t) => t.count > 0),
)

onMounted(() => animateTotal())
watch(() => store.totalCount, () => animateTotal())
</script>

<template>
  <div class="ak-app-page ak-app-scroll">
    <div class="page-body stack--lg">
      <header class="reveal">
        <span class="page-label">Sua coleção</span>
        <h1 class="page-title">Mora</h1>
        <p class="home__tagline">Tudo que você quer ver, ler, jogar ou ouvir.</p>
      </header>

      <section class="reveal reveal-d1" aria-label="Resumo">
        <div class="home__total">
          <span class="home__total-num numeric">{{ totalDisplay }}</span>
          <span class="home__total-lbl">na fila</span>
        </div>

        <div class="stats-grid">
          <button
            v-for="card in statusCards"
            :key="card.status"
            class="stat-cell tap-scale"
            type="button"
            @click="goToStatus(card.status)"
          >
            <span class="stat-cell__value numeric">{{ card.value }}</span>
            <span class="stat-cell__label">{{ card.label }}</span>
          </button>
        </div>
      </section>

      <section v-if="typeBreakdown.length" class="reveal reveal-d2 stack">
        <AkSectionHeader title="Por categoria" />
        <div
          v-for="t in typeBreakdown"
          :key="t.type"
          class="type-row"
        >
          <span class="type-row__name">{{ t.label }}</span>
          <AkProgress
            class="type-row__bar"
            :value="t.count"
            :max="store.totalCount"
            :color="t.color"
            size="sm"
          />
          <span class="type-row__count numeric">{{ t.count }}</span>
        </div>
      </section>

      <section class="reveal reveal-d3">
        <AkSectionHeader title="Recentes">
          <template v-if="store.recentItems.length" #action>
            <AkButton variant="ghost" size="sm" @click="router.push('/backlog')">
              Ver tudo
            </AkButton>
          </template>
        </AkSectionHeader>

        <AkEmptyState
          v-if="!store.recentItems.length"
          title="Fila vazia"
          description="Busque mídias ou cadastre manualmente para começar."
        >
          <template #icon>
            <AkIcon name="bullet-list-outline" :size="24" />
          </template>
          <template #action>
            <AkButton @click="router.push('/search')">Começar a buscar</AkButton>
          </template>
        </AkEmptyState>

        <AkList v-else>
          <MediaCard
            v-for="(item, i) in store.recentItems"
            :key="item.id"
            :item="item"
            :divider="i < store.recentItems.length - 1"
          />
        </AkList>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home__tagline {
  margin-top: var(--space-2);
  font-size: var(--text-md);
  color: var(--text-secondary);
}

.home__total {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.home__total-num {
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--accent);
}

.home__total-lbl {
  font-size: var(--text-md);
  color: var(--text-secondary);
}

/* Flat stat band — borders instead of elevation (patterns.md). */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-block: 1px solid var(--border);
}

.stat-cell {
  padding: var(--space-4) var(--space-2);
  text-align: center;
  background: transparent;
  border: 0;
}

.stat-cell:not(:last-child) {
  border-right: 1px solid var(--border);
}

.stat-cell__value {
  display: block;
  font-size: var(--text-2xl);
  font-weight: 650;
}

.stat-cell__label {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-2xs);
  color: var(--text-secondary);
}

.type-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.type-row__name {
  width: 68px;
  flex-shrink: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.type-row__bar {
  flex: 1;
}

.type-row__count {
  width: 24px;
  text-align: right;
  font-size: var(--text-sm);
  font-weight: 650;
}
</style>
