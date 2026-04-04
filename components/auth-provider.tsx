'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Language } from '@/lib/i18n'
import { ensureSessionAuthPersistence, loginUser, logoutUser, onAuthChanged, registerUser } from '@/lib/firebaseAuth'

interface User {
  uid: string
  name: string
  email: string
  language: Language
  landAcre: number
  cropType: string
}

interface AuthContextType {
  user: User | null
  language: Language
  setLanguage: (l: Language) => void
  login: (email: string, password: string) => Promise<void>
  signup: (
    name: string,
    email: string,
    password: string,
    lang: Language,
    landAcre: number,
    cropType: string
  ) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false'

const AuthContext = createContext<AuthContextType>({
  user: null,
  language: 'en',
  setLanguage: () => {},
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [language, setLangState] = useState<Language>('en')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedLang = localStorage.getItem('fg-lang') as Language | null
    if (storedLang) setLangState(storedLang)

    if (DEMO_MODE) {
      const stored = sessionStorage.getItem('fg-user')
      if (stored) setUser(JSON.parse(stored))
      setLoading(false)
      return
    }

    localStorage.removeItem('fg-user')
    sessionStorage.removeItem('fg-user')
    ensureSessionAuthPersistence().catch(() => {})
    const unsub = onAuthChanged((firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser?.language) {
        setLangState(firebaseUser.language)
        localStorage.setItem('fg-lang', firebaseUser.language)
      }
      setLoading(false)
    })

    return () => unsub()
  }, [])

  const setLanguage = (l: Language) => {
    setLangState(l)
    localStorage.setItem('fg-lang', l)
  }

  const login = async (email: string, password: string) => {
    if (!email || !password) throw new Error('Enter email and password')

    if (!DEMO_MODE) {
      const firebaseUser = await loginUser(email, password)
      setUser(firebaseUser)
      setLanguage(firebaseUser.language)
      return
    }

    const mockUser: User = {
      uid: 'demo-uid-001',
      name: email.split('@')[0],
      email,
      language: language,
      landAcre: 0,
      cropType: 'Unknown',
    }
    setUser(mockUser)
    sessionStorage.setItem('fg-user', JSON.stringify(mockUser))
  }

  const signup = async (
    name: string,
    email: string,
    password: string,
    lang: Language,
    landAcre: number,
    cropType: string
  ) => {
    if (!name || !email || !password || !cropType || !(landAcre > 0)) {
      throw new Error('Fill all fields with valid land and crop details')
    }

    if (!DEMO_MODE) {
      const firebaseUser = await registerUser(name, email, password, lang, landAcre, cropType)
      setUser(firebaseUser)
      setLanguage(firebaseUser.language)
      return
    }

    const newUser: User = {
      uid: `uid-${Date.now()}`,
      name,
      email,
      language: lang,
      landAcre,
      cropType,
    }
    setUser(newUser)
    setLanguage(lang)
    sessionStorage.setItem('fg-user', JSON.stringify(newUser))
  }

  const logout = async () => {
    if (!DEMO_MODE) {
      await logoutUser()
    }
    setUser(null)
    localStorage.removeItem('fg-user')
    sessionStorage.removeItem('fg-user')
  }

  return (
    <AuthContext.Provider value={{ user, language, setLanguage, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
