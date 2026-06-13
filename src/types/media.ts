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
  whereToWatch?: string
}

export interface ManualEntryInput {
  type: MediaType
  title: string
  creator?: string
  year?: string
  coverUrl?: string
  overview?: string
  whereToWatch?: string
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
  whereToWatch?: string
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

export function hasAutocomplete(type: MediaType): boolean {
  return type !== 'other'
}
