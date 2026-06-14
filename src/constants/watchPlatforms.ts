const CUSTOM_PLATFORMS_KEY = 'mora-watch-platforms'

export const DEFAULT_WATCH_PLATFORMS = [
  'Netflix',
  'Prime Video',
  'Disney+',
  'Max',
  'Globoplay',
  'Apple TV+',
  'Paramount+',
  'Star+',
  'Cinema',
  'YouTube',
]

export function loadCustomWatchPlatforms(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PLATFORMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
  } catch {
    return []
  }
}

export function saveCustomWatchPlatform(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return

  const exists =
    DEFAULT_WATCH_PLATFORMS.some((platform) => platform.toLowerCase() === trimmed.toLowerCase()) ||
    loadCustomWatchPlatforms().some((platform) => platform.toLowerCase() === trimmed.toLowerCase())

  if (exists) return

  localStorage.setItem(CUSTOM_PLATFORMS_KEY, JSON.stringify([...loadCustomWatchPlatforms(), trimmed]))
}
