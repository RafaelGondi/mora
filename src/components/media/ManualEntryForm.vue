<script setup lang="ts">
import { ref, computed } from 'vue'
import { AkButton, AkInput, AkSectionHeader, AkTextarea } from '@rafael_dias/akoma'
import NativeField from '@/components/ui/NativeField.vue'
import WhereToWatchSelect from '@/components/ui/WhereToWatchSelect.vue'
import type { MediaType } from '@/types/media'
import { CREATOR_LABELS, supportsDuration, supportsReadingDates, supportsWhereToWatch } from '@/types/media'

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
    readingStartedAt?: string
    readingFinishedAt?: string
  }]
}>()

const title = ref('')
const creator = ref('')
const year = ref('')
const coverUrl = ref('')
const overview = ref('')
const whereToWatch = ref<string[]>([])
const durationMinutes = ref('')
const readingStartedAt = ref('')
const readingFinishedAt = ref('')

const creatorLabel = computed(() => CREATOR_LABELS[props.type])
const showWhereToWatch = computed(() => supportsWhereToWatch(props.type))
const showDuration = computed(() => supportsDuration(props.type))
const showReadingDates = computed(() => supportsReadingDates(props.type))

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
    readingStartedAt: showReadingDates.value ? readingStartedAt.value || undefined : undefined,
    readingFinishedAt: showReadingDates.value ? readingFinishedAt.value || undefined : undefined,
  })
  title.value = ''
  creator.value = ''
  year.value = ''
  coverUrl.value = ''
  overview.value = ''
  whereToWatch.value = []
  durationMinutes.value = ''
  readingStartedAt.value = ''
  readingFinishedAt.value = ''
}
</script>

<template>
  <form class="manual stack--md" @submit.prevent="handleSubmit">
    <AkSectionHeader title="Cadastro manual" />
    <p class="manual__desc">Para itens sem API ou quando a busca não encontrar.</p>

    <AkInput v-model="title" label="Título" required placeholder="Nome do item" />

    <AkInput v-model="creator" :label="creatorLabel" :placeholder="creatorLabel" />

    <div v-if="showWhereToWatch" class="manual__field">
      <span class="manual__label">Onde assistir</span>
      <WhereToWatchSelect v-model="whereToWatch" />
    </div>

    <div class="manual__row">
      <NativeField
        v-model="year"
        class="manual__year"
        label="Ano"
        inputmode="numeric"
        placeholder="2024"
        :maxlength="4"
      />
      <NativeField
        v-if="showDuration"
        v-model="durationMinutes"
        class="flex-1"
        label="Duração (min)"
        inputmode="numeric"
        placeholder="142"
        :maxlength="4"
      />
      <AkInput v-else v-model="coverUrl" class="flex-1" label="URL da capa" type="url" placeholder="https://..." />
    </div>

    <AkInput v-if="showDuration" v-model="coverUrl" label="URL da capa" type="url" placeholder="https://..." />

    <div v-if="showReadingDates" class="manual__row">
      <NativeField v-model="readingStartedAt" class="flex-1" label="Início da leitura" type="date" />
      <NativeField v-model="readingFinishedAt" class="flex-1" label="Fim da leitura" type="date" />
    </div>

    <AkTextarea v-model="overview" label="Descrição" :rows="3" placeholder="Opcional" />

    <AkButton type="submit" block :disabled="!title.trim()">
      Adicionar à fila
    </AkButton>
  </form>
</template>

<style scoped>
.manual {
  padding-top: var(--space-2);
}

.manual__desc {
  margin-top: calc(var(--space-3) * -1);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.manual__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.manual__label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-secondary);
}

.manual__row {
  display: flex;
  gap: var(--space-3);
}

.manual__year {
  width: 96px;
  flex-shrink: 0;
}
</style>
