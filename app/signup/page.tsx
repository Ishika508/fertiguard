'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useTheme } from '@/components/theme-provider'
import { Leaf, Eye, EyeOff, Sun, Moon, AlertCircle, Globe } from 'lucide-react'
import type { Language } from '@/lib/i18n'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
]

export default function SignupPage() {
  const { signup } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [landAcre, setLandAcre] = useState('')
  const [cropType, setCropType] = useState('')
  const [lang, setLang] = useState<Language>('en')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const text = lang === 'hi'
    ? {
        pageSub: 'अपना खाता बनाएं',
        title: 'साइन अप',
        desc: 'अपनी सिंचाई मॉनिटर करने के लिए FertiGuard से जुड़ें।',
        fullName: 'पूरा नाम',
        email: 'ईमेल',
        password: 'पासवर्ड',
        land: 'भूमि क्षेत्र (एकड़)',
        crop: 'फसल प्रकार',
        language: 'भाषा',
        create: 'खाता बनाएं',
        creating: 'खाता बनाया जा रहा है…',
        hasAccount: 'पहले से खाता है?',
        signIn: 'साइन इन',
        passErr: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए',
        detailErr: 'कृपया सही भूमि क्षेत्र और फसल प्रकार दर्ज करें',
        signupFail: 'साइनअप विफल',
      }
    : lang === 'mr'
    ? {
        pageSub: 'तुमचे खाते तयार करा',
        title: 'साइन अप',
        desc: 'सिंचन निरीक्षणासाठी FertiGuard मध्ये सामील व्हा.',
        fullName: 'पूर्ण नाव',
        email: 'ईमेल',
        password: 'पासवर्ड',
        land: 'जमीन क्षेत्र (एकर)',
        crop: 'पीक प्रकार',
        language: 'भाषा',
        create: 'खाते तयार करा',
        creating: 'खाते तयार होत आहे…',
        hasAccount: 'आधीच खाते आहे?',
        signIn: 'साइन इन',
        passErr: 'पासवर्ड किमान 6 अक्षरांचा असावा',
        detailErr: 'कृपया वैध जमीन क्षेत्र आणि पीक प्रकार भरा',
        signupFail: 'साइनअप अयशस्वी',
      }
    : {
        pageSub: 'Create your account',
        title: 'Sign Up',
        desc: 'Join FertiGuard to monitor your irrigation.',
        fullName: 'Full Name',
        email: 'Email',
        password: 'Password',
        land: 'Land Area (acres)',
        crop: 'Crop Type',
        language: 'Language',
        create: 'Create Account',
        creating: 'Creating account…',
        hasAccount: 'Already have an account?',
        signIn: 'Sign In',
        passErr: 'Password must be at least 6 characters',
        detailErr: 'Please enter valid land area and crop type',
        signupFail: 'Signup failed',
      }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError(text.passErr); return }
    const acres = Number(landAcre)
    if (!cropType.trim() || !Number.isFinite(acres) || acres <= 0) {
      setError(text.detailErr)
      return
    }
    setLoading(true)
    try {
      await signup(name, email, password, lang, acres, cropType.trim())
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || text.signupFail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
      </button>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-4">
            <Leaf className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Ferti<span className="text-primary">Guard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{text.pageSub}</p>
        </div>

        <div className="card-glass rounded-2xl p-7 shadow-sm">
          <h2 className="font-display font-bold text-xl text-foreground mb-1">{text.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{text.desc}</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{text.fullName}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ramesh Patil"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>

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
                  placeholder="Min. 6 characters"
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

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{text.land}</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={landAcre}
                onChange={e => setLandAcre(e.target.value)}
                placeholder="e.g. 2.5"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{text.crop}</label>
              <input
                type="text"
                value={cropType}
                onChange={e => setCropType(e.target.value)}
                placeholder="e.g. Sugarcane"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> {text.language}
              </label>
              <select
                value={lang}
                onChange={e => setLang(e.target.value as Language)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? text.creating : text.create}
            </button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-5">
            {text.hasAccount}{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              {text.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
