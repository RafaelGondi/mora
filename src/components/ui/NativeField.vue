<script setup lang="ts">
/**
 * Labeled native input for the cases AkInput cannot cover — date pickers and
 * numeric keypads. AkInput's root is the <label>, so `inputmode`/`maxlength`
 * never reach the control, and its field styles are scoped to that component.
 * Mirrors AkInput's appearance using Akoma's field tokens (same approach as
 * Habitify's `.field-date`).
 */
withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    type?: string
    placeholder?: string
    inputmode?: 'text' | 'numeric' | 'decimal'
    maxlength?: number
  }>(),
  {
    modelValue: '',
    type: 'text',
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <label class="field">
    <span v-if="label" class="field__label">{{ label }}</span>
    <input
      class="field__control"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :inputmode="inputmode"
      :maxlength="maxlength"
      @input="onInput"
    />
  </label>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
}

.field__label {
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: -0.005em;
}

.field__control {
  width: 100%;
  min-height: 44px;
  padding: 11px 15px;
  font-family: inherit;
  font-size: var(--text-base);
  border-radius: var(--field-radius);
  background: var(--field-bg);
  border: 1px solid var(--field-border);
  color: var(--text);
  outline: none;
  transition:
    border-color var(--transition),
    box-shadow var(--transition),
    background-color var(--transition);
}

.field__control::placeholder {
  color: var(--text-tertiary);
}

.field__control:hover:not(:disabled):not(:focus) {
  background: var(--field-bg-hover);
  border-color: var(--control-border);
}

.field__control:focus {
  background: var(--bg-elevated);
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

/* iOS Safari zooms the viewport on focus of any field under 16px */
@media (max-width: 640px) {
  .field__control {
    font-size: 16px;
  }
}
</style>
