<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useBacklogStore } from '@/stores/backlog'
import { isFirebaseConfigured } from '@/lib/firebase'
import type { ThemeMode } from '@/stores/theme'

const theme = useThemeStore()
const backlog = useBacklogStore()

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

const options: { value: ThemeMode; label: string; desc: string; icon: string }[] = [
  { value: 'light', label: 'Claro', desc: 'Fundo suave e legível', icon: 'sun' },
  { value: 'dark', label: 'Escuro', desc: 'Confortável à noite', icon: 'moon' },
]
</script>

<template>
  <div class="settings">
    <header class="settings__header reveal">
      <span class="page-label">Preferências</span>
      <h1 class="page-title">Ajustes</h1>
    </header>

    <section class="settings__section reveal reveal-d1">
      <h2 class="settings__label">Aparência</h2>
      <p class="settings__hint">Escolha como o Mora deve aparecer no seu dispositivo.</p>

      <div class="theme-picker" role="radiogroup" aria-label="Tema do aplicativo">
        <button
          v-for="opt in options"
          :key="opt.value"
          class="theme-option tap-scale"
          :class="{
            'theme-option--active': theme.mode === opt.value,
            [`theme-option--${opt.value}`]: true,
          }"
          type="button"
          role="radio"
          :aria-checked="theme.mode === opt.value"
          @click="theme.setMode(opt.value)"
        >
          <span class="theme-option__preview" aria-hidden="true">
            <span class="theme-option__bar" />
            <span class="theme-option__block" />
            <span class="theme-option__block theme-option__block--sm" />
          </span>
          <span class="theme-option__icon" :data-icon="opt.icon" aria-hidden="true" />
          <span class="theme-option__text">
            <strong>{{ opt.label }}</strong>
            <small>{{ opt.desc }}</small>
          </span>
          <span v-if="theme.mode === opt.value" class="theme-option__check" aria-hidden="true">✓</span>
        </button>
      </div>
    </section>

    <section class="settings__section reveal reveal-d2">
      <h2 class="settings__label">Dados</h2>
      <p class="settings__hint">{{ syncHint }}</p>

      <div class="sync-card" :class="`sync-card--${backlog.syncStatus}`">
        <span class="sync-card__dot" aria-hidden="true" />
        <div class="sync-card__text">
          <strong>{{ syncLabel }}</strong>
          <small v-if="backlog.firebaseUid">ID: {{ backlog.firebaseUid.slice(0, 8) }}…</small>
        </div>
      </div>
    </section>

    <section class="settings__about reveal reveal-d3">
      <h2 class="settings__label">Sobre</h2>
      <div class="about-card">
        <p class="about-card__name">Mora</p>
        <p class="about-card__ver">Gestão de backlog de mídia</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings {
  padding: calc(28px + var(--safe-top)) 20px 24px;
}

.settings__header {
  margin-bottom: 28px;
}

.settings__header .page-label {
  display: block;
  margin-bottom: 4px;
}

.settings__section {
  margin-bottom: 32px;
}

.settings__label {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.settings__hint {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.theme-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.theme-option {
  display: grid;
  grid-template-columns: 56px 28px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  text-align: left;
  box-shadow: var(--shadow-sm);
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.theme-option--active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft), var(--shadow-sm);
}

.theme-option__preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border-radius: 8px;
  height: 44px;
}

.theme-option--light .theme-option__preview {
  background: #f6f5f2;
  border: 1px solid rgba(44, 44, 42, 0.1);
}

.theme-option--dark .theme-option__preview {
  background: #16161a;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.theme-option__bar {
  height: 6px;
  border-radius: 3px;
  width: 70%;
}

.theme-option--light .theme-option__bar {
  background: #5b4cdb;
}

.theme-option--dark .theme-option__bar {
  background: #7b6ef6;
}

.theme-option__block {
  height: 5px;
  border-radius: 2px;
  width: 100%;
}

.theme-option__block--sm {
  width: 60%;
}

.theme-option--light .theme-option__block {
  background: rgba(44, 44, 42, 0.12);
}

.theme-option--dark .theme-option__block {
  background: rgba(255, 255, 255, 0.12);
}

.theme-option__icon {
  width: 22px;
  height: 22px;
  background: var(--text-secondary);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}

.theme-option--active .theme-option__icon {
  background: var(--accent);
}

.theme-option__icon[data-icon='sun'] {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.75'%3E%3Ccircle cx='12' cy='12' r='4'/%3E%3Cpath d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41'/%3E%3C/svg%3E");
}

.theme-option__icon[data-icon='moon'] {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.75'%3E%3Cpath d='M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5z'/%3E%3C/svg%3E");
}

.theme-option__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-option__text strong {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.theme-option__text small {
  font-size: 12px;
  color: var(--text-tertiary);
}

.theme-option__check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  animation: check-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}

@keyframes check-in {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.about-card {
  padding: 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.about-card__name {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.about-card__ver {
  font-size: 13px;
  color: var(--text-secondary);
}

.sync-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.sync-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text-tertiary);
  flex-shrink: 0;
}

.sync-card--connecting .sync-card__dot {
  background: #e8a317;
  animation: sync-pulse 1.2s ease-in-out infinite;
}

.sync-card--synced .sync-card__dot {
  background: #2f9e6b;
}

.sync-card--error .sync-card__dot {
  background: #d64545;
}

.sync-card__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sync-card__text strong {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.sync-card__text small {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: ui-monospace, monospace;
}

@keyframes sync-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

@media (prefers-reduced-motion: reduce) {
  .theme-option__check {
    animation: none;
  }
}
</style>
