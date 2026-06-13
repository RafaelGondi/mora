const API = 'https://www.wikidata.org/w/api.php'
const FILM_TYPE = 'Q11424'

interface WbSearchItem {
  id: string
  label?: string
  description?: string
}

interface WbEntity {
  labels?: Record<string, { value: string }>
  descriptions?: Record<string, { value: string }>
  claims?: {
    P31?: { mainsnak?: { datavalue?: { value?: { id?: string } } } }[]
    P18?: { mainsnak?: { datavalue?: { value?: string } } }[]
    P577?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[]
    P444?: { mainsnak?: { datavalue?: { value?: { amount?: string } } } }[]
  }
}

function commonsImageUrl(filename: string, width = 300) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`
}

function yearFromWikidata(time?: string) {
  return time?.slice(1, 5)
}

async function wikidataFetch<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, format: 'json', origin: '*' })
  const res = await fetch(`${API}?${qs}`)
  if (!res.ok) throw new Error('Erro ao buscar no Wikidata')
  return res.json() as Promise<T>
}

function isFilm(entity: WbEntity) {
  const instances = entity.claims?.P31 ?? []
  return instances.some((c) => c.mainsnak?.datavalue?.value?.id === FILM_TYPE)
}

function pickLabel(entity: WbEntity) {
  return entity.labels?.pt?.value ?? entity.labels?.en?.value
}

function pickDescription(entity: WbEntity) {
  return entity.descriptions?.pt?.value ?? entity.descriptions?.en?.value
}

export async function fetchWikidataCoverOptions(entityId: string): Promise<string[]> {
  if (!/^Q\d+$/.test(entityId)) return []

  const entityData = await wikidataFetch<{ entities?: Record<string, WbEntity> }>({
    action: 'wbgetentities',
    ids: entityId,
    props: 'claims',
  })

  const claims = entityData.entities?.[entityId]?.claims?.P18 ?? []
  return claims
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .filter((value): value is string => typeof value === 'string')
    .map((filename) => commonsImageUrl(filename, 450))
}

export async function searchMovies(query: string) {
  const searchData = await wikidataFetch<{ search?: WbSearchItem[] }>({
    action: 'wbsearchentities',
    search: query,
    language: 'pt',
    uselang: 'pt',
    type: 'item',
    limit: '20',
  })

  const ids = (searchData.search ?? []).map((s) => s.id).filter(Boolean)
  if (!ids.length) return []

  const entityData = await wikidataFetch<{ entities?: Record<string, WbEntity> }>({
    action: 'wbgetentities',
    ids: ids.join('|'),
    props: 'claims|labels|descriptions',
    languages: 'pt|en',
  })

  const results = []

  for (const id of ids) {
    const entity = entityData.entities?.[id]
    if (!entity || !isFilm(entity)) continue

    const title = pickLabel(entity)
    if (!title) continue

    const imageFile = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    const rating = entity.claims?.P444?.[0]?.mainsnak?.datavalue?.value?.amount

    results.push({
      externalId: id,
      type: 'movie' as const,
      title,
      coverUrl: imageFile ? commonsImageUrl(imageFile) : undefined,
      year: yearFromWikidata(entity.claims?.P577?.[0]?.mainsnak?.datavalue?.value?.time),
      rating: rating ? parseFloat(rating) : undefined,
      overview: pickDescription(entity),
    })
  }

  return results.slice(0, 20)
}
