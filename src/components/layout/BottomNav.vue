<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/', label: 'Início', icon: 'home' },
  { to: '/backlog', label: 'Fila', icon: 'list' },
  { to: '/search', label: 'Buscar', icon: 'search' },
  { to: '/settings', label: 'Ajustes', icon: 'settings' },
]

const activeIndex = computed(() => {
  const i = tabs.findIndex((t) => t.to === route.path)
  return i >= 0 ? i : -1
})

const showIndicator = computed(() => activeIndex.value >= 0)
</script>

<template>
  <nav class="nav" aria-label="Navegação principal">
    <div class="nav__inner" :style="{ '--tab-count': tabs.length }">
      <div
        v-if="showIndicator"
        class="nav__indicator"
        :style="{ transform: `translateX(${activeIndex * 100}%)` }"
        aria-hidden="true"
      />
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="nav__tab tap-scale"
        :class="{ 'nav__tab--active': route.path === tab.to }"
      >
        <span
          class="nav__icon"
          :class="{ 'nav__icon--bounce': route.path === tab.to }"
          :data-icon="tab.icon"
          aria-hidden="true"
        />
        <span class="nav__label">{{ tab.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 16px calc(14px + var(--safe-bottom));
  pointer-events: none;
}

.nav__inner {
  position: relative;
  display: flex;
  justify-content: space-around;
  max-width: 440px;
  margin: 0 auto;
  padding: 6px;
  background: var(--nav-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-nav);
  pointer-events: auto;
}

.nav__indicator {
  position: absolute;
  top: 6px;
  left: 6px;
  width: calc((100% - 12px) / var(--tab-count, 4));
  height: calc(100% - 12px);
  background: var(--accent-soft);
  border-radius: var(--radius-full);
  transition: transform 0.38s cubic-bezier(0.34, 1.3, 0.64, 1);
  z-index: 0;
}

.nav__tab {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border-radius: var(--radius-full);
  color: var(--text-tertiary);
  transition: color 0.25s var(--ease-smooth, ease);
  min-width: 0;
}

.nav__tab--active {
  color: var(--accent);
}

.nav__icon {
  width: 20px;
  height: 20px;
  background: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
  flex-shrink: 0;
}

.nav__icon--bounce {
  animation: icon-pop 0.4s cubic-bezier(0.34, 1.5, 0.64, 1);
}

@keyframes icon-pop {
  0% { transform: scale(0.7); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.nav__icon[data-icon='home'] {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19z'/%3E%3Cpath d='M9.5 20.5v-7h5v7'/%3E%3C/svg%3E");
}

.nav__icon[data-icon='list'] {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.75' stroke-linecap='round'%3E%3Cpath d='M8 6h13M8 12h13M8 18h13'/%3E%3Ccircle cx='3.5' cy='6' r='1' fill='black'/%3E%3Ccircle cx='3.5' cy='12' r='1' fill='black'/%3E%3Ccircle cx='3.5' cy='18' r='1' fill='black'/%3E%3C/svg%3E");
}

.nav__icon[data-icon='search'] {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.75' stroke-linecap='round'%3E%3Ccircle cx='10.5' cy='10.5' r='6.5'/%3E%3Cpath d='m19 19-4-4'/%3E%3C/svg%3E");
}

.nav__icon[data-icon='settings'] {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41'/%3E%3C/svg%3E");
}

.nav__label {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .nav__indicator,
  .nav__icon--bounce {
    animation: none;
    transition: none;
  }
}

@media (hover: none) and (pointer: coarse) {
  .nav {
    background: linear-gradient(
      180deg,
      transparent 0%,
      color-mix(in srgb, var(--bg) 88%, transparent) 28%,
      var(--bg) 62%
    );
  }

  .nav__inner {
    background: var(--bg-elevated);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-color: var(--border-strong);
    box-shadow:
      var(--shadow-nav),
      0 4px 24px color-mix(in srgb, var(--text) 8%, transparent);
  }
}
</style>
