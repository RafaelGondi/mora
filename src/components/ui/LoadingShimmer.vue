<script setup lang="ts">
defineProps<{ count?: number }>()
</script>

<template>
  <div class="shimmer-list">
    <div v-for="n in (count ?? 4)" :key="n" class="shimmer-card">
      <div class="shimmer-card__cover" />
      <div class="shimmer-card__lines">
        <div class="shimmer-card__line shimmer-card__line--lg" />
        <div class="shimmer-card__line" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shimmer-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shimmer-card {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.shimmer-card__cover {
  width: 64px;
  height: 92px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  background: linear-gradient(90deg, var(--bg-soft) 25%, var(--bg-muted) 50%, var(--bg-soft) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.3s ease-in-out infinite;
}

.shimmer-card__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.shimmer-card__line {
  height: 12px;
  width: 55%;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--bg-soft) 25%, var(--bg-muted) 50%, var(--bg-soft) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.3s ease-in-out infinite;
}

.shimmer-card__line--lg {
  width: 80%;
  height: 14px;
}
</style>
