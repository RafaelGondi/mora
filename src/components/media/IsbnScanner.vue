<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { AkButton, AkList, AkSectionHeader } from '@rafael_dias/akoma'
import { useBacklogStore } from '@/stores/backlog'
import { lookupBookByIsbn } from '@/services/api/books'
import SearchResultCard from '@/components/media/SearchResultCard.vue'
import LoadingShimmer from '@/components/ui/LoadingShimmer.vue'
import NativeField from '@/components/ui/NativeField.vue'
import { formatIsbn, normalizeIsbn } from '@/utils/isbn'
import {
  createHtml5IsbnScanner,
  html5TorchSupported,
  refocusHtml5Scanner,
  scanIsbnFromImageFile,
  startHtml5IsbnScan,
  stopHtml5IsbnScan,
  toggleHtml5Torch,
} from '@/utils/isbnCamera'
import type { Html5Qrcode } from 'html5-qrcode'
import type { SearchResult } from '@/types/media'

const emit = defineEmits<{ confirm: [result: SearchResult] }>()

const store = useBacklogStore()
const readerElementId = `isbn-barcode-reader-${Math.random().toString(36).slice(2, 9)}`
const scanner = shallowRef<Html5Qrcode | null>(null)
const scannerReady = ref(false)

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
let detectedHandled = false

async function ensureScanner(): Promise<Html5Qrcode> {
  if (scanner.value) return scanner.value
  await nextTick()
  scanner.value = createHtml5IsbnScanner(readerElementId)
  scannerReady.value = true
  return scanner.value
}

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
      error.value = 'Nenhum livro encontrado para este ISBN. Tente buscar pelo título ou cadastrar manualmente.'
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
      'A câmera no celular exige HTTPS. Abra o app publicado, use "Fotografar código" ou o ISBN manual.'
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
    const activeScanner = await ensureScanner()
    await startHtml5IsbnScan(activeScanner, handleDetected)
    canTorch.value = html5TorchSupported(activeScanner)
  } catch (err) {
    await stopScanner()
    error.value = cameraErrorMessage(err)
  }
}

async function stopScanner() {
  if (scanner.value) {
    await stopHtml5IsbnScan(scanner.value)
  }
  scanning.value = false
  torchOn.value = false
  canTorch.value = false
}

async function handleTapToFocus() {
  if (!scanning.value || !scanner.value) return
  await refocusHtml5Scanner(scanner.value)
}

async function handleTorchToggle() {
  if (!scanning.value || !scanner.value) return
  const next = !torchOn.value
  const ok = await toggleHtml5Torch(scanner.value, next)
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
    const activeScanner = await ensureScanner()
    const isbn = await scanIsbnFromImageFile(activeScanner, file)
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
  emit('confirm', result.value)
  result.value = null
  lastIsbn.value = null
  isbnInput.value = ''
}

onMounted(async () => {
  await nextTick()
  try {
    await ensureScanner()
    await startScanner()
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Não foi possível inicializar o scanner de ISBN.'
  }
})

onBeforeUnmount(() => {
  void stopScanner()
  scanner.value = null
})
</script>


<template>
  <section class="isbn stack--md">
    <div>
      <AkSectionHeader title="Scanner de ISBN" />
      <p class="isbn__desc">
        Alinhe o código de barras na área destacada ou fotografe o verso do livro.
      </p>
    </div>

    <div
      class="isbn__scanner"
      :class="{ 'isbn__scanner--active': scanning }"
      @click="handleTapToFocus"
    >
      <div :id="readerElementId" class="isbn__reader" />
      <p v-if="!scanning && scannerReady" class="isbn__placeholder">
        Abra a câmera ou fotografe o código de barras do livro.
      </p>
      <p v-else-if="!scannerReady" class="isbn__placeholder">Preparando scanner…</p>
      <p v-if="scanning" class="isbn__scanner-hint">Toque na imagem para focar</p>
    </div>

    <div class="isbn__actions">
      <AkButton v-if="!scanning" @click="startScanner">Abrir câmera</AkButton>
      <template v-else>
        <AkButton variant="secondary" @click="stopScanner">Parar câmera</AkButton>
        <AkButton
          v-if="canTorch"
          :variant="torchOn ? 'primary' : 'secondary'"
          @click="handleTorchToggle"
        >
          {{ torchOn ? 'Lanterna ligada' : 'Lanterna' }}
        </AkButton>
      </template>

      <AkButton variant="secondary" :loading="photoLoading" @click="openPhotoCapture">
        {{ photoLoading ? 'Lendo foto…' : 'Fotografar código' }}
      </AkButton>
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
      <NativeField
        v-model="isbnInput"
        class="flex-1"
        label="ISBN manual"
        inputmode="numeric"
        placeholder="9788535914849"
        @keydown.enter.prevent="handleManualLookup"
      />
      <AkButton @click="handleManualLookup">Buscar</AkButton>
    </div>

    <p v-if="error" class="isbn__error">{{ error }}</p>

    <LoadingShimmer v-if="loading" />

    <AkList v-else-if="result">
      <SearchResultCard
        :result="result"
        :in-backlog="store.isInBacklog(result.externalId, result.type)"
        @add="handleAdd"
      />
    </AkList>
  </section>
</template>

<style scoped>
.isbn__desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.isbn__scanner {
  position: relative;
  border-radius: var(--card-radius);
  border: 1px solid var(--border-strong);
  background: var(--bg-soft);
  overflow: hidden;
  min-height: 180px;
  display: grid;
  place-items: center;
}

.isbn__scanner--active {
  border-color: var(--accent);
  background: #000;
}

.isbn__reader {
  width: 100%;
}

.isbn__reader :deep(video) {
  width: 100% !important;
  display: block;
  border-radius: var(--card-radius);
}

.isbn__reader :deep(img) {
  display: none;
}

.isbn__placeholder {
  padding: var(--space-6) var(--space-5);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.isbn__scanner-hint {
  position: absolute;
  bottom: var(--space-2);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: var(--text-2xs);
  font-weight: 600;
}

.isbn__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.isbn__actions > * {
  flex: 1 1 auto;
}

.isbn__photo-input {
  display: none;
}

.isbn__manual {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.isbn__error {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--card-radius);
  background: var(--danger-soft);
  border: 1px solid color-mix(in srgb, var(--danger) 20%, transparent);
  color: var(--danger);
  font-size: var(--text-sm);
}
</style>
