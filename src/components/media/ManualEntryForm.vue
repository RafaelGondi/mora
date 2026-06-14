<script setup lang="ts">
import { ref, computed } from 'vue'
import WhereToWatchSelect from '@/components/ui/WhereToWatchSelect.vue'
import type { MediaType } from '@/types/media'
import { CREATOR_LABELS, supportsDuration, supportsWhereToWatch } from '@/types/media'

const props = defineProps<{ type: MediaType }>()
const emit = defineEmits<{
  submit: [data: {
    title: string
    creator?: string
    year?: string
    coverUrl?: string
    overview?: string
    whereToWatch?: string[]
    durationMinutes?: number
  }]
}>()

const title = ref('')
const creator = ref('')
const year = ref('')
const coverUrl = ref('')
const overview = ref('')
const whereToWatch = ref<string[]>([])
const durationMinutes = ref('')

const creatorLabel = computed(() => CREATOR_LABELS[props.type])
const showWhereToWatch = computed(() => supportsWhereToWatch(props.type))
const showDuration = computed(() => supportsDuration(props.type))

function parseDurationMinutes(value: string): number | undefined {
  const minutes = parseInt(value.trim(), 10)
  return Number.isFinite(minutes) && minutes > 0 ? minutes : undefined
}

function handleSubmit() {
  if (!title.value.trim()) return
  emit('submit', {
    title: title.value.trim(),
    creator: creator.value.trim() || undefined,
    year: year.value.trim() || undefined,
    coverUrl: coverUrl.value.trim() || undefined,
    overview: overview.value.trim() || undefined,
    whereToWatch: whereToWatch.value.length ? whereToWatch.value : undefined,
    durationMinutes: showDuration.value ? parseDurationMinutes(durationMinutes.value) : undefined,
  })
  title.value = ''
  creator.value = ''
  year.value = ''
  coverUrl.value = ''
  overview.value = ''
  whereToWatch.value = []
  durationMinutes.value = ''
}
</script>

<template>
  <form class="manual" @submit.prevent="handleSubmit">
    <h3 class="manual__title">Cadastro manual</h3>
    <p class="manual__desc">Para itens sem API ou quando a busca não encontrar.</p>

    <label class="manual__field">
      <span>Título *</span>
      <input v-model="title" type="text" required placeholder="Nome do item" />
    </label>

    <label class="manual__field">
      <span>{{ creatorLabel }}</span>
      <input v-model="creator" type="text" :placeholder="creatorLabel" />
    </label>

    <div v-if="showWhereToWatch" class="manual__field">
      <span>Onde assistir</span>
      <WhereToWatchSelect v-model="whereToWatch" />
    </div>

    <div class="manual__row">
      <label class="manual__field">
        <span>Ano</span>
        <input v-model="year" type="text" inputmode="numeric" placeholder="2024" maxlength="4" />
      </label>
      <label v-if="showDuration" class="manual__field manual__field--grow">
        <span>Duração (min)</span>
        <input
          v-model="durationMinutes"
          type="text"
          inputmode="numeric"
          placeholder="142"
          maxlength="4"
        />
      </label>
      <label v-else class="manual__field manual__field--grow">
        <span>URL da capa</span>
        <input v-model="coverUrl" type="url" placeholder="https://..." />
      </label>
    </div>

    <label v-if="showDuration" class="manual__field">
      <span>URL da capa</span>
      <input v-model="coverUrl" type="url" placeholder="https://..." />
    </label>

    <label class="manual__field">
      <span>Descrição</span>
      <textarea v-model="overview" rows="3" placeholder="Opcional" />
    </label>

    <button class="manual__submit" type="submit" :disabled="!title.trim()">
      Adicionar à fila
    </button>
  </form>
</template>

<style scoped>
.manual {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-top: 8px;
}

.manual__title {
  font-size: 18px;
}

.manual__desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: -6px;
}

.manual__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.manual__field span {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.manual__field input,
.manual__field textarea {
  padding: 12px 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--bg);
  font-size: 15px;
  color: var(--text);
}

.manual__field input:focus,
.manual__field textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.manual__row {
  display: flex;
  gap: 12px;
}

.manual__field--grow {
  flex: 1;
}

.manual__row .manual__field:first-child {
  width: 96px;
  flex-shrink: 0;
}

.manual__submit {
  padding: 14px;
  background: var(--accent);
  color: #fff;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 15px;
  box-shadow: var(--shadow-sm);
  transition: background var(--transition), transform var(--transition);
}

.manual__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.manual__submit:not(:disabled):active {
  transform: scale(0.98);
  background: var(--accent-hover);
}
</style>
