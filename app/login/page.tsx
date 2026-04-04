'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useTheme } from '@/components/theme-provider'
import { Leaf, Eye, EyeOff, Sun, Moon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

export default function LoginPage() {
  const { login, language } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || (language === 'hi' ? 'लॉगिन विफल' : language === 'mr' ? 'लॉगिन अयशस्वी' : 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  const text = language === 'hi'
    ? {
        subtitle: 'स्मार्ट फर्टिगेशन मॉनिटर',
        title: 'साइन इन',
        welcome: 'वापस स्वागत है! अपने क्रेडेंशियल दर्ज करें।',
        email: 'ईमेल',
        password: 'पासवर्ड',
        signIn: 'साइन इन',
        signingIn: 'साइन इन हो रहा है…',
        noAccount: 'खाता नहीं है?',
        signUp: 'साइन अप',
        demo: 'डेमो:',
        demoText: 'जारी रखने के लिए कोई भी ईमेल और पासवर्ड दर्ज करें',
      }
    : language === 'mr'
    ? {
        subtitle: 'स्मार्ट फर्टिगेशन मॉनिटर',
        title: 'साइन इन',
        welcome: 'पुन्हा स्वागत! तुमचे क्रेडेन्शियल भरा.',
        email: 'ईमेल',
        password: 'पासवर्ड',
        signIn: 'साइन इन',
        signingIn: 'साइन इन सुरू आहे…',
        noAccount: 'खाते नाही?',
        signUp: 'साइन अप',
        demo: 'डेमो:',
        demoText: 'पुढे जाण्यासाठी कोणताही ईमेल आणि पासवर्ड भरा',
      }
    : {
        subtitle: 'Smart Fertigation Monitor',
        title: 'Sign In',
        welcome: 'Welcome back! Enter your credentials.',
        email: 'Email',
        password: 'Password',
        signIn: 'Sign In',
        signingIn: 'Signing in…',
        noAccount: "Don't have an account?",
        signUp: 'Sign Up',
        demo: 'Demo:',
        demoText: 'Enter any email and password to continue',
      }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
      </button>

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-4">
            <Leaf className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Ferti<span className="text-primary">Guard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{text.subtitle}</p>
        </div>

        {/* Card */}
        <div className="card-glass rounded-2xl p-7 shadow-sm">
          <h2 className="font-display font-bold text-xl text-foreground mb-1">{text.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{text.welcome}</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{text.email}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{text.password}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? text.signingIn : text.signIn}
            </button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-5">
            {text.noAccount}{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              {text.signUp}
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              <strong>{text.demo}</strong> {text.demoText}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
