<script setup lang="ts">
import { AkAmbientBg } from '@rafael_dias/akoma'
import BottomNav from './BottomNav.vue'
</script>

<template>
  <div class="ak-app-root">
    <AkAmbientBg contained />
    <main class="ak-app-main">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>
