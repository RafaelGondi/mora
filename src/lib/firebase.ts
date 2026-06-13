import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  )
}

export function isFirebaseStorageConfigured(): boolean {
  return isFirebaseConfigured() && Boolean(firebaseConfig.storageBucket)
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let initPromise: Promise<User | null> | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase não configurado. Defina as variáveis VITE_FIREBASE_* no .env')
  }
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp())
  return auth
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    db = initializeFirestore(getFirebaseApp(), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  }
  return db
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!isFirebaseStorageConfigured()) {
    throw new Error('Firebase Storage não configurado. Defina VITE_FIREBASE_STORAGE_BUCKET no .env')
  }
  if (!storage) storage = getStorage(getFirebaseApp())
  return storage
}

export function initFirebase(): Promise<User | null> {
  if (!isFirebaseConfigured()) return Promise.resolve(null)
  if (!initPromise) {
    initPromise = new Promise((resolve, reject) => {
      const firebaseAuth = getFirebaseAuth()
      const unsub = onAuthStateChanged(
        firebaseAuth,
        async (user) => {
          if (user) {
            unsub()
            resolve(user)
            return
          }
          try {
            const cred = await signInAnonymously(firebaseAuth)
            unsub()
            resolve(cred.user)
          } catch (err) {
            unsub()
            reject(err)
          }
        },
        (err) => {
          unsub()
          reject(err)
        },
      )
    })
  }
  return initPromise
}
