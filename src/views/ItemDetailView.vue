<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AkButton,
  AkChip,
  AkEmptyState,
  AkIconButton,
  AkInput,
  AkSectionHeader,
  AkSheet,
  AkTextarea,
} from '@rafael_dias/akoma'
import { useBacklogStore } from '@/stores/backlog'
import { prepareLocalCoverUrl } from '@/services/localCover'
import { fetchCoverOptions } from '@/services/coverSuggestions'
import CoverImage from '@/components/media/CoverImage.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import NativeField from '@/components/ui/NativeField.vue'
import WhereToWatchSelect from '@/components/ui/WhereToWatchSelect.vue'
import {
  STATUS_OPTIONS,
  TYPE_COLORS,
  TYPE_LABELS,
  CREATOR_LABELS,
  itemCreator,
  supportsWhereToWatch,
  supportsDuration,
  supportsReadingDates,
  formatWhereToWatch,
  formatDuration,
  formatReadingPeriod,
} from '@/types/media'
import type { BacklogStatus } from '@/types/media'

const route = useRoute()
const router = useRouter()
const store = useBacklogStore()

const item = computed(() => store.getItem(route.params.id as string))

const typeColor = computed(() => (item.value ? TYPE_COLORS[item.value.type] : 'var(--accent)'))

function updateStatus(status: BacklogStatus) {
  if (item.value) store.updateStatus(item.value.id, status)
}

function updateNotes(value: string) {
  if (item.value) store.updateNotes(item.value.id, value)
}

function updateCreator(value: string) {
  if (item.value) store.updateCreator(item.value.id, value)
}

function updateWhereToWatch(platforms: string[]) {
  if (item.value) store.updateWhereToWatch(item.value.id, platforms)
}

function updateReadingStartedAt(value: string) {
  if (item.value) store.updateReadingStartedAt(item.value.id, value)
}

function updateReadingFinishedAt(value: string) {
  if (item.value) store.updateReadingFinishedAt(item.value.id, value)
}

function updateDuration(value: string) {
  if (!item.value) return
  const raw = value.trim()
  const minutes = raw ? parseInt(raw, 10) : undefined
  store.updateDurationMinutes(
    item.value.id,
    minutes !== undefined && Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
  )
}

function filterByCreator() {
  if (!item.value) return
  const name = itemCreator(item.value)
  if (!name) return
  void router.push({ path: '/backlog', query: { creator: name } })
}

function setRating(value: number) {
  if (!item.value) return
  const next = item.value.userRating === value ? undefined : value
  store.updateUserRating(item.value.id, next)
}

const stars = [1, 2, 3, 4, 5]
const coverDraft = ref('')
const editingCover = ref(false)
const coverOptions = ref<string[]>([])
const coversLoading = ref(false)
const coverProcessing = ref(false)
const coverError = ref<string | null>(null)
const confirmRemove = ref(false)

const creatorLabel = computed(() => (item.value ? CREATOR_LABELS[item.value.type] : ''))
const displayCreator = computed(() => (item.value ? itemCreator(item.value) : undefined))
const showWhereToWatch = computed(() => item.value && supportsWhereToWatch(item.value.type))
const showDuration = computed(() => item.value && supportsDuration(item.value.type))
const showReadingDates = computed(() => item.value && supportsReadingDates(item.value.type))
const watchLabel = computed(() => formatWhereToWatch(item.value?.whereToWatch))
const durationLabel = computed(() => formatDuration(item.value?.durationMinutes))
const readingLabel = computed(() =>
  formatReadingPeriod(item.value?.readingStartedAt, item.value?.readingFinishedAt),
)
const metaLine = computed(() => {
  if (!item.value) return ''
  return [displayCreator.value, item.value.year, durationLabel.value].filter(Boolean).join(' · ')
})

watch(
  () => item.value?.id,
  () => {
    editingCover.value = false
    coverDraft.value = item.value?.coverUrl ?? ''
    coverOptions.value = []
    coverError.value = null
  },
)

watch(
  () => item.value?.coverUrl,
  (url) => {
    if (!editingCover.value) coverDraft.value = url ?? ''
  },
  { immediate: true },
)

const heroCover = computed(() => {
  if (!item.value) return undefined
  if (editingCover.value) return coverDraft.value.trim() || undefined
  return item.value.coverUrl
})

