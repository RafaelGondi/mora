import type { SearchResult } from '@/types/media'

const BASE = 'https://www.googleapis.com/books/v1/volumes'

interface GoogleVolume {
  id?: string
  volumeInfo?: {
    title?: string
    subtitle?: string
    authors?: string[]
    publishedDate?: string
    publisher?: string
    pageCount?: number
    description?: string
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
      medium?: string
      large?: string
      extraLarge?: string
    }
  }
}

function httpsCover(url?: string): string | undefined {
  if (!url) return undefined
  return url.replace(/^http:/, 'https:')
}

function mapVolume(volume: GoogleVolume): SearchResult | null {
  const id = volume.id
  const info = volume.volumeInfo
  if (!id || !info?.title) return null

  const authors = info.authors?.join(', ')
  const year = info.publishedDate?.match(/\d{4}/)?.[0]
  const coverUrl =
    httpsCover(info.imageLinks?.extraLarge) ??
    httpsCover(info.imageLinks?.large) ??
    httpsCover(info.imageLinks?.medium) ??
    httpsCover(info.imageLinks?.thumbnail)

  const details = [
    info.publisher ? `Editora: ${info.publisher}` : undefined,
    info.pageCount ? `${info.pageCount} páginas` : undefined,
  ].filter(Boolean)

  const title = info.subtitle ? `${info.title}: ${info.subtitle}` : info.title

  return {
    externalId: `googlebooks:${id}`,
    type: 'book',
    title,
    subtitle: authors,
    creator: authors,
    coverUrl,
    year,
    overview: details.length ? details.join(' · ') : info.description?.slice(0, 200),
  }
}

export async function lookupGoogleBookByIsbn(isbn: string): Promise<SearchResult | null> {
  const res = await fetch(`${BASE}?q=isbn:${encodeURIComponent(isbn)}`)
  if (!res.ok) return null

  const data = (await res.json()) as { items?: GoogleVolume[] }
  return mapVolume(data.items?.[0] ?? {})
}

export async function searchGoogleBooks(query: string): Promise<SearchResult[]> {
  const res = await fetch(`${BASE}?q=${encodeURIComponent(query)}&maxResults=20`)
  if (!res.ok) throw new Error('Erro ao buscar no Google Books')

  const data = (await res.json()) as { items?: GoogleVolume[] }
  return (data.items ?? [])
    .map(mapVolume)
    .filter((result): result is SearchResult => Boolean(result))
}

export async function fetchGoogleBookCoverOptions(volumeId: string): Promise<string[]> {
  const res = await fetch(`${BASE}/${encodeURIComponent(volumeId)}`)
  if (!res.ok) return []

  const volume = (await res.json()) as GoogleVolume
  const links = volume.volumeInfo?.imageLinks
  if (!links) return []

  return [
    httpsCover(links.extraLarge),
    httpsCover(links.large),
    httpsCover(links.medium),
    httpsCover(links.thumbnail),
    httpsCover(links.smallThumbnail),
  ].filter((url): url is string => Boolean(url))
}
