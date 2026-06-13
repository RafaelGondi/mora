import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseStorage, initFirebase } from '@/lib/firebase'

export async function uploadCoverImage(itemId: string, file: File): Promise<string> {
  const user = await initFirebase()
  if (!user) throw new Error('Faça login no Firebase para enviar imagens')

  const storage = getFirebaseStorage()
  const safeName = file.name.replace(/[^\w.-]+/g, '_') || 'cover.jpg'
  const path = `users/${user.uid}/covers/${itemId}/${Date.now()}-${safeName}`
  const storageRef = ref(storage, path)

  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' })
  return getDownloadURL(storageRef)
}