const coverChanged = computed(() => {
  if (!item.value) return false
  return coverDraft.value.trim() !== (item.value.coverUrl ?? '')
})

function openCoverEditor() {
  coverDraft.value = item.value?.coverUrl ?? ''
  coverOptions.value = []
  coverError.value = null
  editingCover.value = true
}

function cancelCoverEdit() {
  coverDraft.value = item.value?.coverUrl ?? ''
  coverOptions.value = []
  coverError.value = null
  editingCover.value = false
}

function pickCoverUrl(url: string) {
  coverDraft.value = url
  coverError.value = null
}

async function loadCoverSuggestions() {
  if (!item.value) return
  coversLoading.value = true
  coverError.value = null
  try {
    const options = await fetchCoverOptions(
      item.value.type,
      item.value.externalId,
      item.value.title,
      itemCreator(item.value),
    )
    coverOptions.value = options
    if (options.length === 0) {
      coverError.value = 'Nenhuma capa alternativa encontrada.'
    }
  } catch {
    coverError.value = 'Erro ao buscar capas. Tente de novo.'
    coverOptions.value = []
  } finally {
    coversLoading.value = false
  }
}

async function onGalleryPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file || !item.value) return

  coverProcessing.value = true
  coverError.value = null

  const safetyTimer = window.setTimeout(() => {
    if (!coverProcessing.value) return
    coverProcessing.value = false
    coverError.value = 'Processamento travou. Tente outra foto ou use Sugerir capas.'
  }, 20_000)

  try {
    const url = await prepareLocalCoverUrl(file)
    coverDraft.value = url
  } catch (err) {
    coverError.value = err instanceof Error ? err.message : 'Erro ao processar imagem'
  } finally {
    window.clearTimeout(safetyTimer)
    coverProcessing.value = false
  }
}

function saveCover() {
  if (!item.value) return
  const url = coverDraft.value.trim()
  store.updateCoverUrl(item.value.id, url || undefined)
  editingCover.value = false
}

function removeCover() {
  if (!item.value) return
  coverDraft.value = ''
  store.updateCoverUrl(item.value.id, undefined)
  editingCover.value = false
}

function remove() {
  if (!item.value) return
  store.removeItem(item.value.id)
  confirmRemove.value = false
  void router.push('/backlog')
}

const itemIndex = computed(() => (item.value ? store.itemPosition(item.value.id) : -1))
const typeTotal = computed(() => (item.value ? store.byType[item.value.type] : 0))
const canMoveUp = computed(() => itemIndex.value > 0)
const canMoveDown = computed(
  () => itemIndex.value >= 0 && itemIndex.value < typeTotal.value - 1,
)
const isFirst = computed(() => itemIndex.value === 0)
</script>

