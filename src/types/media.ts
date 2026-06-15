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
