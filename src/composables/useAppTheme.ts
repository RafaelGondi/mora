import { useAkomaTheme } from '@rafael_dias/akoma'

/** Matches Akoma mood `app` `--bg` in light/dark — used for first-paint `theme-color`. */
export const MORA_THEME_COLORS = {
  light: '#f8f6f1',
  dark: '#1d211f',
} as const

/** Mora theme — violet app mood with persisted light/dark. */
export function useAppTheme() {
  return useAkomaTheme({
    mood: 'app',
    accent: 'violet',
    storageKey: 'mora-theme',
  })
}
