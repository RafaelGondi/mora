import type { BadgeVariant, CuidaIconName } from '@rafael_dias/akoma'

export type MediaType = 'movie' | 'series' | 'book' | 'game' | 'album' | 'other'

export type BacklogStatus = 'want' | 'in_progress' | 'completed' | 'dropped'

export interface SearchResult {
  externalId: string
  type: MediaType
  title: string
  subtitle?: string
  creator?: string
  coverUrl?: string
  year?: string
  rating?: number
  overview?: string
  manual?: boolean
  whereToWatch?: string[]
}

export interface ManualEntryInput {
  type: MediaType
  title: string
  creator?: string
  year?: string
  coverUrl?: string
  overview?: string
  whereToWatch?: string[]
  durationMinutes?: number
  readingStartedAt?: string
  readingFinishedAt?: string
}

export interface BacklogItem {
  id: string
  externalId: string
  type: MediaType
  title: string
  /** @deprecated use creator — kept for dados antigos */
  subtitle?: string
  creator?: string
  coverUrl?: string
  status: BacklogStatus
  rating?: number
  userRating?: number
  notes?: string
  whereToWatch?: string[]
  durationMinutes?: number
  readingStartedAt?: string
  readingFinishedAt?: string
  sortOrder?: number
  addedAt: string
  updatedAt: string
  overview?: string
  year?: string
  manual?: boolean
}

export const MEDIA_TYPES: MediaType[] = ['movie', 'series', 'book', 'game', 'album', 'other']

export const SEARCHABLE_TYPES: MediaType[] = ['movie', 'series', 'book', 'game', 'album']

export const STATUS_OPTIONS: { value: BacklogStatus; label: string }[] = [
  { value: 'want', label: 'Quero ver' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'dropped', label: 'Abandonado' },
]

export const TYPE_LABELS: Record<MediaType, string> = {
  movie: 'Filme',
  series: 'Série',
  book: 'Livro',
  game: 'Jogo',
  album: 'Álbum',
  other: 'Outro',
}

/** Entity identity — Akoma's `--cat-*` scale, never the system accent. */
export const TYPE_COLORS: Record<MediaType, string> = {
  movie: 'var(--cat-1)',
  series: 'var(--cat-2)',
  book: 'var(--cat-3)',
  game: 'var(--cat-4)',
  album: 'var(--cat-5)',
  other: 'var(--cat-6)',
}

export const TYPE_ICONS: Record<MediaType, CuidaIconName> = {
  movie: 'videocam-outline',
  series: 'tv-outline',
  book: 'open-book-outline',
  game: 'bullseye-outline',
  album: 'headphone-outline',
  other: 'package-outline',
}

export const STATUS_VARIANTS: Record<BacklogStatus, BadgeVariant> = {
  want: 'accent',
  in_progress: 'info',
  completed: 'success',
  dropped: 'danger',
}

/** Status is system state — semantic tokens, not the `--cat-*` entity scale. */
export const STATUS_COLORS: Record<BacklogStatus, string> = {
  want: 'var(--accent)',
  in_progress: 'var(--info)',
  completed: 'var(--success)',
  dropped: 'var(--danger)',
}

export const STATUS_LABELS: Record<BacklogStatus, string> = {
  want: 'Quero ver',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  dropped: 'Abandonado',
}

export const SUBTITLE_LABELS: Record<MediaType, string> = {
  movie: 'Diretor',
  series: 'Criador',
  book: 'Autor',
  game: 'Desenvolvedora',
  album: 'Artista',
  other: 'Descrição curta',
}

export const CREATOR_LABELS = SUBTITLE_LABELS

export function itemCreator(item: Pick<BacklogItem, 'creator' | 'subtitle'>): string | undefined {
  return item.creator ?? item.subtitle
}

export function supportsWhereToWatch(type: MediaType): boolean {
  return type === 'movie' || type === 'series'
}

export function supportsDuration(type: MediaType): boolean {
  return type === 'movie'
}

export function supportsReadingDates(type: MediaType): boolean {
  return type === 'book'
}

export function normalizeDateValue(value?: string): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined

  const parts = trimmed.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return undefined

  const [year, month, day] = parts as [number, number, number]
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined
  }

  return trimmed
}

export function formatDatePt(value?: string): string | undefined {
  const normalized = normalizeDateValue(value)
  if (!normalized) return undefined
  const [year, month, day] = normalized.split('-')
  return `${day}/${month}/${year}`
}

export function formatReadingPeriod(start?: string, end?: string): string | undefined {
  const startLabel = formatDatePt(start)
  const endLabel = formatDatePt(end)
  if (startLabel && endLabel) return `${startLabel} → ${endLabel}`
  if (startLabel) return `Desde ${startLabel}`
  if (endLabel) return `Até ${endLabel}`
  return undefined
}

export function normalizeWhereToWatch(value?: string | string[]): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    const list = value.map((entry) => entry.trim()).filter(Boolean)
    return list.length ? list : undefined
  }
  const list = value.split(/[,;|/]/).map((entry) => entry.trim()).filter(Boolean)
  return list.length ? list : undefined
}

export function formatWhereToWatch(platforms?: string[]): string | undefined {
  if (!platforms?.length) return undefined
  return platforms.join(' · ')
}

export function formatDuration(minutes?: number): string | undefined {
  if (!minutes || minutes <= 0) return undefined
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours && mins) return `${hours}h ${mins}min`
  if (hours) return `${hours}h`
  return `${mins}min`
}

export function hasAutocomplete(type: MediaType): boolean {
  return type !== 'other'
}
