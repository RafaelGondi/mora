const BASE = 'https://openlibrary.org'

interface OlDoc {
  key?: string
  title?: string
  author_name?: string[]
  cover_i?: number
  first_publish_year?: number
}

function coverUrl(coverId?: number) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : undefined
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
