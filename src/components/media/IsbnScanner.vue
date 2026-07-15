<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useBacklogStore } from '@/stores/backlog'
import { lookupBookByIsbn } from '@/services/api/openLibrary'
import SearchResultCard from '@/components/media/SearchResultCard.vue'
import LoadingShimmer from '@/components/ui/LoadingShimmer.vue'
import { formatIsbn, normalizeIsbn } from '@/utils/isbn'
import {
  createHtml5IsbnScanner,
  html5TorchSupported,
  ISBN_READER_ELEMENT_ID,
  refocusHtml5Scanner,
  scanIsbnFromImageFile,
  startHtml5IsbnScan,
  stopHtml5IsbnScan,
  toggleHtml5Torch,
} from '@/utils/isbnCamera'
import type { Html5Qrcode } from 'html5-qrcode'
import type { SearchResult } from '@/types/media'

const emit = defineEmits<{ added: [] }>()

const store = useBacklogStore()
const isbnInput = ref('')
const scanning = ref(false)
const photoLoading = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<SearchResult | null>(null)
const lastIsbn = ref<string | null>(null)
const torchOn = ref(false)
const canTorch = ref(false)

const photoInputRef = ref<HTMLInputElement | null>(null)
const scanner = createHtml5IsbnScanner() as Html5Qrcode
let detectedHandled = false

async function lookupIsbn(raw: string) {
  const isbn = normalizeIsbn(raw)
  if (!isbn) {
    error.value = 'Informe um ISBN válido com 10 ou 13 dígitos.'
    return
  }

  if (isbn === lastIsbn.value && result.value) return

  loading.value = true
  error.value = null
  result.value = null
  lastIsbn.value = isbn
  isbnInput.value = formatIsbn(isbn)

  try {
    const book = await lookupBookByIsbn(isbn)
    if (!book) {
      error.value = 'Nenhum livro encontrado para este ISBN.'
      return
    }
    result.value = book
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao buscar livro pelo ISBN'
  } finally {
    loading.value = false
  }
}

function cameraErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') {
      return 'Permissão da câmera negada. Libere o acesso ao site nas configurações do navegador.'
    }
    if (err.name === 'NotFoundError') {
      return 'Nenhuma câmera encontrada neste dispositivo.'
    }
    if (err.name === 'NotReadableError') {
      return 'A câmera está em uso por outro app. Feche-o e tente novamente.'
    }
  }

  return err instanceof Error
    ? err.message
    : 'Não foi possível acessar a câmera. Use a foto ou o ISBN manual.'
}

function handleDetected(raw: string) {
  if (detectedHandled) return
  detectedHandled = true
  void stopScanner()
  void lookupIsbn(raw)
}

async function startScanner() {
  if (scanning.value) return

  if (!window.isSecureContext) {
    error.value =
      'A câmera no celular exige HTTPS. Abra o app publicado, use “Fotografar código” ou o ISBN manual.'
    return
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    error.value = 'Este navegador não suporta acesso à câmera. Use a foto ou o ISBN manual.'
    return
  }

  error.value = null
  detectedHandled = false
  scanning.value = true
  torchOn.value = false
  canTorch.value = false

  try {
    await startHtml5IsbnScan(scanner, handleDetected)
    canTorch.value = html5TorchSupported(scanner)
  } catch (err) {
    await stopScanner()
    error.value = cameraErrorMessage(err)
  }
}

async function stopScanner() {
  await stopHtml5IsbnScan(scanner)
  scanning.value = false
  torchOn.value = false
  canTorch.value = false
}

async function handleTapToFocus() {
  if (!scanning.value) return
  await refocusHtml5Scanner(scanner)
}

async function handleTorchToggle() {
  if (!scanning.value) return
  const next = !torchOn.value
  const ok = await toggleHtml5Torch(scanner, next)
  if (ok) torchOn.value = next
}

function openPhotoCapture() {
  photoInputRef.value?.click()
}

async function handlePhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  photoLoading.value = true
  error.value = null
  detectedHandled = false

  const wasScanning = scanning.value
  if (wasScanning) await stopScanner()

  try {
    const isbn = await scanIsbnFromImageFile(scanner, file)
    if (!isbn) {
      error.value = 'Não foi possível ler o código na foto. Aproxime mais e tente outra imagem.'
      return
    }
    handleDetected(isbn)
  } catch {
    error.value = 'Não foi possível ler o código na foto. Tente com mais luz e foco no código.'
  } finally {
    photoLoading.value = false
    if (wasScanning && !detectedHandled) await startScanner()
  }
}

function handleManualLookup() {
  void stopScanner()
  void lookupIsbn(isbnInput.value)
}

