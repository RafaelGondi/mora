<script setup lang="ts">
import { computed, ref } from 'vue'
import { AkButton, AkChip, AkInput } from '@rafael_dias/akoma'
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
      <AkChip
        v-for="platform in options"
        :key="platform"
        :active="isSelected(platform)"
        @click="toggle(platform)"
      >
        {{ platform }}
      </AkChip>
    </div>

    <div class="watch-select__add">
      <AkInput
        v-model="customInput"
        class="flex-1"
        placeholder="Outra plataforma…"
        size="sm"
        @keydown.enter.prevent="addCustom"
      />
      <AkButton
        variant="secondary"
        size="sm"
        :disabled="!customInput.trim()"
        @click="addCustom"
      >
        Adicionar
      </AkButton>
    </div>
  </div>
</template>

<style scoped>
.watch-select {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.watch-select__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.watch-select__add {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}
</style>
