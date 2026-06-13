<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  src?: string
  alt: string
  fallbackLetter: string
  accent?: string
}>()

const failed = ref(false)

const showImage = computed(() => Boolean(props.src) && !failed.value)

watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <img
    v-if="showImage"
    :src="src"
    :alt="alt"
    class="cover-img"
    loading="lazy"
    @error="failed = true"
  />
  <div v-else class="cover-placeholder" :style="{ color: accent ?? 'var(--accent)' }">
    {{ fallbackLetter }}
  </div>
</template>

<style scoped>
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, color-mix(in srgb, currentColor 12%, var(--bg-elevated)), var(--bg-soft));
  font-family: var(--font-display);
  font-weight: 600;
}
</style>
