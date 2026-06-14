<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DEFAULT_WATCH_PLATFORMS,
  loadCustomWatchPlatforms,
  saveCustomWatchPlatform,
} from '@/constants/watchPlatforms'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const customInput = ref('')
const customPlatforms = ref(loadCustomWatchPlatforms())

const options = computed(() => {
  const known = [...DEFAULT_WATCH_PLATFORMS, ...customPlatforms.value]
  const extras = props.modelValue.filter(
    (value) => !known.some((platform) => platform.toLowerCase() === value.toLowerCase()),
  )
  return [...new Set([...known, ...extras])]
})

function isSelected(platform: string) {
  return props.modelValue.some((value) => value.toLowerCase() === platform.toLowerCase())
}

function toggle(platform: string) {
  const lower = platform.toLowerCase()
  const next = isSelected(platform)
    ? props.modelValue.filter((value) => value.toLowerCase() !== lower)
    : [...props.modelValue, platform]
  emit('update:modelValue', next)
}

function addCustom() {
  const name = customInput.value.trim()
  if (!name) return

  saveCustomWatchPlatform(name)
  customPlatforms.value = loadCustomWatchPlatforms()

  if (!isSelected(name)) {
    emit('update:modelValue', [...props.modelValue, name])
  }

  customInput.value = ''
}
</script>

<template>
  <div class="watch-select">
    <div class="watch-select__options">
      <button
        v-for="platform in options"
        :key="platform"
        class="watch-select__chip tap-scale"
        :class="{ 'watch-select__chip--on': isSelected(platform) }"
        type="button"
        @click="toggle(platform)"
      >
        {{ platform }}
      </button>
    </div>

    <div class="watch-select__add">
      <input
        v-model="customInput"
        class="watch-select__input"
        type="text"
        placeholder="Outra plataforma…"
        @keydown.enter.prevent="addCustom"
      />
      <button
        class="watch-select__add-btn tap-scale"
        type="button"
        :disabled="!customInput.trim()"
        @click="addCustom"
      >
        Adicionar
      </button>
    </div>
  </div>
</template>

<style scoped>
.watch-select {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.watch-select__options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.watch-select__chip {
  padding: 8px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-strong);
  background: var(--bg-elevated);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.watch-select__chip--on {
  background: var(--accent-soft);
  border-color: transparent;
  color: var(--accent);
}

.watch-select__add {
  display: flex;
  gap: 8px;
}

.watch-select__input {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  font-size: 15px;
  color: var(--text);
}

.watch-select__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.watch-select__add-btn {
  padding: 0 16px;
  border-radius: var(--radius-sm);
  background: var(--bg-muted);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.watch-select__add-btn:not(:disabled):active {
  background: var(--accent-soft);
  color: var(--accent);
}

.watch-select__add-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
