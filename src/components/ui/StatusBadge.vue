<script setup lang="ts">
import { AkBadge } from '@rafael_dias/akoma'
import type { BacklogStatus } from '@/types/media'
import { STATUS_LABELS, STATUS_VARIANTS } from '@/types/media'

defineProps<{ status: BacklogStatus }>()
</script>

<template>
  <AkBadge :variant="STATUS_VARIANTS[status]" :label="STATUS_LABELS[status]" />
</template>
