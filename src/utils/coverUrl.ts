export function isLocalCover(url?: string): boolean {
  return Boolean(url?.startsWith('data:image/'))
}

export function isRemoteCover(url?: string): boolean {
  return Boolean(url && /^https?:\/\//i.test(url))
}
