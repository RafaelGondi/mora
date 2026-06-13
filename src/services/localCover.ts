import { withTimeout } from '@/utils/withTimeout'

const PREPARE_TIMEOUT_MS = 12_000
const MAX_DATA_URL_CHARS = 120_000

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name)
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    const cleanup = () => URL.revokeObjectURL(url)

    img.onload = () => {
      cleanup()
      resolve(img)
    }

    img.onerror = () => {
      cleanup()
      reject(new Error('Não foi possível ler a imagem'))
    }

    img.src = url
  })
}

async function renderToDataUrl(file: File, maxEdge: number, quality: number): Promise<string> {
  const img = await loadImageFromFile(file)
  const ratio = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * ratio))
  const height = Math.max(1, Math.round(img.naturalHeight * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem')

  ctx.drawImage(img, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('Não foi possível gerar a capa')
  }

  return dataUrl
}

export async function prepareLocalCoverUrl(file: File): Promise<string> {
  if (!isImageFile(file)) {
    throw new Error('Escolha um arquivo de imagem')
  }

  let maxEdge = 720
  let quality = 0.82

  const compress = () =>
    withTimeout(
      renderToDataUrl(file, maxEdge, quality),
      PREPARE_TIMEOUT_MS,
      'Processamento da imagem demorou demais',
    )

  for (let attempt = 0; attempt < 7; attempt++) {
    const dataUrl = await compress()
    if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl
    quality = Math.max(0.5, quality - 0.08)
    maxEdge = Math.max(320, Math.round(maxEdge * 0.85))
  }

  throw new Error('Imagem grande demais. Tente outra foto ou use Sugerir capas.')
}