<template>
  <div class="ak-app-page ak-app-scroll">
    <div v-if="item" class="page-body stack--lg">
      <div>
        <AkIconButton
          variant="ghost"
          label="Voltar"
          icon="arrow-left-outline"
          @click="router.back()"
        />
      </div>

      <div class="detail__hero reveal">
        <div class="cover cover--hero">
          <CoverImage
            :src="heroCover"
            :alt="`Capa de ${item.title}`"
            :fallback-letter="item.title.charAt(0)"
            :accent="typeColor"
          />
        </div>
        <div class="detail__info stack">
          <div>
            <span class="cat-label" :style="{ color: typeColor }">
              {{ TYPE_LABELS[item.type] }}
            </span>
            <h1 class="detail__title">{{ item.title }}</h1>
            <p v-if="metaLine" class="detail__meta">{{ metaLine }}</p>
            <p v-if="readingLabel" class="detail__meta">{{ readingLabel }}</p>
            <p v-if="watchLabel" class="detail__meta">{{ watchLabel }}</p>
          </div>
          <div class="detail__hero-actions">
            <StatusBadge :status="item.status" />
            <AkButton variant="ghost" size="sm" @click="openCoverEditor">Editar capa</AkButton>
          </div>
        </div>
      </div>

      <section v-if="item.overview">
        <AkSectionHeader title="Sinopse" />
        <p class="detail__overview">{{ item.overview }}</p>
      </section>

      <section class="stack">
        <AkSectionHeader :title="creatorLabel" />
        <AkInput
          :model-value="item.creator ?? ''"
          :placeholder="creatorLabel"
          @update:model-value="updateCreator"
        />
        <AkButton v-if="displayCreator" variant="ghost" size="sm" @click="filterByCreator">
          Ver tudo de {{ displayCreator }}
        </AkButton>
      </section>

      <section v-if="showWhereToWatch" class="stack">
        <AkSectionHeader title="Onde assistir" />
        <p class="detail__hint">Selecione plataformas ou cadastre outras opções.</p>
        <WhereToWatchSelect
          :model-value="item.whereToWatch ?? []"
          @update:model-value="updateWhereToWatch"
        />
      </section>

      <section v-if="showDuration" class="stack">
        <AkSectionHeader title="Duração" />
        <p class="detail__hint">Tempo total do filme, em minutos.</p>
        <NativeField
          :model-value="String(item.durationMinutes ?? '')"
          inputmode="numeric"
          :maxlength="4"
          placeholder="142"
          @update:model-value="updateDuration"
        />
        <p v-if="durationLabel" class="detail__readout">{{ durationLabel }}</p>
      </section>

      <section v-if="showReadingDates" class="stack">
        <AkSectionHeader title="Leitura" />
        <p class="detail__hint">Registre quando começou e terminou de ler.</p>
        <div class="detail__date-row">
          <NativeField
            class="flex-1"
            label="Início"
            type="date"
            :model-value="item.readingStartedAt ?? ''"
            @update:model-value="updateReadingStartedAt"
          />
          <NativeField
            class="flex-1"
            label="Fim"
            type="date"
            :model-value="item.readingFinishedAt ?? ''"
            @update:model-value="updateReadingFinishedAt"
          />
        </div>
        <p v-if="readingLabel" class="detail__readout">{{ readingLabel }}</p>
      </section>

      <section class="stack">
        <AkSectionHeader title="Minha nota" />
        <p class="detail__hint">Toque para avaliar. Toque de novo na mesma estrela para limpar.</p>
        <div class="detail__rating" role="group" aria-label="Nota pessoal">
          <button
            v-for="value in stars"
            :key="value"
            class="rating-star tap-scale"
            :class="{ 'rating-star--on': (item.userRating ?? 0) >= value }"
            type="button"
            :aria-label="`${value} de 5 estrelas`"
            :aria-pressed="(item.userRating ?? 0) >= value"
            @click="setRating(value)"
          >
            <span aria-hidden="true">★</span>
          </button>
          <span v-if="item.userRating" class="detail__rating-label numeric">
            {{ item.userRating }}/5
          </span>
        </div>
        <p v-if="item.rating" class="detail__hint">
          Nota da fonte: {{ item.rating.toFixed(1) }}
        </p>
      </section>

      <section class="stack">
        <AkSectionHeader title="Status" />
        <div class="chip-row">
          <AkChip
            v-for="s in STATUS_OPTIONS"
            :key="s.value"
            :active="item.status === s.value"
            @click="updateStatus(s.value)"
          >
            {{ s.label }}
          </AkChip>
        </div>
      </section>

      <section class="stack">
        <AkSectionHeader title="Posição na fila" />
        <p v-if="itemIndex >= 0" class="detail__hint">
          {{ itemIndex + 1 }}º de {{ typeTotal }} na fila de {{ TYPE_LABELS[item.type] }}.
        </p>
        <div class="detail__order-actions">
          <AkButton variant="secondary" size="sm" :disabled="isFirst" @click="store.moveToTop(item.id)">
            Primeiro
          </AkButton>
          <AkButton variant="secondary" size="sm" :disabled="!canMoveUp" @click="store.moveUp(item.id)">
            Subir
          </AkButton>
          <AkButton variant="secondary" size="sm" :disabled="!canMoveDown" @click="store.moveDown(item.id)">
            Descer
          </AkButton>
        </div>
      </section>

      <section class="stack">
        <AkSectionHeader title="Notas pessoais" />
        <AkTextarea
          :model-value="item.notes ?? ''"
          placeholder="O que você achou? Por que quer ver?"
          :rows="4"
          @update:model-value="updateNotes"
        />
      </section>

      <AkButton variant="danger" block @click="confirmRemove = true">
        Remover da fila
      </AkButton>
    </div>

    <div v-else class="page-body">
      <AkEmptyState title="Item não encontrado" description="Ele pode ter sido removido da fila.">
        <template #action>
          <AkButton @click="router.push('/backlog')">Voltar à fila</AkButton>
        </template>
      </AkEmptyState>
    </div>

    <!-- Cover editing lives in a sheet, not an inline panel (patterns.md). -->
    <AkSheet v-model:open="editingCover" title="Editar capa" close-label="Fechar">
      <div class="sheet-body">
        <p class="detail__hint">
          Use <strong>Galeria</strong> (fica neste aparelho, sem custo) ou
          <strong>Sugerir capas</strong>. No computador, também pode colar uma URL.
        </p>

        <div class="detail__cover-tools">
          <label class="detail__file-btn">
            <input
              class="detail__file-input"
              type="file"
              accept="image/*"
              :disabled="coverProcessing"
              @change="onGalleryPick"
            />
            {{ coverProcessing ? 'Processando…' : 'Galeria' }}
          </label>
          <AkButton
            variant="secondary"
            :loading="coversLoading"
            @click="loadCoverSuggestions"
          >
            {{ coversLoading ? 'Buscando…' : 'Sugerir capas' }}
          </AkButton>
        </div>

        <div v-if="coverOptions.length" class="detail__cover-grid">
          <button
            v-for="url in coverOptions"
            :key="url"
            class="detail__cover-option"
            :class="{ 'detail__cover-option--on': coverDraft === url }"
            type="button"
            aria-label="Usar esta capa"
            @click="pickCoverUrl(url)"
          >
            <img :src="url" alt="" loading="lazy" />
          </button>
        </div>

        <AkInput
          v-model="coverDraft"
          label="URL da capa"
          type="url"
          placeholder="https://covers.openlibrary.org/b/id/..."
          :error="coverError ?? undefined"
          @keydown.enter.prevent="saveCover"
        />

        <div class="sheet-actions">
          <AkButton variant="secondary" @click="cancelCoverEdit">Cancelar</AkButton>
          <AkButton :disabled="!coverChanged" @click="saveCover">Salvar</AkButton>
        </div>
        <AkButton
          v-if="item?.coverUrl || coverDraft.trim()"
          variant="danger"
          block
          @click="removeCover"
        >
          Remover capa
        </AkButton>
      </div>
    </AkSheet>

    <AkSheet v-model:open="confirmRemove" title="Remover item" close-label="Fechar">
      <div class="sheet-body">
        <p class="detail__hint">
          Isso remove <strong>{{ item?.title }}</strong> da sua fila. Não dá para desfazer.
        </p>
        <div class="sheet-actions">
          <AkButton variant="secondary" @click="confirmRemove = false">Cancelar</AkButton>
          <AkButton variant="danger" @click="remove">Remover</AkButton>
        </div>
      </div>
    </AkSheet>
  </div>
