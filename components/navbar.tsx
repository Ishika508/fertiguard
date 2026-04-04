'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/components/theme-provider'
import { useAuth } from '@/components/auth-provider'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { SupportTicketModal } from '@/components/support-ticket-modal'
import {
  LayoutDashboard, BrainCircuit, Sun, Moon,
  LogOut, Leaf, Globe, Settings, ChevronDown, Wrench,
} from 'lucide-react'

const LANGS = [
  { code: 'en' as const, full: 'English', flag: 'EN' },
  { code: 'hi' as const, full: 'हिन्दी',  flag: 'HI' },
  { code: 'mr' as const, full: 'मराठी',   flag: 'MR' },
]

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout, language, setLanguage } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [langOpen, setLangOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navItems = [
    { href: '/dashboard',   icon: LayoutDashboard, label: t(language, 'dashboard')  },
    { href: '/ml-analysis', icon: BrainCircuit,    label: t(language, 'mlAnalysis') },
    { href: '/settings',    icon: Settings,        label: t(language, 'settings')   },
  ]

  const initials = user?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    // ── Use a fragment so the modal renders OUTSIDE the <nav> stacking context ──
    <>
      <nav className="sticky top-0 z-[120] w-full nav-border bg-background/90 backdrop-blur-xl pointer-events-auto">
        <div className="max-w-screen-xl mx-auto flex h-[60px] items-center justify-between px-5 sm:px-8">

          {/* ── Logo ── */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
              <Leaf className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="hidden sm:block font-semibold text-[15px] tracking-tight text-foreground">
              Ferti<span className="text-primary">Guard</span>
            </span>
          </Link>

          {/* ── Nav pill container ── */}
          <div className="flex items-center gap-0.5 bg-muted/60 border border-border/60 rounded-2xl px-1 py-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                    active
                      ? 'bg-card text-foreground shadow-sm border border-border/60'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                  )}
                >
                  <item.icon className={cn('w-3.5 h-3.5', active && 'text-primary')} strokeWidth={active ? 2.5 : 2} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-card/60"
            >
              <Wrench className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden md:inline">{t(language, 'support')}</span>
            </button>
          </div>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1">

            {/* Language dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline uppercase tracking-wide text-xs font-semibold">{language}</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform', langOpen && 'rotate-180')} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-36 rounded-2xl border border-border bg-popover shadow-xl shadow-black/10 overflow-hidden anim-scale-in z-50">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLanguage(l.code); setLangOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted flex items-center justify-between',
                        language === l.code ? 'text-primary font-semibold' : 'text-foreground'
                      )}
                    >
                      <span>{l.full}</span>
                      {language === l.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'dark'
                ? <Sun className="w-3.5 h-3.5" />
                : <Moon className="w-3.5 h-3.5" />
              }
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-0.5" />

            {/* User avatar + logout */}
            {user && (
              <div className="flex items-center gap-1.5">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-muted/60 border border-border/50">
                  <div className="w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{initials}</span>
                  </div>
                  <span className="text-[13px] font-medium text-foreground max-w-[90px] truncate">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title={t(language, 'logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* ✅ Modal is OUTSIDE <nav> — no stacking context conflict */}
      <SupportTicketModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        language={language}
      />
    </>
  )
}