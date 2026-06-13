<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import { pageTransitionName } from '@/composables/useMotion'

const route = useRoute()
const transition = ref('page-fade')
const previousPath = ref(route.path)

watch(
  () => route.path,
  (to, from) => {
    if (from) transition.value = pageTransitionName(from, to)
    previousPath.value = to
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
