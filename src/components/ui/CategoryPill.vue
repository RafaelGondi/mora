<script setup lang="ts">
import type { MediaType } from '@/types/media'
import { TYPE_LABELS } from '@/types/media'

defineProps<{
  type: MediaType
  active?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="chip tap-scale"
    :class="[`chip--${type}`, { 'chip--active': active }]"
    type="button"
    @click="emit('click')"
  >
    {{ TYPE_LABELS[type] }}
  </button>
</template>

<style scoped>
.chip {
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  white-space: nowrap;
  transition:
    color 0.25s ease,
    background 0.3s cubic-bezier(0.34, 1.2, 0.64, 1),
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.chip--active {
  color: #fff;
  border-color: transparent;
  box-shadow: var(--shadow-md);
}

.chip--active.chip--movie { background: var(--movie); }
.chip--active.chip--series { background: var(--series); }
.chip--active.chip--book { background: var(--book); }
.chip--active.chip--game { background: var(--game); }
.chip--active.chip--album { background: var(--album); }
.chip--active.chip--other { background: var(--other); }

</style>
