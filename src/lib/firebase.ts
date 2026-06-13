import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  type Auth,
  type User,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { withTimeout } from '@/utils/withTimeout'

const AUTH_TIMEOUT_MS = 12_000

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

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let cachedUser: User | null = null
let authAttempted = false
let inflightAuth: Promise<User | null> | null = null

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

async function resolveAuthUser(): Promise<User | null> {
  const firebaseAuth = getFirebaseAuth()

  await withTimeout(
    firebaseAuth.authStateReady(),
    AUTH_TIMEOUT_MS,
    'Firebase Auth demorou demais. Verifique sua conexão.',
  )

  if (firebaseAuth.currentUser) return firebaseAuth.currentUser

  const cred = await withTimeout(
    signInAnonymously(firebaseAuth),
    AUTH_TIMEOUT_MS,
    'Não foi possível autenticar. Ative login anônimo no Firebase.',
  )

  return cred.user
}

function startAuth(): Promise<User | null> {
  if (inflightAuth) return inflightAuth

  inflightAuth = resolveAuthUser()
    .then((user) => {
      cachedUser = user
      authAttempted = true
      return user
    })
    .catch((err) => {
      authAttempted = true
      cachedUser = null
      console.error('[firebase] auth failed', err)
      return null
    })
    .finally(() => {
      inflightAuth = null
    })

  return inflightAuth
}

export async function ensureFirebaseUser(): Promise<User> {
  const firebaseAuth = getFirebaseAuth()
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser

  const user = await resolveAuthUser()
  if (!user) {
    throw new Error('Não foi possível autenticar no Firebase')
  }

  cachedUser = user
  authAttempted = true
  return user
}

export function initFirebase(): Promise<User | null> {
  if (!isFirebaseConfigured()) return Promise.resolve(null)
  if (cachedUser) return Promise.resolve(cachedUser)
  if (authAttempted && !cachedUser) return Promise.resolve(null)
  return startAuth()
}
