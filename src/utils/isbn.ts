export function normalizeIsbn(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9Xx]/g, '').toUpperCase()
  if (/^\d{9}[\dX]$/.test(cleaned) || /^\d{13}$/.test(cleaned)) return cleaned
  return null
}

export function formatIsbn(raw: string): string {
  const isbn = normalizeIsbn(raw)
  if (!isbn) return raw.trim()

  if (isbn.length === 13) {
    return `${isbn.slice(0, 3)}-${isbn.slice(3, 4)}-${isbn.slice(4, 7)}-${isbn.slice(7, 12)}-${isbn.slice(12)}`
  }

  return `${isbn.slice(0, 1)}-${isbn.slice(1, 4)}-${isbn.slice(4, 9)}-${isbn.slice(9)}`
}
