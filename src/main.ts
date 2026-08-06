import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Akoma } from '@rafael_dias/akoma'

import App from './App.vue'
import router from './router'
import { useBacklogStore } from './stores/backlog'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Akoma)

void useBacklogStore(pinia).initSync()

app.mount('#app')
