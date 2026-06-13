import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseStorage, ensureFirebaseUser } from '@/lib/firebase'

const UPLOAD_TIMEOUT_MS = 45_000
const MAX_EDGE = 1200

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

function mapStorageError(err: unknown): Error {
  const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : ''

  if (code === 'storage/unauthorized') {
    return new Error('Sem permissão no Storage. Publique firebase/storage.rules no Firebase.')
  }
  if (code === 'storage/canceled') {
    return new Error('Envio cancelado.')
  }
  if (code === 'storage/unknown' || code === 'storage/retry-limit-exceeded') {
    return new Error('Storage indisponível. Verifique se o Firebase Storage está ativo no console.')
  }

  if (err instanceof Error) return err
  return new Error('Erro ao enviar imagem')
}

async function prepareCoverFile(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem')
  }

  if (file.size <= 600_000 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    const ratio = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * ratio))
    const height = Math.max(1, Math.round(bitmap.height * ratio))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível processar a imagem')

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Não foi possível comprimir a imagem'))),
        'image/jpeg',
        0.85,
      )
    })

    return blob
  } catch {
    throw new Error('Não foi possível ler a imagem. Tente outra foto ou use Sugerir capas.')
  }
}

export async function uploadCoverImage(itemId: string, file: File): Promise<string> {
  const user = await ensureFirebaseUser()
  const storage = getFirebaseStorage()
  const prepared = await prepareCoverFile(file)
  const path = `users/${user.uid}/covers/${itemId}/${Date.now()}.jpg`
  const storageRef = ref(storage, path)

  try {
    await withTimeout(
      uploadBytes(storageRef, prepared, { contentType: 'image/jpeg' }),
      UPLOAD_TIMEOUT_MS,
      'Envio demorou demais. Verifique o Firebase Storage e sua conexão.',
    )

    return await withTimeout(
      getDownloadURL(storageRef),
      10_000,
      'Imagem enviada, mas a URL não foi gerada. Tente de novo.',
    )
  } catch (err) {
    throw mapStorageError(err)
  }
}
