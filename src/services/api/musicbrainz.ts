const BASE = 'https://musicbrainz.org/ws/2'
const COVER_API = 'https://coverartarchive.org/release-group'
const USER_AGENT = 'Mora/1.0 (backlog-media-pwa)'

interface MbReleaseGroup {
  id: string
  title: string
  'first-release-date'?: string
  'artist-credit'?: { name: string; artist?: { name: string } }[]
}

interface CoverArtImage {
  front?: boolean
  image?: string
  thumbnails?: Record<string, string>
}

function yearFrom(date?: string) {
  return date?.slice(0, 4)
}

function toHttps(url: string) {
  return url.replace(/^http:\/\//i, 'https://')
}

async function resolveCover(releaseGroupId: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${COVER_API}/${releaseGroupId}`)
    if (!res.ok) return undefined
    const data = (await res.json()) as { images?: CoverArtImage[] }
    const front = data.images?.find((img) => img.front) ?? data.images?.[0]
    if (!front) return undefined
    const url = front.thumbnails?.['250'] ?? front.thumbnails?.small ?? front.image
    return url ? toHttps(url) : undefined
  } catch {
    return undefined
  }
}

function coverFromArchive(images?: CoverArtImage[]): string[] {
  if (!images?.length) return []

  return images
    .map((img) => {
      const url = img.thumbnails?.large ?? img.thumbnails?.['250'] ?? img.thumbnails?.small ?? img.image
      return url ? toHttps(url) : undefined
    })
    .filter((url): url is string => Boolean(url))
}

export async function fetchAlbumCoverOptions(releaseGroupId: string): Promise<string[]> {
  if (!releaseGroupId || releaseGroupId.startsWith('manual-')) return []

  try {
    const res = await fetch(`${COVER_API}/${releaseGroupId}`)
    if (!res.ok) return []
    const data = (await res.json()) as { images?: CoverArtImage[] }
    return coverFromArchive(data.images)
  } catch {
    return []
  }
}

export async function searchAlbums(query: string) {
  const url = `${BASE}/release-group?query=${encodeURIComponent(query)}&fmt=json&limit=20`
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Erro ao buscar álbuns')
  const data = (await res.json()) as { 'release-groups'?: MbReleaseGroup[] }

  const groups = (data['release-groups'] ?? []).filter((rg) => rg.id && rg.title)

  return Promise.all(
    groups.map(async (rg) => ({
      externalId: rg.id,
      type: 'album' as const,
      title: rg.title,
      subtitle: rg['artist-credit']?.map((a) => a.name || a.artist?.name).filter(Boolean).join(', '),
      coverUrl: await resolveCover(rg.id),
      year: yearFrom(rg['first-release-date']),
    })),
  )
}
