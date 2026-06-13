const BASE = 'https://www.freetogame.com/api'

interface FreeGame {
  id: number
  title: string
  thumbnail: string
  release_date: string
  genre: string
  short_description: string
}

let cache: FreeGame[] | null = null

async function loadGames() {
  if (cache) return cache
  const res = await fetch(`${BASE}/games`)
  if (!res.ok) throw new Error('Erro ao buscar no FreeToGame')
  cache = (await res.json()) as FreeGame[]
  return cache
}

export async function searchGames(query: string) {
  const games = await loadGames()
  const term = query.toLowerCase()

  return games
    .filter(
      (g) =>
        g.title.toLowerCase().includes(term) ||
        g.genre.toLowerCase().includes(term) ||
        g.short_description.toLowerCase().includes(term),
    )
    .slice(0, 20)
    .map((game) => ({
      externalId: String(game.id),
      type: 'game' as const,
      title: game.title,
      subtitle: game.genre,
      coverUrl: game.thumbnail,
      year: game.release_date?.slice(0, 4),
      overview: game.short_description,
    }))
}
