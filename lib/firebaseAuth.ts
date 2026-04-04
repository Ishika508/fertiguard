/**
 * Firebase Authentication helpers for FertiGuard
 *
 * Set NEXT_PUBLIC_DEMO_MODE=false in .env.local to use real Firebase Auth.
 * Make sure Firebase Authentication → Email/Password is enabled in the console.
 */

import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { ref, set, get } from 'firebase/database'
import { auth, db } from './firebase'
import type { Language } from './i18n'

export interface FGUser {
  uid: string
  name: string
  email: string
  language: Language
  landAcre: number
  cropType: string
}

/**
 * Register a new user and save profile to Realtime DB.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  language: Language,
  landAcre: number,
  cropType: string
): Promise<FGUser> {
  await setPersistence(auth, browserSessionPersistence)
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const user = cred.user

  // Save display name to Firebase Auth
  await updateProfile(user, { displayName: name })

  // Save extended profile to Realtime DB
  const profile: FGUser = {
    uid: user.uid,
    name,
    email,
    language,
    landAcre,
    cropType,
  }
  await set(ref(db, `users/${user.uid}`), profile)

  return profile
}

/**
 * Sign in an existing user and load their profile.
 */
export async function loginUser(email: string, password: string): Promise<FGUser> {
  await setPersistence(auth, browserSessionPersistence)
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const user = cred.user

  // Load profile from DB
  const snap = await get(ref(db, `users/${user.uid}`))
  if (snap.exists()) {
    const p = snap.val() as Partial<FGUser>
    return {
      uid: user.uid,
      name: p.name ?? user.displayName ?? email.split('@')[0],
      email: p.email ?? user.email ?? email,
      language: p.language ?? 'en',
      landAcre: Number(p.landAcre ?? 0),
      cropType: p.cropType ?? 'Unknown',
    }
  }

  // Fallback if profile missing
  return {
    uid: user.uid,
    name: user.displayName ?? email.split('@')[0],
    email: user.email ?? email,
    language: 'en',
    landAcre: 0,
    cropType: 'Unknown',
  }
}

/**
 * Sign out current user.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

export async function ensureSessionAuthPersistence(): Promise<void> {
  await setPersistence(auth, browserSessionPersistence)
}

/**
 * Listen to Firebase auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChanged(callback: (user: FGUser | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null)
      return
    }

    // Try to load profile
    const snap = await get(ref(db, `users/${firebaseUser.uid}`))
    if (snap.exists()) {
      const p = snap.val() as Partial<FGUser>
      callback({
        uid: firebaseUser.uid,
        name: p.name ?? firebaseUser.displayName ?? '',
        email: p.email ?? firebaseUser.email ?? '',
        language: p.language ?? 'en',
        landAcre: Number(p.landAcre ?? 0),
        cropType: p.cropType ?? 'Unknown',
      })
    } else {
      callback({
        uid: firebaseUser.uid,
        name: firebaseUser.displayName ?? '',
        email: firebaseUser.email ?? '',
        language: 'en',
        landAcre: 0,
        cropType: 'Unknown',
      })
    }
  })
}
