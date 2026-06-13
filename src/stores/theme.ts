import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'mora-theme'
const LEGACY_STORAGE_KEY = 'ante-theme'

const THEME_COLORS: Record<ThemeMode, string> = {
  light: '#f6f5f2',
  dark: '#16161a',
}

function loadTheme(): ThemeMode {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, saved)
      }
      return saved
    }
  } catch {
    /* ignore */
  }
  return 'light'
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[mode])
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(loadTheme())

  watch(
    mode,
    (val) => {
      localStorage.setItem(STORAGE_KEY, val)
      applyTheme(val)
    },
    { immediate: true },
  )

  function setMode(next: ThemeMode) {
    mode.value = next
  }

  return { mode, setMode }
})
