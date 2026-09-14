import { GoogleAuthProvider, browserLocalPersistence, createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth'
import { getApps, initializeApp } from 'firebase/app'

export type AuthProfile = { name: string; email: string }

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const hasFirebaseConfig = Object.values(config).every(Boolean)
const firebaseAuth = hasFirebaseConfig
  ? getAuth(getApps().length ? getApps()[0] : initializeApp(config))
  : null

async function getFirebaseAuth() {
  if (!firebaseAuth) return null
  await setPersistence(firebaseAuth, browserLocalPersistence)
  return firebaseAuth
}

function readAccounts(): Record<string, { name: string; password: string }> {
  try { return JSON.parse(localStorage.getItem('taskly-accounts') || '{}') } catch { return {} }
}

function writeAccounts(accounts: Record<string, { name: string; password: string }>) {
  localStorage.setItem('taskly-accounts', JSON.stringify(accounts))
}

export async function registerAccount(name: string, email: string, password: string): Promise<AuthProfile> {
  const normalizedEmail = email.trim().toLowerCase()
  const auth = await getFirebaseAuth()
  if (auth) {
    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
    await updateProfile(credential.user, { displayName: name.trim() })
    return { name: name.trim(), email: credential.user.email || normalizedEmail }
  }
  const accounts = readAccounts()
  if (accounts[normalizedEmail]) throw new Error('auth/email-already-in-use')
  accounts[normalizedEmail] = { name: name.trim(), password }
  writeAccounts(accounts)
  return { name: name.trim(), email: normalizedEmail }
}

export async function loginAccount(email: string, password: string): Promise<AuthProfile> {
  const normalizedEmail = email.trim().toLowerCase()
  const auth = await getFirebaseAuth()
  if (auth) {
    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
    return { name: credential.user.displayName || normalizedEmail.split('@')[0], email: credential.user.email || normalizedEmail }
  }
  const account = readAccounts()[normalizedEmail]
  if (!account || account.password !== password) throw new Error('auth/invalid-credential')
  return { name: account.name, email: normalizedEmail }
}

export async function loginWithGoogle(): Promise<AuthProfile> {
  const auth = await getFirebaseAuth()
  if (!auth) throw new Error('auth/provider-not-configured')
  const credential = await signInWithPopup(auth, new GoogleAuthProvider())
  return { name: credential.user.displayName || credential.user.email?.split('@')[0] || 'Taskly user', email: credential.user.email || '' }
}

export async function resetPassword(email: string) {
  const auth = await getFirebaseAuth()
  if (!auth) throw new Error('auth/provider-not-configured')
  await sendPasswordResetEmail(auth, email.trim().toLowerCase())
}

export function authErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : ''
  if (code.includes('email-already-in-use')) return 'An account already exists for this email. Log in instead.'
  if (code.includes('invalid-credential') || code.includes('user-not-found') || code.includes('wrong-password')) return 'The email or password is incorrect.'
  if (code.includes('provider-not-configured')) return 'Google sign-in needs Firebase configuration before it can be used.'
  if (code.includes('weak-password')) return 'Use a stronger password with at least 8 characters, including a number.'
  return 'Authentication failed. Please try again.'
}

export const firebaseConfigured = hasFirebaseConfig
export const firebaseAuthInstance = firebaseAuth
