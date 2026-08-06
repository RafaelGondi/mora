<script setup lang="ts">
import { AkChip } from '@rafael_dias/akoma'
import type { MediaType } from '@/types/media'
import { TYPE_COLORS, TYPE_LABELS } from '@/types/media'

defineProps<{
  type: MediaType
  active?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <AkChip :active="active" :color="TYPE_COLORS[type]" @click="emit('click')">
    {{ TYPE_LABELS[type] }}
  </AkChip>
</template>
