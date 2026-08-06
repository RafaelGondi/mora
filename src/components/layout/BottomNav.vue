<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AkTabBar, AkTabBarItem } from '@rafael_dias/akoma'
import type { CuidaIconName } from '@rafael_dias/akoma'

const route = useRoute()
const router = useRouter()

const tabs: { value: string; label: string; icon: CuidaIconName }[] = [
  { value: '/', label: 'Início', icon: 'home-outline' },
  { value: '/backlog', label: 'Fila', icon: 'bullet-list-outline' },
  { value: '/search', label: 'Buscar', icon: 'search-outline' },
  { value: '/settings', label: 'Ajustes', icon: 'settings-outline' },
]

const active = computed({
  get: () => route.path,
  set: (path: string) => {
    if (path !== route.path) void router.push(path)
  },
})
</script>

<template>
  <AkTabBar v-model="active">
    <AkTabBarItem
      v-for="tab in tabs"
      :key="tab.value"
      :value="tab.value"
      :label="tab.label"
      :icon="tab.icon"
    />
  </AkTabBar>
</template>
