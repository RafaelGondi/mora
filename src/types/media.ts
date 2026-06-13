export type MediaType = 'movie' | 'series' | 'book' | 'game' | 'album' | 'other'

export type BacklogStatus = 'want' | 'in_progress' | 'completed' | 'dropped'

export interface SearchResult {
  externalId: string
  type: MediaType
  title: string
  subtitle?: string
  coverUrl?: string
  year?: string
  rating?: number
  overview?: string
  manual?: boolean
}

export interface ManualEntryInput {
  type: MediaType
  title: string
  subtitle?: string
  year?: string
  coverUrl?: string
  overview?: string
}

export interface BacklogItem {
  id: string
  externalId: string
  type: MediaType
  title: string
  subtitle?: string
  coverUrl?: string
  status: BacklogStatus
  rating?: number
  userRating?: number
  notes?: string
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
  movie: 'Diretor / subtítulo',
  series: 'Criador / subtítulo',
  book: 'Autor',
  game: 'Desenvolvedora',
  album: 'Artista',
  other: 'Descrição curta',
}

export function hasAutocomplete(type: MediaType): boolean {
  return type !== 'other'
}
