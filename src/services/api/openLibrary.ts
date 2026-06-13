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
