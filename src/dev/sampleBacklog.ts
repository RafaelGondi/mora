/**
 * Sample backlog for development.
 *
 * Every entry came from Mora's own search APIs, so the ids, covers and years
 * are real and the covers actually resolve. Items where the source has no
 * artwork (Wikidata films, some MusicBrainz releases) are kept without a cover
 * on purpose — that is the common case in the real app and it exercises the
 * CoverImage fallback.
 *
 * Ids carry SAMPLE_ID_PREFIX so the sample set can be removed again without
 * touching anything you added yourself.
 */
import type { BacklogItem } from '@/types/media'

export const SAMPLE_ID_PREFIX = 'sample-'

type SampleSeed = Omit<BacklogItem, 'id' | 'addedAt' | 'updatedAt'>

const SEEDS: SampleSeed[] = [
  // Books — OpenLibrary covers
  {
    externalId: '/works/OL2900596W',
    type: 'book',
    title: 'Vidas secas',
    creator: 'Graciliano Ramos',
    coverUrl: 'https://covers.openlibrary.org/b/id/12369687-M.jpg',
    year: '1964',
    status: 'completed',
    userRating: 4,
    readingStartedAt: '2026-01-08',
    readingFinishedAt: '2026-01-22',
    notes: 'A secura da prosa combina com a do sertão. Reler o capítulo da Baleia.',
    sortOrder: 0,
  },
  {
    externalId: '/works/OL1003040W',
    type: 'book',
    title: 'Dom Casmurro',
    creator: 'Machado de Assis',
    coverUrl: 'https://covers.openlibrary.org/b/id/647501-M.jpg',
    year: '1900',
    status: 'completed',
    userRating: 5,
    readingStartedAt: '2025-11-02',
    readingFinishedAt: '2025-11-30',
    sortOrder: 1,
  },
  {
    externalId: '/works/OL46125W',
    type: 'book',
    title: 'Foundation',
    creator: 'Isaac Asimov',
    coverUrl: 'https://covers.openlibrary.org/b/id/14612610-M.jpg',
    year: '1951',
    status: 'in_progress',
    readingStartedAt: '2026-07-19',
    sortOrder: 2,
  },
  {
    externalId: '/works/OL1168083W',
    type: 'book',
    title: 'Nineteen Eighty-Four',
    creator: 'George Orwell',
    coverUrl: 'https://covers.openlibrary.org/b/id/9267242-M.jpg',
    year: '1949',
    status: 'want',
    sortOrder: 3,
  },

  // Films — Wikidata has no artwork, so these ride the cover fallback
  {
    externalId: 'Q184843',
    type: 'movie',
    title: 'Blade Runner: Perigo Iminente',
    creator: 'Ridley Scott',
    year: '1982',
    status: 'completed',
    userRating: 5,
    durationMinutes: 117,
    overview: 'filme de ficção científica de 1982 realizado por Ridley Scott',
    sortOrder: 0,
  },
  {
    externalId: 'Q220741',
    type: 'movie',
    title: 'Cidade de Deus',
    creator: 'Fernando Meirelles',
    year: '2002',
    status: 'completed',
    userRating: 5,
    durationMinutes: 130,
    overview: 'filme brasileiro de 2002',
    sortOrder: 1,
  },
  {
    externalId: 'Q61448040',
    type: 'movie',
    title: 'Parasite',
    creator: 'Bong Joon-ho',
    year: '2019',
    status: 'want',
    durationMinutes: 132,
    whereToWatch: ['Prime Video'],
    sortOrder: 2,
  },

  // Series — TVmaze covers
  {
    externalId: '44933',
    type: 'series',
    title: 'Severance',
    creator: 'Dan Erickson',
    coverUrl: 'https://static.tvmaze.com/uploads/images/medium_portrait/548/1371406.jpg',
    year: '2022',
    status: 'in_progress',
    whereToWatch: ['Apple TV+'],
    overview:
      'Mark Scout leads a team at Lumon Industries, whose employees have undergone a severance procedure.',
    sortOrder: 0,
  },
  {
    externalId: '30770',
    type: 'series',
    title: 'Chernobyl',
    creator: 'Craig Mazin',
    coverUrl: 'https://static.tvmaze.com/uploads/images/medium_portrait/193/482599.jpg',
    year: '2019',
    status: 'completed',
    userRating: 5,
    whereToWatch: ['Max'],
    sortOrder: 1,
  },

  // Games — FreeToGame covers
  {
    externalId: '3',
    type: 'game',
    title: 'Warframe',
    creator: 'Digital Extremes',
    coverUrl: 'https://www.freetogame.com/g/3/thumbnail.jpg',
    year: '2013',
    status: 'want',
    sortOrder: 0,
  },
  {
    externalId: '21',
    type: 'game',
    title: 'Destiny 2',
    creator: 'Bungie',
    coverUrl: 'https://www.freetogame.com/g/21/thumbnail.jpg',
    year: '2019',
    status: 'dropped',
    userRating: 2,
    notes: 'Larguei no meio da segunda temporada. Grind demais.',
    sortOrder: 1,
  },

  // Albums — Cover Art Archive
  {
    externalId: 'e75c0549-ad55-39e3-8025-c72c5d4a3c5d',
    type: 'album',
    title: 'Kid A',
    creator: 'Radiohead',
    coverUrl:
      'https://coverartarchive.org/release/0e8a1994-f0a7-481d-9be2-6c2f80e14de5/29475045164-250.jpg',
    year: '2000',
    status: 'completed',
    userRating: 5,
    sortOrder: 0,
  },
  {
    externalId: 'b29e94e7-0b0b-3a66-ab06-e02f8fa5054f',
    type: 'album',
    title: 'Clube da Esquina',
    creator: 'Milton Nascimento & Lô Borges',
    year: '1972',
    status: 'want',
    sortOrder: 1,
  },

  // Other — the manual-entry path
  {
    externalId: 'sample-manual-1',
    type: 'other',
    title: 'Documentário: Nostalgia da Luz',
    creator: 'Patricio Guzmán',
    year: '2010',
    status: 'want',
    manual: true,
    sortOrder: 0,
  },
]

/** Stable timestamps keep the sample set from reshuffling between loads. */
const BASE_TIME = Date.parse('2026-07-01T12:00:00.000Z')

export const SAMPLE_ITEMS: BacklogItem[] = SEEDS.map((seed, index) => {
  const stamp = new Date(BASE_TIME + index * 60_000).toISOString()
  return {
    ...seed,
    id: `${SAMPLE_ID_PREFIX}${seed.type}-${index}`,
    addedAt: stamp,
    updatedAt: stamp,
  }
})

export function isSampleItem(item: Pick<BacklogItem, 'id'>): boolean {
  return item.id.startsWith(SAMPLE_ID_PREFIX)
}
