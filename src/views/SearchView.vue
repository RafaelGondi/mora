<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { AkButton, AkInput, AkList, AkSheet } from '@rafael_dias/akoma'
import { useBacklogStore } from '@/stores/backlog'
import { searchMedia } from '@/services/search'
import CategoryPill from '@/components/ui/CategoryPill.vue'
import SearchResultCard from '@/components/media/SearchResultCard.vue'
import ManualEntryForm from '@/components/media/ManualEntryForm.vue'
import IsbnScanner from '@/components/media/IsbnScanner.vue'
import LoadingShimmer from '@/components/ui/LoadingShimmer.vue'
import NativeField from '@/components/ui/NativeField.vue'
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
const sheetOpen = computed({
  get: () => pendingResult.value !== null,
  set: (open: boolean) => {
    if (!open) pendingResult.value = null
  },
})
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
  <div class="ak-app-page ak-app-scroll">
    <div class="page-body stack--lg">
      <header class="reveal">
        <span class="page-label">Descobrir</span>
        <h1 class="page-title">Buscar</h1>
      </header>

      <div class="chip-row reveal reveal-d1">
        <CategoryPill
          v-for="type in MEDIA_TYPES"
          :key="type"
          :type="type"
          :active="activeType === type"
          @click="activeType = type"
        />
      </div>

      <template v-if="canSearch">
        <section class="stack reveal reveal-d2">
          <AkInput
            v-model="query"
            type="search"
            :placeholder="placeholders[activeType]"
            autocomplete="off"
          />

          <div class="search__alt-actions">
            <AkButton
              v-if="isBookType"
              variant="ghost"
              size="sm"
              @click="showIsbnScanner = !showIsbnScanner; showManual = showIsbnScanner ? false : showManual"
            >
              {{ showIsbnScanner ? 'Ocultar scanner de ISBN' : 'Escanear ISBN' }}
            </AkButton>

            <AkButton
              variant="ghost"
              size="sm"
              @click="showManual = !showManual; showIsbnScanner = showManual ? false : showIsbnScanner"
            >
              {{ showManual ? 'Ocultar cadastro manual' : 'Ou adicionar manualmente' }}
            </AkButton>
          </div>
        </section>

        <div v-if="showIsbnScanner && isBookType" ref="isbnScannerAnchor">
          <IsbnScanner @confirm="handleAdd" />
        </div>

        <div v-if="error" class="search__error">
          <p>{{ error }}</p>
          <small>Verifique sua conexão e tente novamente.</small>
        </div>

        <LoadingShimmer v-if="loading" />

        <AkList v-else-if="results.length">
          <SearchResultCard
            v-for="result in results"
            :key="`${result.type}-${result.externalId}`"
            :result="result"
            :in-backlog="store.isInBacklog(result.externalId, result.type)"
            @add="handleAdd(result)"
          />
        </AkList>

        <p v-else-if="query.trim() && !loading && !error" class="search__empty">
          Nenhum resultado para "{{ query }}"
        </p>
      </template>

      <ManualEntryForm
        v-if="showManual || !canSearch"
        :type="activeType"
        @submit="handleManual"
      />
    </div>

    <Transition name="toast-pop">
      <div v-if="addedToast" class="toast" role="status">
        <span aria-hidden="true">✓</span> Adicionado à fila
      </div>
    </Transition>

    <AkSheet v-model:open="sheetOpen" title="Confirmar cadastro" close-label="Fechar">
      <div class="sheet-body">
        <AkInput v-model="editTitle" label="Nome" />
        <AkInput v-model="editCreator" label="Autor" placeholder="Nome do autor" />
        <NativeField v-model="editYear" label="Ano" placeholder="2024" inputmode="numeric" :maxlength="4" />

        <div class="sheet-actions">
          <AkButton variant="secondary" @click="sheetOpen = false">Cancelar</AkButton>
          <AkButton :disabled="!editTitle.trim()" @click="confirmAdd">Adicionar</AkButton>
        </div>
      </div>
    </AkSheet>
  </div>
</template>

<style scoped>
.search__alt-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
}

.search__error {
  padding: var(--space-3) var(--space-4);
  background: var(--danger-soft);
  border: 1px solid color-mix(in srgb, var(--danger) 20%, transparent);
  border-radius: var(--card-radius);
}

.search__error p {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--danger);
  margin-bottom: var(--space-1);
}

.search__error small {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.search__empty {
  text-align: center;
  padding: var(--space-10) var(--space-5);
  color: var(--text-tertiary);
  font-size: var(--text-md);
}

</style>
