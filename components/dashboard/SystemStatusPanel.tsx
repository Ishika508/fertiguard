'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import type { SystemStatus } from '@/lib/mockData'
import { ShieldCheck, GitBranch, Waves, Cpu, AlertOctagon } from 'lucide-react'

interface SystemStatusPanelProps { status: SystemStatus; language: Language }

function StatusRow({
  icon: Icon, label, value, isAlert, delay,
}: {
  icon: React.ElementType; label: string; value: string; isAlert: boolean; delay: number
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-400 anim-fade-up',
        isAlert
          ? 'bg-red-50/80 dark:bg-red-950/25 border-red-200/80 dark:border-red-800/40'
          : 'bg-emerald-50/60 dark:bg-emerald-950/15 border-emerald-200/60 dark:border-emerald-800/30'
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center',
          isAlert
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-emerald-100 dark:bg-emerald-900/20'
        )}>
          <Icon className={cn('w-3.5 h-3.5', isAlert ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400')} strokeWidth={2} />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className={cn(
        'text-[11px] font-bold px-2.5 py-1 rounded-lg border',
        isAlert
          ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/40'
          : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/40'
      )}>
        {value}
      </span>
    </div>
  )
}

export function SystemStatusPanel({ status, language }: SystemStatusPanelProps) {
  const rows = [
    { icon: AlertOctagon, label: t(language, 'clogDetected'), value: status.clogDetected ? t(language, 'yes') : t(language, 'no'), isAlert: status.clogDetected },
    { icon: GitBranch,    label: t(language, 'clogBranch'),   value: status.clogBranch ?? t(language, 'none'),                     isAlert: !!status.clogBranch },
    { icon: Waves,        label: t(language, 'leakDetected'), value: status.leakDetected ? t(language, 'yes') : t(language, 'no'), isAlert: status.leakDetected },
    { icon: Cpu,          label: t(language, 'sensorFault'),  value: status.sensorFault ? t(language, 'yes') : t(language, 'no'),  isAlert: status.sensorFault },
  ]

  const alertCount = rows.filter(r => r.isAlert).length
  const allClear   = alertCount === 0

  return (
    <div className="card-base p-5 flex flex-col gap-3 anim-fade-up" style={{ animationDelay: '.2s' }}>
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center',
            allClear ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
          )}>
            <ShieldCheck className={cn('w-4 h-4', allClear ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')} strokeWidth={2} />
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">{t(language, 'systemStatus')}</h2>
        </div>

        <span className={cn(
          'text-[11px] font-bold px-2.5 py-1 rounded-xl border',
          allClear
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-400 dark:border-emerald-800/40'
            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-400 dark:border-red-800/40'
        )}>
          {allClear ? '✓ All Clear' : `${alertCount} Alert${alertCount > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* rows */}
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <StatusRow key={row.label} {...row} delay={0.05 * i} />
        ))}
      </div>

      {/* bottom summary bar */}
      <div className="mt-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            alertCount === 0 ? 'bg-emerald-500' : alertCount === 1 ? 'bg-amber-400' : 'bg-red-500'
          )}
          style={{ width: `${Math.max(8, ((4 - alertCount) / 4) * 100)}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        {allClear ? 'System operating normally' : `${alertCount} issue${alertCount > 1 ? 's' : ''} require${alertCount === 1 ? 's' : ''} attention`}
      </p>
    </div>
  )
}