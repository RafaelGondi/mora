<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useBacklogStore } from '@/stores/backlog'
import { searchMedia } from '@/services/search'
import CategoryPill from '@/components/ui/CategoryPill.vue'
import SearchResultCard from '@/components/media/SearchResultCard.vue'
import ManualEntryForm from '@/components/media/ManualEntryForm.vue'
import LoadingShimmer from '@/components/ui/LoadingShimmer.vue'
import { MEDIA_TYPES, hasAutocomplete } from '@/types/media'
import type { MediaType } from '@/types/media'

const store = useBacklogStore()

const query = ref('')
const activeType = ref<MediaType>('movie')
const results = ref<Awaited<ReturnType<typeof searchMedia>>>([])
const loading = ref(false)
const error = ref<string | null>(null)
const addedToast = ref(false)
const showManual = ref(false)

const canSearch = computed(() => hasAutocomplete(activeType.value))

const placeholders: Record<MediaType, string> = {
  movie: 'Nome do filme...',
  series: 'Nome da série...',
  book: 'Título ou autor...',
  game: 'Nome do jogo...',
  album: 'Álbum ou artista...',
  other: '',
}

let debounceTimer: ReturnType<typeof setTimeout>

watch(activeType, () => {
  query.value = ''
  results.value = []
  error.value = null
  showManual.value = activeType.value === 'other'
})

watch([query, activeType], () => {
  clearTimeout(debounceTimer)
  if (!canSearch.value || !query.value.trim()) {
    results.value = []
    error.value = null
    return
  }
  debounceTimer = setTimeout(() => performSearch(), 400)
})

async function performSearch() {
  loading.value = true
  error.value = null
  try {
    results.value = await searchMedia(query.value, activeType.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro na busca'
    results.value = []
  } finally {
    loading.value = false
  }
}

function notifyAdded() {
  addedToast.value = true
  setTimeout(() => (addedToast.value = false), 2000)
}

function handleAdd(result: (typeof results.value)[number]) {
  store.addFromSearch(result)
  notifyAdded()
}

function handleManual(data: {
  title: string
  creator?: string
  year?: string
  coverUrl?: string
  overview?: string
  whereToWatch?: string
}) {
  store.addManual({ type: activeType.value, ...data })
  notifyAdded()
}
</script>

<template>
  <div class="search">
    <header class="search__header reveal">
      <span class="page-label">Descobrir</span>
      <h1 class="page-title">Buscar</h1>
    </header>

    <div class="search__types reveal reveal-d1">
      <CategoryPill
        v-for="type in MEDIA_TYPES"
        :key="type"
        :type="type"
        :active="activeType === type"
        @click="activeType = type"
      />
    </div>

    <template v-if="canSearch">
      <div class="search__input-wrap reveal reveal-d2" :class="{ 'search__input-wrap--active': query }">
        <span class="search__icon" aria-hidden="true" />
        <input
          v-model="query"
          class="search__input"
          type="search"
          :placeholder="placeholders[activeType]"
          autocomplete="off"
          enterkeyhint="search"
        />
      </div>

      <button class="search__manual-toggle" type="button" @click="showManual = !showManual">
        {{ showManual ? 'Ocultar cadastro manual' : 'Ou adicionar manualmente' }}
      </button>

      <div v-if="error" class="search__error">
        <p>{{ error }}</p>
        <small>Verifique sua conexão e tente novamente.</small>
      </div>

      <LoadingShimmer v-if="loading" />

      <TransitionGroup v-else-if="results.length" tag="div" name="list" class="search__results">
        <SearchResultCard
          v-for="result in results"
          :key="`${result.type}-${result.externalId}`"
          :result="result"
          :in-backlog="store.isInBacklog(result.externalId, result.type)"
          @add="handleAdd(result)"
        />
      </TransitionGroup>

      <p v-else-if="query.trim() && !loading && !error" class="search__empty">
        Nenhum resultado para "{{ query }}"
      </p>
    </template>

    <ManualEntryForm
      v-if="showManual || !canSearch"
      :type="activeType"
      @submit="handleManual"
    />

    <Transition name="toast-pop">
      <div v-if="addedToast" class="toast" role="status">
        <span class="toast__check">✓</span> Adicionado à fila
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search {
  padding: calc(28px + var(--safe-top)) 20px 24px;
}

.search__header {
  margin-bottom: 20px;
}

.search__header .page-label {
  display: block;
  margin-bottom: 4px;
}

.search__types {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  overflow-y: visible;
  margin: 0 -20px 20px;
  padding: 6px 20px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.search__types::-webkit-scrollbar {
  display: none;
}

.search__input-wrap {
  position: relative;
  margin-bottom: 12px;
}

.search__input-wrap--active .search__icon {
  background: var(--accent);
  animation: search-pulse 1.2s ease-in-out infinite;
}

@keyframes search-pulse {
  0%, 100% { transform: translateY(-50%) scale(1); }
  50% { transform: translateY(-50%) scale(1.1); }
}

.search__icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  background: var(--text-tertiary);
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E");
  mask-size: contain;
  transition: background 0.25s ease;
}

.search__input {
  width: 100%;
  padding: 15px 16px 15px 46px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  font-size: 16px;
  color: var(--text);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.search__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.search__manual-toggle {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 20px;
  padding: 4px 0;
}

.search__error {
  padding: 14px 16px;
  background: rgba(91, 76, 219, 0.06);
  border: 1px solid rgba(91, 76, 219, 0.15);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}

.search__error p {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
}

.search__error small {
  font-size: 12px;
  color: var(--text-secondary);
}

.search__results {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.search__empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-tertiary);
  font-size: 14px;
}

.toast {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--safe-bottom) + 16px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--toast-bg);
  color: var(--toast-fg);
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 600;
  box-shadow: var(--shadow-md);
  z-index: 200;
}

.toast__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: var(--game);
  border-radius: 50%;
  font-size: 11px;
}

@media (prefers-reduced-motion: reduce) {
  .search__input-wrap--active .search__icon {
    animation: none;
  }
}
</style>
