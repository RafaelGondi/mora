<script setup lang="ts">
import AmbientBg from './AmbientBg.vue'
import BottomNav from './BottomNav.vue'
</script>

<template>
  <div class="shell">
    <AmbientBg />
    <main class="shell__main">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.shell__main {
  position: relative;
  z-index: 1;
  flex: 1;
  padding-bottom: calc(var(--nav-height) + var(--safe-bottom) + 12px);
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}
</style>
