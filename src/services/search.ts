import { searchMovies } from './api/wikidata'
import { searchSeries } from './api/tvmaze'
import { searchBooks } from './api/openLibrary'
import { searchGames } from './api/freetogame'
import { searchAlbums } from './api/musicbrainz'
import type { MediaType, SearchResult } from '@/types/media'
import { hasAutocomplete } from '@/types/media'

export async function searchMedia(query: string, type: MediaType): Promise<SearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed || !hasAutocomplete(type)) return []

  switch (type) {
    case 'movie':
      return searchMovies(trimmed)
    case 'series':
      return searchSeries(trimmed)
    case 'book':
      return searchBooks(trimmed)
    case 'game':
      return searchGames(trimmed)
    case 'album':
      return searchAlbums(trimmed)
    default:
      return []
  }
}
