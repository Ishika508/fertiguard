'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useTheme } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { Chatbot } from '@/components/chatbot/Chatbot'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import {
  User, Globe, Moon, Sun, Shield, Bell, Cpu,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

const LANGUAGES = [
  { value: 'en' as Language, label: 'English', native: 'English' },
  { value: 'hi' as Language, label: 'Hindi', native: 'हिन्दी' },
  { value: 'mr' as Language, label: 'Marathi', native: 'मराठी' },
]

const REFRESH_INTERVALS = [3000, 5000, 10000, 30000]

export default function SettingsPage() {
  const { user, loading: authLoading, language, setLanguage } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [notifications, setNotifications] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000)
  const [saved, setSaved] = useState(false)

  React.useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const txt = language === 'hi'
    ? {
        title: 'सेटिंग्स',
        subtitle: 'अपनी FertiGuard प्राथमिकताएं प्रबंधित करें',
        profile: 'प्रोफाइल',
        language: 'भाषा',
        appearance: 'दिखावट',
        darkMode: 'डार्क मोड',
        darkModeDesc: 'लाइट और डार्क थीम के बीच बदलें',
        deviceData: 'डिवाइस और डेटा',
        refreshInterval: 'डेटा रिफ्रेश अंतराल',
        alertNotifications: 'अलर्ट नोटिफिकेशन',
        alertNotificationsDesc: 'क्लॉग और लीक अलर्ट के लिए बैनर दिखाएं',
        systemInfo: 'सिस्टम जानकारी',
        deviceId: 'डिवाइस आईडी',
        appVersion: 'ऐप संस्करण',
        mode: 'मोड',
        demoMode: 'डेमो (सिम्युलेटेड डेटा)',
        productionMode: 'प्रोडक्शन (Firebase)',
        save: 'सेटिंग्स सेव करें',
        saved: '✓ सेव किया गया',
        savedToast: 'सेटिंग्स सफलतापूर्वक सेव हुईं',
        seconds: 'सेकंड',
      }
    : language === 'mr'
    ? {
        title: 'सेटिंग्ज',
        subtitle: 'तुमच्या FertiGuard प्राधान्ये व्यवस्थापित करा',
        profile: 'प्रोफाइल',
        language: 'भाषा',
        appearance: 'दृश्य',
        darkMode: 'डार्क मोड',
        darkModeDesc: 'लाइट आणि डार्क थीममध्ये बदला',
        deviceData: 'डिव्हाइस आणि डेटा',
        refreshInterval: 'डेटा रिफ्रेश अंतर',
        alertNotifications: 'अलर्ट सूचना',
        alertNotificationsDesc: 'क्लॉग आणि गळती अलर्टसाठी बॅनर दाखवा',
        systemInfo: 'सिस्टम माहिती',
        deviceId: 'डिव्हाइस आयडी',
        appVersion: 'अॅप आवृत्ती',
        mode: 'मोड',
        demoMode: 'डेमो (सिम्युलेटेड डेटा)',
        productionMode: 'प्रोडक्शन (Firebase)',
        save: 'सेटिंग्ज जतन करा',
        saved: '✓ जतन केले',
        savedToast: 'सेटिंग्ज यशस्वीरित्या जतन केल्या',
        seconds: 'सेकंद',
      }
    : {
        title: 'Settings',
        subtitle: 'Manage your FertiGuard preferences',
        profile: 'Profile',
        language: 'Language',
        appearance: 'Appearance',
        darkMode: 'Dark Mode',
        darkModeDesc: 'Switch between light and dark theme',
        deviceData: 'Device & Data',
        refreshInterval: 'Data Refresh Interval',
        alertNotifications: 'Alert Notifications',
        alertNotificationsDesc: 'Show banners for clog and leak alerts',
        systemInfo: 'System Info',
        deviceId: 'Device ID',
        appVersion: 'App Version',
        mode: 'Mode',
        demoMode: 'Demo (Simulated Data)',
        productionMode: 'Production (Firebase)',
        save: 'Save Settings',
        saved: '✓ Saved',
        savedToast: 'Settings saved successfully',
        seconds: 'seconds',
      }

  const handleSave = () => {
    localStorage.setItem('fg-refresh-interval', String(refreshInterval))
    localStorage.setItem('fg-notifications', String(notifications))
    setSaved(true)
    toast.success(txt.savedToast)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">{txt.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{txt.subtitle}</p>
        </div>

        {/* Profile Section */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
            <User className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">{txt.profile}</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="font-display font-bold text-xl text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">{txt.language}</h2>
          </div>
          <div className="p-3">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => setLanguage(l.value)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left',
                  language === l.value
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent/50 text-foreground'
                )}
              >
                <div>
                  <p className="font-medium text-sm">{l.native}</p>
                  <p className="text-xs text-muted-foreground">{l.label}</p>
                </div>
                {language === l.value && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">{txt.appearance}</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{txt.darkMode}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{txt.darkModeDesc}</p>
              </div>
              <button
                onClick={toggleTheme}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors duration-200',
                  theme === 'dark' ? 'bg-primary' : 'bg-muted border border-border'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center',
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                )}>
                  {theme === 'dark'
                    ? <Moon className="w-2.5 h-2.5 text-primary" />
                    : <Sun className="w-2.5 h-2.5 text-amber-500" />
                  }
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Device Settings */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">{txt.deviceData}</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{txt.refreshInterval}</p>
              <div className="grid grid-cols-2 gap-2">
                {REFRESH_INTERVALS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRefreshInterval(r)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                      refreshInterval === r
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent/50 text-foreground'
                    )}
                  >
                    {Math.floor(r / 1000)} {txt.seconds}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{txt.alertNotifications}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{txt.alertNotificationsDesc}</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors duration-200',
                  notifications ? 'bg-primary' : 'bg-muted border border-border'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  notifications ? 'translate-x-6' : 'translate-x-0'
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">{txt.systemInfo}</h2>
          </div>
          <div className="space-y-2 text-sm">
            {[
              [txt.deviceId, process.env.NEXT_PUBLIC_DEVICE_ID || 'FG-01'],
              [txt.appVersion, '1.0.0'],
              [txt.mode, process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? txt.demoMode : txt.productionMode],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={cn(
            'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200',
            saved
              ? 'bg-green-500 text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {saved ? txt.saved : txt.save}
        </button>
      </main>
      <Chatbot language={language} />
    </div>
  )
}
