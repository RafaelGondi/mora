const BASE = 'https://api.tvmaze.com'

interface TvMazeResult {
  score: number
  show: {
    id: number
    name: string
    image?: { medium?: string; original?: string } | null
    premiered?: string | null
    summary?: string | null
    rating?: { average?: number | null } | null
    genres?: string[]
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').trim()
}

export async function fetchSeriesCoverOptions(externalId: string): Promise<string[]> {
  if (!/^\d+$/.test(externalId)) return []

  try {
    const res = await fetch(`${BASE}/shows/${externalId}`)
    if (!res.ok) return []
    const show = (await res.json()) as TvMazeResult['show']
    const urls: string[] = []
    if (show.image?.original) urls.push(show.image.original)
    if (show.image?.medium) urls.push(show.image.medium)
    return urls
  } catch {
    return []
  }
}

export async function searchSeries(query: string) {
  const url = `${BASE}/search/shows?q=${encodeURIComponent(query)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar no TVMaze')
  const data = (await res.json()) as TvMazeResult[]

  return data.slice(0, 20).map(({ show }) => ({
    externalId: String(show.id),
    type: 'series' as const,
    title: show.name,
    subtitle: show.genres?.slice(0, 2).join(', '),
    coverUrl: show.image?.medium ?? show.image?.original ?? undefined,
    year: show.premiered?.slice(0, 4),
    rating: show.rating?.average ?? undefined,
    overview: show.summary ? stripHtml(show.summary) : undefined,
  }))
}
