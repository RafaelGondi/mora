<script setup lang="ts">
import { AkBadge } from '@rafael_dias/akoma'
import type { BacklogStatus, MediaType } from '@/types/media'
import { STATUS_VARIANTS, statusLabel } from '@/types/media'

defineProps<{
  status: BacklogStatus
  /** Omit to get the generic wording (views that mix categories). */
  type?: MediaType
}>()
</script>

<template>
  <AkBadge :variant="STATUS_VARIANTS[status]" :label="statusLabel(status, type)" />
</template>