function handleAdd() {
  if (!result.value) return
  store.addFromSearch(result.value)
  emit('added')
  result.value = null
  lastIsbn.value = null
  isbnInput.value = ''
}

onBeforeUnmount(() => {
  void stopScanner()
})
</script>

<template>
  <section class="isbn">
    <div class="isbn__header">
      <h3 class="isbn__title">Scanner de ISBN</h3>
      <p class="isbn__desc">
        Alinhe o código de barras na área destacada ou fotografe o verso do livro.
      </p>
    </div>

    <div
      class="isbn__scanner"
      :class="{ 'isbn__scanner--active': scanning }"
      @click="handleTapToFocus"
    >
      <div :id="ISBN_READER_ELEMENT_ID" class="isbn__reader" />
      <p v-if="!scanning" class="isbn__placeholder">
        Abra a câmera ou fotografe o código de barras do livro.
      </p>
      <p v-if="scanning" class="isbn__scanner-hint">Toque na imagem para focar</p>
    </div>

    <div class="isbn__actions">
      <button
        v-if="!scanning"
        class="isbn__btn isbn__btn--primary tap-scale"
        type="button"
        @click="startScanner"
      >
        Abrir câmera
      </button>
      <template v-else>
        <button class="isbn__btn tap-scale" type="button" @click="stopScanner">Parar câmera</button>
        <button
          v-if="canTorch"
          class="isbn__btn tap-scale"
          :class="{ 'isbn__btn--torch-on': torchOn }"
          type="button"
          @click="handleTorchToggle"
        >
          {{ torchOn ? 'Lanterna ligada' : 'Lanterna' }}
        </button>
      </template>

      <button
        class="isbn__btn isbn__btn--photo tap-scale"
        type="button"
        :disabled="photoLoading"
        @click="openPhotoCapture"
      >
        {{ photoLoading ? 'Lendo foto…' : 'Fotografar código' }}
      </button>
      <input
        ref="photoInputRef"
        class="isbn__photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        @change="handlePhotoSelected"
      />
    </div>

    <div class="isbn__manual">
      <label class="isbn__field">
        <span>ISBN manual</span>
        <input
          v-model="isbnInput"
          class="isbn__input"
          type="text"
          inputmode="numeric"
          placeholder="9788535914849"
          @keydown.enter.prevent="handleManualLookup"
        />
      </label>
      <button class="isbn__btn isbn__btn--primary tap-scale" type="button" @click="handleManualLookup">
        Buscar ISBN
      </button>
    </div>

    <p v-if="error" class="isbn__error">{{ error }}</p>

    <LoadingShimmer v-if="loading" />

    <SearchResultCard
      v-else-if="result"
      :result="result"
      :in-backlog="store.isInBacklog(result.externalId, result.type)"
      @add="handleAdd"
    />
  </section>
</template>

<style scoped>
.isbn {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.isbn__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.isbn__title {
  font-size: 18px;
}

.isbn__desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.45;
}

.isbn__scanner {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-strong);
  background: #111;
  min-height: 260px;
}

.isbn__scanner--active {
  border-style: solid;
  border-color: var(--book);
}

.isbn__reader {
  width: 100%;
  min-height: 260px;
}

.isbn__reader :deep(video) {
  width: 100% !important;
  height: min(52vh, 360px) !important;
  object-fit: contain !important;
}

.isbn__reader :deep(img) {
  display: none !important;
}

.isbn__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.72);
  pointer-events: none;
}

.isbn__scanner-hint {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  padding: 8px 10px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  pointer-events: none;
}

.isbn__actions,
.isbn__manual {
  display: flex;
  gap: 10px;
  align-items: end;
  flex-wrap: wrap;
}

.isbn__photo-input {
  display: none;
}

.isbn__field {
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.isbn__field span {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.isbn__input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--bg);
  font-size: 15px;
  color: var(--text);
}

.isbn__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.isbn__btn {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: var(--bg);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.isbn__btn:disabled {
  opacity: 0.6;
}

.isbn__btn--primary {
  background: var(--book);
  border-color: transparent;
  color: #fff;
}

.isbn__btn--photo {
  background: rgba(196, 146, 58, 0.12);
  border-color: rgba(196, 146, 58, 0.28);
  color: var(--book);
}

.isbn__btn--torch-on {
  background: rgba(196, 146, 58, 0.16);
  border-color: rgba(196, 146, 58, 0.35);
  color: var(--book);
}

.isbn__error {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: rgba(91, 76, 219, 0.08);
  border: 1px solid rgba(91, 76, 219, 0.16);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}
</style>
