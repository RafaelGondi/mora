<script setup lang="ts">
import { computed } from 'vue'
import { AkIconButton, AkListRow } from '@rafael_dias/akoma'
import CoverImage from '@/components/media/CoverImage.vue'
import { TYPE_COLORS, TYPE_LABELS } from '@/types/media'
import type { SearchResult } from '@/types/media'

const props = defineProps<{
  result: SearchResult
  inBacklog?: boolean
}>()

const emit = defineEmits<{ add: [] }>()

const typeColor = computed(() => TYPE_COLORS[props.result.type])

const meta = computed(() =>
  [props.result.year, props.result.creator ?? props.result.subtitle]
    .filter(Boolean)
    .join(' · '),
)

function handleAdd() {
  if (props.inBacklog) return
  emit('add')
}
</script>

<template>
  <AkListRow class="result-row" padding="md">
    <template #leading>
      <div class="cover cover--search">
        <CoverImage
          :src="result.coverUrl"
          :alt="`Capa de ${result.title}`"
          :fallback-letter="result.title.charAt(0)"
          :accent="typeColor"
        />
      </div>
    </template>

    <span class="row-title">{{ result.title }}</span>

    <template #subtitle>
      <div class="row-meta">
        <span class="cat-label" :style="{ color: typeColor }">
          {{ TYPE_LABELS[result.type] }}
        </span>
        <span v-if="meta" class="truncate">{{ meta }}</span>
        <span v-if="result.rating">★ {{ result.rating.toFixed(1) }}</span>
      </div>
      <p v-if="result.overview" class="result-row__overview">{{ result.overview }}</p>
    </template>

    <template #trailing>
      <AkIconButton
        :variant="inBacklog ? 'secondary' : 'ghost'"
        :label="inBacklog ? 'Já está na fila' : 'Adicionar à fila'"
        :icon="inBacklog ? 'check-outline' : 'plus-outline'"
        :disabled="inBacklog"
        @click="handleAdd"
      />
    </template>
  </AkListRow>
</template>

<style scoped>
.result-row :deep(.ak-list-row__content) {
  min-width: 0;
  overflow: hidden;
}

.result-row__overview {
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
