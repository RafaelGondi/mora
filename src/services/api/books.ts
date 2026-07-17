import type { SearchResult } from '@/types/media'
import { normalizeIsbn } from '@/utils/isbn'
import {
  fetchBookCoverOptions as fetchOpenLibraryCoverOptions,
  lookupBookByIsbn as lookupOpenLibraryByIsbn,
  searchBooks as searchOpenLibraryBooks,
} from '@/services/api/openLibrary'
import {
  fetchGoogleBookCoverOptions,
  lookupGoogleBookByIsbn,
  searchGoogleBooks,
} from '@/services/api/googleBooks'

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function mergeBookResults(primary: SearchResult[], secondary: SearchResult[]): SearchResult[] {
  const seen = new Set(primary.map((result) => normalizeTitle(result.title)))
  const merged = [...primary]

  for (const book of secondary) {
    const key = normalizeTitle(book.title)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(book)
    if (merged.length >= 20) break
  }

  return merged
}

export async function searchBooks(query: string): Promise<SearchResult[]> {
  const [openLibrary, google] = await Promise.allSettled([
    searchOpenLibraryBooks(query),
    searchGoogleBooks(query),
  ])

  const fromOpenLibrary = openLibrary.status === 'fulfilled' ? openLibrary.value : []
  const fromGoogle = google.status === 'fulfilled' ? google.value : []

  return mergeBookResults(fromOpenLibrary, fromGoogle)
}

export async function lookupBookByIsbn(rawIsbn: string): Promise<SearchResult | null> {
  const isbn = normalizeIsbn(rawIsbn)
  if (!isbn) throw new Error('ISBN inválido')

  const fromOpenLibrary = await lookupOpenLibraryByIsbn(isbn)
  if (fromOpenLibrary) return fromOpenLibrary

  return lookupGoogleBookByIsbn(isbn)
}

export async function fetchBookCoverOptions(externalId: string, title: string): Promise<string[]> {
  if (externalId.startsWith('googlebooks:')) {
    const volumeId = externalId.slice('googlebooks:'.length)
    const covers = await fetchGoogleBookCoverOptions(volumeId)
    if (covers.length) return covers
  }

  return fetchOpenLibraryCoverOptions(externalId, title)
}
