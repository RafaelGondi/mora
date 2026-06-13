<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBacklogStore } from '@/stores/backlog'
import CoverImage from '@/components/media/CoverImage.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { STATUS_OPTIONS, TYPE_LABELS } from '@/types/media'
import type { BacklogStatus } from '@/types/media'

const route = useRoute()
const router = useRouter()
const store = useBacklogStore()

const item = computed(() => store.getItem(route.params.id as string))

const typeColor = computed(() => {
  if (!item.value) return 'var(--accent)'
  const map = {
    movie: 'var(--movie)',
    series: 'var(--series)',
    book: 'var(--book)',
    game: 'var(--game)',
    album: 'var(--album)',
    other: 'var(--other)',
  }
  return map[item.value.type]
})

function updateStatus(status: BacklogStatus) {
  if (item.value) store.updateStatus(item.value.id, status)
}

function updateNotes(e: Event) {
  if (item.value) store.updateNotes(item.value.id, (e.target as HTMLTextAreaElement).value)
}

function setRating(value: number) {
  if (!item.value) return
  const next = item.value.userRating === value ? undefined : value
  store.updateUserRating(item.value.id, next)
}

const stars = [1, 2, 3, 4, 5]
const coverDraft = ref('')
const editingCover = ref(false)

watch(
  () => item.value?.id,
  () => {
    editingCover.value = false
    coverDraft.value = item.value?.coverUrl ?? ''
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
  editingCover.value = true
}

function cancelCoverEdit() {
  coverDraft.value = item.value?.coverUrl ?? ''
  editingCover.value = false
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
  if (item.value && confirm('Remover este item da fila?')) {
    store.removeItem(item.value.id)
    router.push('/backlog')
  }
}
</script>

<template>
  <div v-if="item" class="detail">
    <button class="detail__back tap-scale" type="button" @click="router.back()">← Voltar</button>

    <div class="detail__hero reveal">
      <div class="detail__cover-wrap">
        <CoverImage
          :src="heroCover"
          :alt="`Capa de ${item.title}`"
          :fallback-letter="item.title.charAt(0)"
          :accent="typeColor"
          class="detail__cover"
        />
      </div>
      <div class="detail__info">
        <span class="detail__type" :style="{ color: typeColor }">{{ TYPE_LABELS[item.type] }}</span>
        <h1>{{ item.title }}</h1>
        <p v-if="item.subtitle || item.year" class="detail__meta">
          {{ [item.subtitle, item.year].filter(Boolean).join(' · ') }}
        </p>
        <StatusBadge :status="item.status" />
        <button
          v-if="!editingCover"
          class="detail__edit-cover tap-scale"
          type="button"
          @click="openCoverEditor"
        >
          Editar capa
        </button>
      </div>
    </div>

    <Transition name="cover-panel">
      <div v-if="editingCover" class="detail__cover-panel reveal">
        <label class="detail__field">
          <span>URL da capa</span>
          <input
            v-model="coverDraft"
            class="detail__input"
            type="url"
            placeholder="https://covers.openlibrary.org/b/id/..."
            @keydown.enter.prevent="saveCover"
          />
        </label>
        <p class="detail__cover-tip">A prévia atualiza na capa acima.</p>
        <div class="detail__cover-actions">
          <button
            class="detail__cover-save tap-scale"
            type="button"
            :disabled="!coverChanged"
            @click="saveCover"
          >
            Salvar
          </button>
          <button class="detail__cover-cancel tap-scale" type="button" @click="cancelCoverEdit">
            Cancelar
          </button>
          <button
            v-if="item.coverUrl || coverDraft.trim()"
            class="detail__cover-remove tap-scale"
            type="button"
            @click="removeCover"
          >
            Remover
          </button>
        </div>
      </div>
    </Transition>

    <section v-if="item.overview" class="detail__section reveal reveal-d1">
      <h2>Sinopse</h2>
      <p>{{ item.overview }}</p>
    </section>

    <section class="detail__section reveal reveal-d2">
      <h2>Minha nota</h2>
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
        <span v-if="item.userRating" class="detail__rating-label">{{ item.userRating }}/5</span>
      </div>
      <p v-if="item.rating" class="detail__api-rating">
        Nota da fonte: {{ item.rating.toFixed(1) }}
      </p>
    </section>

    <section class="detail__section reveal reveal-d3">
      <h2>Status</h2>
      <div class="detail__status-grid">
        <button
          v-for="s in STATUS_OPTIONS"
          :key="s.value"
          class="status-btn tap-scale"
          :class="{ 'status-btn--on': item.status === s.value }"
          type="button"
          @click="updateStatus(s.value)"
        >
          {{ s.label }}
        </button>
      </div>
    </section>

    <section class="detail__section reveal reveal-d4">
      <h2>Notas pessoais</h2>
      <textarea
        class="detail__notes"
        :value="item.notes ?? ''"
        placeholder="O que você achou? Por que quer ver?"
        rows="4"
        @change="updateNotes"
      />
    </section>

    <button class="detail__remove tap-scale reveal reveal-d5" type="button" @click="remove">
      Remover da fila
    </button>
  </div>

  <div v-else class="detail__missing">
    <p>Item não encontrado.</p>
    <button type="button" @click="router.push('/backlog')">Voltar à fila</button>
  </div>
</template>

<style scoped>
.detail {
  padding: calc(16px + var(--safe-top)) 20px 24px;
}

.detail__back {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.detail__hero {
  display: flex;
  gap: 20px;
  margin-bottom: 28px;
}

.detail__cover-wrap {
  width: 120px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  background: var(--bg-soft);
  animation: cover-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes cover-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.detail__cover {
  width: 100%;
  aspect-ratio: 2/3;
}

.detail__cover :deep(.cover-placeholder) {
  font-size: 3rem;
}

.detail__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.detail__type {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.detail__info h1 {
  font-size: 24px;
  line-height: 1.15;
}

.detail__meta {
  font-size: 14px;
  color: var(--text-secondary);
}

.detail__edit-cover {
  align-self: flex-start;
  margin-top: 4px;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.detail__cover-panel {
  margin: -12px 0 20px;
  padding: 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail__cover-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: -2px 0 0;
}

.cover-panel-enter-active,
.cover-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.cover-panel-enter-from,
.cover-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.detail__section {
  margin-bottom: 24px;
}

.detail__section h2 {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 10px;
}

.detail__section p {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.detail__hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.detail__rating {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.rating-star {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  font-size: 22px;
  line-height: 1;
  color: var(--text-tertiary);
  transition:
    color 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.2, 0.64, 1),
    border-color 0.2s ease,
    background 0.2s ease;
}

.rating-star--on {
  color: #e8a317;
  border-color: rgba(232, 163, 23, 0.35);
  background: rgba(232, 163, 23, 0.1);
}

.detail__rating-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-left: 4px;
}

.detail__api-rating {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.detail__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail__field span {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.detail__input {
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  font-size: 15px;
  line-height: 1.4;
  color: var(--text);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.detail__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.detail__cover-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.detail__cover-save,
.detail__cover-cancel,
.detail__cover-remove {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.detail__cover-save {
  background: var(--accent);
  color: #fff;
}

.detail__cover-save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.detail__cover-cancel,
.detail__cover-remove {
  background: var(--bg);
  border: 1px solid var(--border-strong);
  color: var(--text-secondary);
}

.detail__status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.status-btn {
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: var(--bg-elevated);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.status-btn--on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(91, 76, 219, 0.25);
}

.detail__notes {
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  font-size: 15px;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.detail__notes:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.detail__remove {
  width: 100%;
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: #dc2626;
  font-weight: 600;
  font-size: 14px;
  background: var(--bg-elevated);
  transition: all 0.25s ease;
}

.detail__remove:active {
  background: rgba(220, 38, 38, 0.06);
}

.detail__missing {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .detail__cover-wrap {
    animation: none;
  }

  .status-btn--on {
    transform: none;
  }
}
</style>
