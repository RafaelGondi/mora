<script setup lang="ts">
defineProps<{
  title: string
  description: string
  actionLabel?: string
}>()

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="empty">
    <div class="empty__icon" aria-hidden="true">
      <div class="empty__ring" />
      <div class="empty__ring empty__ring--2" />
    </div>
    <h3 class="empty__title">{{ title }}</h3>
    <p class="empty__desc">{{ description }}</p>
    <button v-if="actionLabel" class="empty__btn tap-scale" type="button" @click="emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.empty__icon {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
}

.empty__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--accent-soft);
  animation: ring-float 3s ease-in-out infinite;
}

.empty__ring--2 {
  inset: 8px;
  border-color: rgba(91, 76, 219, 0.15);
  animation-delay: -1.5s;
}

@keyframes ring-float {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 1; }
}

.empty__title {
  font-size: 20px;
  margin-bottom: 8px;
}

.empty__desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.55;
  max-width: 260px;
  margin-bottom: 20px;
}

.empty__btn {
  padding: 12px 24px;
  background: var(--accent);
  color: #fff;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 14px;
  box-shadow: var(--shadow-sm);
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.empty__btn:active {
  background: var(--accent-hover);
  box-shadow: var(--shadow-md);
}

@media (prefers-reduced-motion: reduce) {
  .empty__ring {
    animation: none;
  }
}
</style>
