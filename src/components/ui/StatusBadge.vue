<script setup lang="ts">
import type { BacklogStatus } from '@/types/media'
import { STATUS_OPTIONS } from '@/types/media'

defineProps<{ status: BacklogStatus }>()

const labels = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label])) as Record<
  BacklogStatus,
  string
>
</script>

<template>
  <span class="badge" :class="`badge--${status}`">{{ labels[status] }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-self: flex-start;
  width: fit-content;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  transition: background 0.3s ease, color 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.badge--want {
  background: var(--accent-soft);
  color: var(--accent);
}

.badge--in_progress {
  background: rgba(139, 108, 199, 0.12);
  color: var(--series);
}

.badge--completed {
  background: rgba(61, 158, 130, 0.12);
  color: var(--game);
}

.badge--dropped {
  background: var(--bg-soft);
  color: var(--text-tertiary);
}
</style>
