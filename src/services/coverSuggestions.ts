import type { MediaType } from '@/types/media'
import { searchCommonsImages, wikipediaThumbnail } from '@/services/api/commons'
import { fetchBookCoverOptions, searchBooks } from '@/services/api/openLibrary'
import { fetchWikidataCoverOptions, searchMovies } from '@/services/api/wikidata'
import { fetchSeriesCoverOptions, searchSeries } from '@/services/api/tvmaze'
import { fetchGameCoverOptions, searchGames } from '@/services/api/freetogame'
import { fetchAlbumCoverOptions, searchAlbums } from '@/services/api/musicbrainz'

function isManualId(externalId: string) {
  return externalId.startsWith('manual-')
}

function collect(urls: Set<string>, list: Iterable<string | undefined>) {
  for (const url of list) if (url) urls.add(url)
}

const COMMONS_QUERY: Record<MediaType, (title: string, subtitle?: string) => string> = {
  movie: (title) => `${title} film poster`,
  series: (title) => `${title} TV series poster`,
  book: (title, subtitle) => `${title} ${subtitle ?? ''} book cover`.trim(),
  game: (title) => `${title} video game cover`,
  album: (title, subtitle) => `${title} ${subtitle ?? ''} album cover`.trim(),
  other: (title) => `${title} cover`,
}

async function searchFallbackByType(type: MediaType, title: string): Promise<string[]> {
  const query = title.trim()
  if (!query) return []

  switch (type) {
    case 'book':
      return (await searchBooks(query)).map((r) => r.coverUrl).filter((u): u is string => Boolean(u))
    case 'movie':
      return (await searchMovies(query)).map((r) => r.coverUrl).filter((u): u is string => Boolean(u))
    case 'series':
      return (await searchSeries(query)).map((r) => r.coverUrl).filter((u): u is string => Boolean(u))
    case 'game':
      return (await searchGames(query)).map((r) => r.coverUrl).filter((u): u is string => Boolean(u))
    case 'album':
      return (await searchAlbums(query)).map((r) => r.coverUrl).filter((u): u is string => Boolean(u))
    default:
      return []
  }
}

export async function fetchCoverOptions(
  type: MediaType,
  externalId: string,
  title: string,
  subtitle?: string,
): Promise<string[]> {
  const urls = new Set<string>()

  if (type === 'book') {
    return fetchBookCoverOptions(externalId, title)
  }

  if (!isManualId(externalId)) {
    switch (type) {
      case 'movie':
        collect(urls, await fetchWikidataCoverOptions(externalId))
        break
      case 'series':
        collect(urls, await fetchSeriesCoverOptions(externalId))
        break
      case 'game':
        collect(urls, await fetchGameCoverOptions(externalId))
        break
      case 'album':
        collect(urls, await fetchAlbumCoverOptions(externalId))
        break
    }
  }

  collect(urls, await searchFallbackByType(type, title))

  if (urls.size < 6) {
    collect(urls, await searchCommonsImages(COMMONS_QUERY[type](title, subtitle), 10))
  }

  if (urls.size < 4) {
    collect(urls, [
      await wikipediaThumbnail(title, 'pt'),
      await wikipediaThumbnail(title, 'en'),
    ])
  }

  return [...urls]
}
