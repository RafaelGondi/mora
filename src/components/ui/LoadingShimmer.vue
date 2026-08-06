<script setup lang="ts">
import { AkShimmer } from '@rafael_dias/akoma'

defineProps<{ count?: number }>()
</script>

<template>
  <div class="shimmer-list">
    <div v-for="n in (count ?? 4)" :key="n" class="shimmer-row">
      <AkShimmer width="44px" height="64px" radius="sm" />
      <div class="shimmer-row__lines">
        <AkShimmer width="70%" height="14px" />
        <AkShimmer width="45%" height="11px" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shimmer-list {
  display: flex;
  flex-direction: column;
}

.shimmer-row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

.shimmer-row__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
