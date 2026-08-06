<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { useBacklogStore } from '@/stores/backlog'
import { searchMedia } from '@/services/search'
import CategoryPill from '@/components/ui/CategoryPill.vue'
import SearchResultCard from '@/components/media/SearchResultCard.vue'
import ManualEntryForm from '@/components/media/ManualEntryForm.vue'
import IsbnScanner from '@/components/media/IsbnScanner.vue'
import LoadingShimmer from '@/components/ui/LoadingShimmer.vue'
import { MEDIA_TYPES, hasAutocomplete } from '@/types/media'
import type { MediaType, SearchResult } from '@/types/media'

const store = useBacklogStore()

const query = ref('')
const activeType = ref<MediaType>('movie')
const results = ref<Awaited<ReturnType<typeof searchMedia>>>([])
const loading = ref(false)
const error = ref<string | null>(null)
const addedToast = ref(false)
const showManual = ref(false)
const showIsbnScanner = ref(false)
const isbnScannerAnchor = ref<HTMLElement | null>(null)

const pendingResult = ref<SearchResult | null>(null)
const editTitle = ref('')
const editCreator = ref('')
const editYear = ref('')

const canSearch = computed(() => hasAutocomplete(activeType.value))
const isBookType = computed(() => activeType.value === 'book')

const placeholders: Record<MediaType, string> = {
  movie: 'Nome do filme...',
  series: 'Nome da série...',
  book: 'Título ou autor...',
  game: 'Nome do jogo...',
  album: 'Álbum ou artista...',
  other: '',
}

let debounceTimer: ReturnType<typeof setTimeout>

watch(showIsbnScanner, async (visible) => {
  if (!visible) return
  await nextTick()
  isbnScannerAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})

watch(activeType, () => {
  query.value = ''
  results.value = []
  error.value = null
  showManual.value = activeType.value === 'other'
  showIsbnScanner.value = false
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

function handleAdd(result: SearchResult) {
  pendingResult.value = result
  editTitle.value = result.title
  editCreator.value = result.creator ?? result.subtitle ?? ''
  editYear.value = result.year ?? ''
}

function confirmAdd() {
  if (!pendingResult.value) return
  store.addFromSearch({
    ...pendingResult.value,
    title: editTitle.value.trim() || pendingResult.value.title,
    creator: editCreator.value.trim() || undefined,
    year: editYear.value.trim() || undefined,
  })
  pendingResult.value = null
  notifyAdded()
}

function cancelAdd() {
  pendingResult.value = null
}

function handleManual(data: {
  title: string
  creator?: string
  year?: string
  coverUrl?: string
  overview?: string
  whereToWatch?: string[]
  durationMinutes?: number
  readingStartedAt?: string
  readingFinishedAt?: string
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

      <div class="search__alt-actions">
        <button
          v-if="isBookType"
          class="search__manual-toggle"
          type="button"
          @click="showIsbnScanner = !showIsbnScanner; showManual = showIsbnScanner ? false : showManual"
        >
          {{ showIsbnScanner ? 'Ocultar scanner de ISBN' : 'Escanear ISBN' }}
        </button>

        <button class="search__manual-toggle" type="button" @click="showManual = !showManual; showIsbnScanner = showManual ? false : showIsbnScanner">
          {{ showManual ? 'Ocultar cadastro manual' : 'Ou adicionar manualmente' }}
        </button>
      </div>

      <div v-if="showIsbnScanner && isBookType" ref="isbnScannerAnchor">
        <IsbnScanner @confirm="handleAdd" />
      </div>

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

    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="pendingResult" class="sheet-backdrop" @click.self="cancelAdd">
          <div class="sheet" role="dialog" aria-modal="true" aria-label="Editar antes de adicionar">
            <div class="sheet__handle" />
            <h2 class="sheet__heading">Confirmar cadastro</h2>

            <div class="sheet__fields">
              <label class="sheet__field">
                <span>Nome</span>
                <input v-model="editTitle" type="text" />
              </label>
              <label class="sheet__field">
                <span>Autor</span>
                <input v-model="editCreator" type="text" placeholder="Nome do autor" />
              </label>
              <label class="sheet__field">
                <span>Ano</span>
                <input v-model="editYear" type="text" inputmode="numeric" placeholder="2024" maxlength="4" />
              </label>
            </div>

            <div class="sheet__actions">
              <button class="sheet__cancel" type="button" @click="cancelAdd">Cancelar</button>
              <button class="sheet__confirm" type="button" :disabled="!editTitle.trim()" @click="confirmAdd">Adicionar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
  padding: 4px 0;
}

.search__alt-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 20px;
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

<style>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 300;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 12px 20px calc(28px + var(--safe-bottom));
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-md);
}

.sheet__handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--border-strong);
  margin: 0 auto 4px;
}

.sheet__heading {
  font-size: 17px;
  font-weight: 700;
}

.sheet__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sheet__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sheet__field span {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.sheet__field input {
  padding: 12px 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--bg);
  font-size: 15px;
  color: var(--text);
}

.sheet__field input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.sheet__actions {
  display: flex;
  gap: 10px;
}

.sheet__cancel {
  flex: 1;
  padding: 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg);
}

.sheet__confirm {
  flex: 2;
  padding: 14px;
  background: var(--accent);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  transition: background var(--transition);
}

.sheet__confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sheet__confirm:not(:disabled):active {
  background: var(--accent-hover);
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}
</style>
