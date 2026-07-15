<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { useBacklogStore } from '@/stores/backlog'
import { lookupBookByIsbn } from '@/services/api/openLibrary'
import SearchResultCard from '@/components/media/SearchResultCard.vue'
import LoadingShimmer from '@/components/ui/LoadingShimmer.vue'
import { formatIsbn, normalizeIsbn } from '@/utils/isbn'
import type { SearchResult } from '@/types/media'

const emit = defineEmits<{ added: [] }>()

const store = useBacklogStore()
const isbnInput = ref('')
const scanning = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<SearchResult | null>(null)
const lastIsbn = ref<string | null>(null)

const videoRef = ref<HTMLVideoElement | null>(null)
let reader: BrowserMultiFormatReader | null = null
let scanControls: { stop: () => void } | null = null

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

async function startScanner() {
  if (scanning.value) return

  error.value = null
  scanning.value = true

  try {
    reader ??= new BrowserMultiFormatReader(
      new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8]]]),
    )

    const devices = await BrowserMultiFormatReader.listVideoInputDevices()
    const camera =
      devices.find((device) => /back|rear|traseira|environment/i.test(device.label))?.deviceId ??
      devices[0]?.deviceId

    if (!camera || !videoRef.value) {
      throw new Error('Nenhuma câmera disponível neste dispositivo.')
    }

    scanControls = await reader.decodeFromVideoDevice(
      camera,
      videoRef.value,
      (detected) => {
        if (!detected) return
        const text = detected.getText()
        void stopScanner()
        void lookupIsbn(text)
      },
    )
  } catch (err) {
    scanning.value = false
    error.value =
      err instanceof Error
        ? err.message
        : 'Não foi possível acessar a câmera. Use a digitação manual do ISBN.'
  }
}

async function stopScanner() {
  scanControls?.stop()
  scanControls = null
  scanning.value = false
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
        Aponte a câmera para o código de barras do livro ou digite o ISBN manualmente.
      </p>
    </div>

    <div class="isbn__scanner" :class="{ 'isbn__scanner--active': scanning }">
      <video
        ref="videoRef"
        class="isbn__video"
        :class="{ 'isbn__video--live': scanning }"
        playsinline
        muted
      />
      <p v-if="scanning" class="isbn__scanner-hint">Centralize o código de barras na câmera.</p>
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
      <button
        v-else
        class="isbn__btn tap-scale"
        type="button"
        @click="stopScanner"
      >
        Parar câmera
      </button>
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
  background: var(--bg-soft);
  min-height: 180px;
}

.isbn__scanner--active {
  border-style: solid;
  border-color: var(--book);
}

.isbn__video {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: none;
  background: #111;
}

.isbn__video--live {
  display: block;
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
}

.isbn__actions,
.isbn__manual {
  display: flex;
  gap: 10px;
  align-items: end;
}

.isbn__manual {
  flex-wrap: wrap;
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

.isbn__btn--primary {
  background: var(--book);
  border-color: transparent;
  color: #fff;
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
