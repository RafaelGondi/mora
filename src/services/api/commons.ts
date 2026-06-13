const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

interface CommonsPage {
  imageinfo?: { thumburl?: string; url?: string }[]
}

export async function searchCommonsImages(query: string, limit = 10): Promise<string[]> {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '450',
  })

  try {
    const res = await fetch(`${COMMONS_API}?${params}`)
    if (!res.ok) return []
    const data = (await res.json()) as { query?: { pages?: Record<string, CommonsPage> } }
    const pages = Object.values(data.query?.pages ?? {})

    return pages
      .map((page) => page.imageinfo?.[0]?.thumburl ?? page.imageinfo?.[0]?.url)
      .filter((url): url is string => Boolean(url))
  } catch {
    return []
  }
}

export function commonsFileUrl(filename: string, width = 450) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`
}

export async function wikipediaThumbnail(title: string, lang: 'pt' | 'en' = 'pt'): Promise<string | undefined> {
  if (!title.trim()) return undefined

  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    )
    if (!res.ok) return undefined
    const data = (await res.json()) as { thumbnail?: { source?: string } }
    return data.thumbnail?.source
  } catch {
    return undefined
  }
}
