import type { SearchResult } from '@/types/media'
import { normalizeIsbn } from '@/utils/isbn'

const BASE = 'https://openlibrary.org'

interface OlDoc {
  key?: string
  title?: string
  author_name?: string[]
  cover_i?: number
  first_publish_year?: number
}

function coverUrl(coverId?: number, size: 'M' | 'L' = 'M') {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : undefined
}

function addCoverId(urls: Set<string>, coverId?: number) {
  const large = coverUrl(coverId, 'L')
  if (large) urls.add(large)
}

export async function fetchBookCoverOptions(externalId: string, title: string): Promise<string[]> {
  const urls = new Set<string>()

  try {
    if (externalId.startsWith('/books/')) {
      const res = await fetch(`${BASE}${externalId}.json`)
      if (res.ok) {
        const data = (await res.json()) as {
          covers?: number[]
          works?: { key?: string }[]
        }
        for (const id of data.covers ?? []) addCoverId(urls, id)

        const workKey = data.works?.[0]?.key
        if (workKey) externalId = workKey
      }
    }

    if (externalId.startsWith('/works/')) {
      const res = await fetch(`${BASE}${externalId}/editions.json?limit=50`)
      if (res.ok) {
        const data = (await res.json()) as {
          entries?: { cover_i?: number; covers?: number[] }[]
        }
        for (const entry of data.entries ?? []) {
          addCoverId(urls, entry.cover_i)
          for (const id of entry.covers ?? []) addCoverId(urls, id)
        }
      }
    }
  } catch {
    /* segue para fallback por título */
  }

  if (urls.size < 4 && title.trim()) {
    const results = await searchBooks(title.trim())
    for (const result of results.slice(0, 12)) {
      if (result.coverUrl) {
        urls.add(result.coverUrl.replace('-M.jpg', '-L.jpg'))
      }
    }
  }

  return [...urls]
}

interface OlIsbnBook {
  title?: string
  subtitle?: string
  authors?: { name?: string }[]
  publish_date?: string
  publishers?: string[]
  number_of_pages?: number
  cover?: { large?: string; medium?: string; small?: string }
  covers?: { large?: string; medium?: string; small?: string }
  url?: string
  key?: string
}

function mapIsbnBook(isbn: string, book: OlIsbnBook): SearchResult | null {
  if (!book.title) return null

  let externalId = book.key
  if (!externalId && book.url) {
    const match = book.url.match(/\/books\/(OL\d+M)/)
    if (match) externalId = `/books/${match[1]}`
  }
  if (!externalId) externalId = `/books/isbn:${isbn}`

  const authors = (book.authors ?? [])
    .map((author) => author.name?.trim())
    .filter((name): name is string => Boolean(name))

  const year = book.publish_date?.match(/\d{4}/)?.[0]
  const coverUrl =
    book.cover?.large ??
    book.cover?.medium ??
    book.covers?.large ??
    `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`

  const details = [
    book.publishers?.length ? `Editora: ${book.publishers.join(', ')}` : undefined,
    book.number_of_pages ? `${book.number_of_pages} páginas` : undefined,
  ].filter(Boolean)

  return {
    externalId,
    type: 'book',
    title: book.subtitle ? `${book.title}: ${book.subtitle}` : book.title,
    subtitle: authors.join(', ') || undefined,
    creator: authors.join(', ') || undefined,
    coverUrl,
    year,
    overview: details.length ? details.join(' · ') : undefined,
  }
}

export async function lookupBookByIsbn(rawIsbn: string): Promise<SearchResult | null> {
  const isbn = normalizeIsbn(rawIsbn)
  if (!isbn) throw new Error('ISBN inválido')

  const apiUrl = `${BASE}/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`
  const apiRes = await fetch(apiUrl)
  if (!apiRes.ok) throw new Error('Erro ao consultar ISBN no Open Library')

  const apiData = (await apiRes.json()) as Record<string, OlIsbnBook>
  const fromApi = mapIsbnBook(isbn, apiData[`ISBN:${isbn}`] ?? {})
  if (fromApi) return fromApi

  const editionRes = await fetch(`${BASE}/isbn/${encodeURIComponent(isbn)}.json`)
  if (!editionRes.ok) return null

  const edition = (await editionRes.json()) as {
    title?: string
    authors?: { author?: { key?: string }; key?: string }[]
    works?: { key?: string }[]
    covers?: number[]
    publish_date?: string
    number_of_pages?: number
    publishers?: string[]
  }

  if (!edition.title) return null

  const authorNames: string[] = []
  for (const entry of edition.authors ?? []) {
    const authorKey = entry.author?.key ?? entry.key
    if (!authorKey) continue
    try {
      const authorRes = await fetch(`${BASE}${authorKey}.json`)
      if (!authorRes.ok) continue
      const author = (await authorRes.json()) as { name?: string }
      if (author.name) authorNames.push(author.name)
    } catch {
      /* ignora autor individual */
    }
  }

  const coverId = edition.covers?.[0]
  const externalId = edition.works?.[0]?.key ?? `/books/isbn:${isbn}`

  return {
    externalId,
    type: 'book',
    title: edition.title,
    subtitle: authorNames.join(', ') || undefined,
    creator: authorNames.join(', ') || undefined,
    coverUrl: coverId ? coverUrl(coverId, 'L') : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`,
    year: edition.publish_date?.match(/\d{4}/)?.[0],
    overview: [
      edition.publishers?.length ? `Editora: ${edition.publishers.join(', ')}` : undefined,
      edition.number_of_pages ? `${edition.number_of_pages} páginas` : undefined,
    ]
      .filter(Boolean)
      .join(' · ') || undefined,
  }
}

export async function searchBooks(query: string) {
  const url = `${BASE}/search.json?q=${encodeURIComponent(query)}&limit=20`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar no Open Library')
  const data = (await res.json()) as { docs: OlDoc[] }

  return data.docs
    .filter((doc) => doc.title && doc.key)
    .map((doc) => ({
      externalId: doc.key!,
      type: 'book' as const,
      title: doc.title!,
      subtitle: doc.author_name?.join(', '),
      coverUrl: coverUrl(doc.cover_i),
      year: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
    }))
}
