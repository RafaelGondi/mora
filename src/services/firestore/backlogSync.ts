import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirestoreDb, initFirebase } from '@/lib/firebase'
import type { BacklogItem } from '@/types/media'

const MIGRATION_KEY = 'mora-backlog-migrated'
const LEGACY_MIGRATION_KEY = 'ante-backlog-migrated'

function backlogCollection(uid: string) {
  return collection(getFirestoreDb(), 'users', uid, 'backlog')
}

function toFirestore(item: BacklogItem): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(item)) {
    if (value !== undefined) data[key] = value
  }
  return data
}

function fromFirestore(data: BacklogItem): BacklogItem {
  return { ...data }
}

export async function upsertBacklogItem(uid: string, item: BacklogItem): Promise<void> {
  await setDoc(doc(backlogCollection(uid), item.id), toFirestore(item))
}

export async function removeBacklogItem(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(backlogCollection(uid), id))
}

export async function migrateLocalItems(uid: string, localItems: BacklogItem[]): Promise<boolean> {
  if (localItems.length === 0) return false
  if (
    localStorage.getItem(MIGRATION_KEY) === uid ||
    localStorage.getItem(LEGACY_MIGRATION_KEY) === uid
  ) {
    localStorage.setItem(MIGRATION_KEY, uid)
    return false
  }

  const snapshot = await getDocs(backlogCollection(uid))
  if (!snapshot.empty) {
    localStorage.setItem(MIGRATION_KEY, uid)
    return false
  }

  const batch = writeBatch(getFirestoreDb())
  for (const item of localItems) {
    batch.set(doc(backlogCollection(uid), item.id), toFirestore(item))
  }
  await batch.commit()
  localStorage.setItem(MIGRATION_KEY, uid)
  return true
}

export async function subscribeBacklog(
  onChange: (items: BacklogItem[]) => void,
  onError?: (err: Error) => void,
): Promise<Unsubscribe> {
  const user = await initFirebase()
  if (!user) throw new Error('Usuário Firebase não disponível')

  return onSnapshot(
    backlogCollection(user.uid),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => fromFirestore(d.data() as BacklogItem))
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      onChange(items)
    },
    (err) => onError?.(err),
  )
}

export async function startBacklogSync(
  localItems: BacklogItem[],
  onChange: (items: BacklogItem[]) => void,
  onError?: (err: Error) => void,
): Promise<Unsubscribe> {
  const user = await initFirebase()
  if (!user) throw new Error('Usuário Firebase não disponível')

  await migrateLocalItems(user.uid, localItems)
  return subscribeBacklog(onChange, onError)
}
