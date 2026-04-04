'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, X, Info, AlertOctagon } from 'lucide-react'

type AlertLevel = 'info' | 'warning' | 'critical'

interface AlertBannerProps {
  level: AlertLevel
  message: string
  dismissible?: boolean
}

export function AlertBanner({ level, message, dismissible = true }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const config = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800/50',
      text: 'text-blue-700 dark:text-blue-400',
      icon: Info,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-400',
      icon: AlertTriangle,
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800/50',
      text: 'text-red-700 dark:text-red-400',
      icon: AlertOctagon,
    },
  }

  const c = config[level]
  const Icon = c.icon

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-xl border animate-fade-in',
      c.bg, c.border,
      level === 'critical' && 'animate-pulse-red'
    )}>
      <Icon className={cn('w-5 h-5 flex-shrink-0', c.text)} />
      <p className={cn('text-sm font-semibold flex-1', c.text)}>{message}</p>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className={cn('p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors', c.text)}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