</template>

<style scoped>
.detail__hero {
  display: flex;
  gap: var(--space-5);
}

.detail__info {
  flex: 1;
  min-width: 0;
  justify-content: space-between;
}

.detail__title {
  margin-top: var(--space-1);
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.detail__meta {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.detail__hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.detail__overview {
  font-size: var(--text-md);
  color: var(--text-secondary);
  line-height: 1.6;
}

.detail__hint {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.5;
}

.detail__readout {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent);
}

.detail__date-row,
.detail__order-actions,
.detail__cover-tools {
  display: flex;
  gap: var(--space-2);
}

.detail__order-actions > *,
.detail__cover-tools > * {
  flex: 1;
}

.detail__rating {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.rating-star {
  font-size: 26px;
  line-height: 1;
  padding: 2px;
  background: none;
  border: 0;
  color: var(--border-strong);
  transition: color var(--transition), transform var(--transition);
}

.rating-star--on {
  color: var(--warning);
}

.rating-star:active {
  transform: scale(0.9);
}

.detail__rating-label {
  margin-left: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 650;
  color: var(--text-secondary);
}

/* File input styled as a secondary button. */
.detail__file-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 var(--space-5);
  border-radius: var(--button-radius);
  border: 1px solid var(--border-strong);
  background: var(--bg-soft);
  color: var(--text);
  font-size: var(--text-md);
  font-weight: 600;
  cursor: pointer;
}

.detail__file-input {
  display: none;
}

.detail__cover-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.detail__cover-option {
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 2px solid transparent;
  background: var(--bg-soft);
  padding: 0;
}

.detail__cover-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail__cover-option--on {
  border-color: var(--accent);
}
</style>
