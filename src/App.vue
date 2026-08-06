<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import { pageTransitionName } from '@/composables/useMotion'
import { useAppTheme } from '@/composables/useAppTheme'

useAppTheme()

const route = useRoute()
const transition = ref('page-fade')

watch(
  () => route.path,
  (to, from) => {
    if (from) transition.value = pageTransitionName(from, to)
  },
)
</script>

<template>
  <AppShell>
    <RouterView v-slot="{ Component }">
      <Transition :name="transition" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </AppShell>
</template>
