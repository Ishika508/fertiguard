'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import type { DeviceData } from '@/lib/mockData'
import { Cpu, RefreshCw, Radio, Clock4, Gauge, Wifi } from 'lucide-react'

interface DeviceHeaderProps {
  data: DeviceData
  language: Language
  onRefresh: () => void
}

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono tabular-nums text-sm font-semibold text-foreground">{time}</span>
}

export function DeviceHeader({ data, language, onRefresh }: DeviceHeaderProps) {
  const [spinning, setSpinning] = useState(false)

  const handleRefresh = () => {
    setSpinning(true)
    onRefresh()
    setTimeout(() => setSpinning(false), 700)
  }

  const statusMap = {
    active: {
      label: t(language, 'active'),
      dot: 'bg-emerald-500',
      ring: 'ring-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200/80 dark:border-emerald-800/40',
      bar: 'from-emerald-400 to-emerald-500',
    },
    warning: {
      label: t(language, 'warning'),
      dot: 'bg-amber-500',
      ring: 'ring-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200/80 dark:border-amber-800/40',
      bar: 'from-amber-400 to-amber-500',
    },
    critical: {
      label: t(language, 'critical'),
      dot: 'bg-red-500',
      ring: 'ring-red-500/30',
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200/80 dark:border-red-800/40',
      bar: 'from-red-400 to-red-500',
    },
  }

  const s = statusMap[data.status]

  const stats = [
    {
      icon: Cpu,
      label: t(language, 'deviceId'),
      value: data.deviceId,
      mono: true,
    },
    {
      icon: Radio,
      label: t(language, 'mode'),
      value: data.mode,
      mono: true,
      valueColor: data.mode === 'CLEARING' ? 'text-amber-500' : 'text-primary',
    },
    {
      icon: Gauge,
      label: 'Flow Diff',
      value: `${data.sensors.flowDiff.toFixed(1)}%`,
      mono: true,
      valueColor: data.sensors.flowDiff > 30 ? 'text-red-500' : data.sensors.flowDiff > 15 ? 'text-amber-500' : 'text-emerald-500',
    },
    {
      icon: Clock4,
      label: t(language, 'lastUpdated'),
      value: null, // rendered as live clock
    },
  ]

  return (
    <div className="card-base overflow-hidden anim-fade-up">
      {/* top status gradient bar */}
      <div className={cn('h-0.5 w-full bg-gradient-to-r', s.bar)} />

      <div className="px-5 py-4 flex flex-wrap items-center gap-4 justify-between">
        {/* left: stat pills */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status badge — prominent */}
          <div className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl border',
            s.bg, s.border
          )}>
            <span className={cn('relative flex h-2.5 w-2.5')}>
              <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping', s.dot)} />
              <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', s.dot)} />
            </span>
            <span className={cn('text-[13px] font-semibold', s.text)}>{s.label}</span>
          </div>

          {/* divider */}
          <div className="hidden sm:block w-px h-8 bg-border/60" />

          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
              <stat.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.8} />
              <div>
                <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">{stat.label}</p>
                {stat.value !== null ? (
                  <p className={cn('text-[13px] font-semibold leading-none', stat.mono && 'font-mono', stat.valueColor ?? 'text-foreground')}>
                    {stat.value}
                  </p>
                ) : (
                  <LiveClock />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* right: refresh */}
        <button
          onClick={handleRefresh}
          className="btn-primary shrink-0"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', spinning && 'animate-spin')} strokeWidth={2.5} />
          <span className="hidden sm:inline">{t(language, 'refresh')}</span>
        </button>
      </div>
    </div>
  )
}