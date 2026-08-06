<script setup lang="ts">
import { computed } from 'vue'
import { AkBadge, AkButton, AkIcon, AkList, AkListRow, AkPageHeader, AkSectionHeader, AkSwitch } from '@rafael_dias/akoma'
import { useBacklogStore } from '@/stores/backlog'
import { useAppTheme } from '@/composables/useAppTheme'
import { isFirebaseConfigured } from '@/lib/firebase'

const isDev = import.meta.env.DEV

const { mode, setMode } = useAppTheme()
const backlog = useBacklogStore()

const isDark = computed({
  get: () => mode.value === 'dark',
  set: (value: boolean) => setMode(value ? 'dark' : 'light'),
})

const syncLabel = computed(() => {
  switch (backlog.syncStatus) {
    case 'connecting':
      return 'Conectando…'
    case 'synced':
      return 'Sincronizado'
    case 'error':
      return 'Erro de sincronização'
    default:
      return 'Somente neste dispositivo'
  }
})

const syncVariant = computed(() => {
  switch (backlog.syncStatus) {
    case 'synced':
      return 'success' as const
    case 'connecting':
      return 'info' as const
    case 'error':
      return 'danger' as const
    default:
      return 'neutral' as const
  }
})

function toggleSampleData() {
  if (backlog.hasSampleData) backlog.clearSampleData()
  else void backlog.loadSampleData()
}

const syncHint = computed(() => {
  if (!isFirebaseConfigured()) {
    return 'Configure o Firebase no .env para salvar na nuvem e sincronizar entre dispositivos.'
  }
  if (backlog.syncStatus === 'error' && backlog.syncError) {
    return backlog.syncError
  }
  if (backlog.syncStatus === 'synced') {
    return 'Seu backlog é salvo automaticamente no Firebase.'
  }
  if (backlog.syncStatus === 'connecting') {
    return 'Estabelecendo conexão com a nuvem…'
  }
  return 'Dados guardados apenas no navegador deste aparelho.'
})
</script>

<template>
  <div class="ak-app-page ak-app-scroll">
    <div class="page-body stack--lg">
      <AkPageHeader label="Preferências" title="Ajustes" variant="flush" />

      <section>
        <AkSectionHeader title="Aparência" />
        <AkList>
          <AkListRow :divider="false">
            <template #leading>
              <AkIcon :name="isDark ? 'moon-outline' : 'sun-outline'" :size="20" />
            </template>
            <AkSwitch
              v-model="isDark"
              label="Tema escuro"
              description="Confortável à noite"
            />
          </AkListRow>
        </AkList>
      </section>

      <section>
        <AkSectionHeader title="Dados" />
        <AkList>
          <AkListRow :divider="Boolean(backlog.firebaseUid)">
            <div class="settings__sync-head">
              <span class="row-title">Sincronização</span>
              <AkBadge :variant="syncVariant" :label="syncLabel" />
            </div>
            <template #subtitle>
              <p class="settings__hint">{{ syncHint }}</p>
            </template>
          </AkListRow>
          <AkListRow v-if="backlog.firebaseUid" :divider="false">
            <span class="text-sm text-muted">ID do dispositivo</span>
            <template #trailing>
              <span class="numeric text-xs text-muted">
                {{ backlog.firebaseUid.slice(0, 8) }}…
              </span>
            </template>
          </AkListRow>
        </AkList>
      </section>

      <section v-if="isDev">
        <AkSectionHeader title="Desenvolvimento" />
        <AkList>
          <AkListRow :divider="false">
            <span class="row-title">Dados de exemplo</span>
            <template #subtitle>
              <p class="settings__hint">
                Itens reais das APIs, cobrindo as seis categorias e todos os status.
                Não mexe no que você cadastrou.
              </p>
            </template>
            <template #trailing>
              <AkButton
                :variant="backlog.hasSampleData ? 'danger' : 'secondary'"
                size="sm"
                @click="toggleSampleData"
              >
                {{ backlog.hasSampleData ? 'Remover' : 'Carregar' }}
              </AkButton>
            </template>
          </AkListRow>
        </AkList>
      </section>

      <section>
        <AkSectionHeader title="Sobre" />
        <AkList>
          <AkListRow :divider="false">
            <span class="row-title">Mora</span>
            <template #subtitle>
              <p class="settings__hint">Gestão de backlog de mídia</p>
            </template>
          </AkListRow>
        </AkList>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings__sync-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.settings__hint {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.45;
}
</style>
