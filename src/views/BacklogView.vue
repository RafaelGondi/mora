<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBacklogStore } from '@/stores/backlog'
import MediaCard from '@/components/media/MediaCard.vue'
import CategoryPill from '@/components/ui/CategoryPill.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { MEDIA_TYPES, STATUS_OPTIONS } from '@/types/media'
import type { BacklogStatus, MediaType } from '@/types/media'

const store = useBacklogStore()
const router = useRouter()

const filterType = ref<MediaType | null>(null)
const filterStatus = ref<BacklogStatus | null>(null)

const filtered = computed(() => store.filteredItems(filterType.value, filterStatus.value))
</script>

<template>
  <div class="backlog">
    <header class="backlog__header reveal">
      <span class="page-label">Coleção</span>
      <h1 class="page-title">Fila</h1>
      <p class="backlog__count">{{ filtered.length }} de {{ store.totalCount }} itens</p>
    </header>

    <div class="backlog__filters reveal reveal-d1">
      <div class="filter-scroll">
        <button
          class="filter-all tap-scale"
          :class="{ 'filter-all--on': !filterType }"
          type="button"
          @click="filterType = null"
        >
          Todos
        </button>
        <CategoryPill
          v-for="type in MEDIA_TYPES"
          :key="type"
          :type="type"
          :active="filterType === type"
          @click="filterType = filterType === type ? null : type"
        />
      </div>

      <div class="status-row">
        <button
          v-for="s in STATUS_OPTIONS"
          :key="s.value"
          class="status-chip tap-scale"
          :class="{ 'status-chip--on': filterStatus === s.value }"
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

    <TransitionGroup v-else name="list" tag="div" class="backlog__list">
      <MediaCard v-for="item in filtered" :key="item.id" :item="item" variant="row" />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.backlog {
  padding: calc(28px + var(--safe-top)) 20px 24px;
}

.backlog__header {
  margin-bottom: 24px;
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

.filter-all {
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  white-space: nowrap;
  transition: all 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.filter-all--on {
  background: var(--fill-strong);
  color: var(--on-fill-strong);
  border-color: var(--fill-strong);
  box-shadow: var(--shadow-sm);
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
  background: var(--accent-soft);
  border-color: transparent;
  color: var(--accent);
}

.backlog__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}
</style>
