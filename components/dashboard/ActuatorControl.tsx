'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import type { ActuatorState } from '@/lib/mockData'
import {
  FlaskConical, Square, SlidersHorizontal,
  Gauge, Waves, Beaker, CheckCircle2, X,
  Loader2, AlertTriangle,
} from 'lucide-react'

/* ── Inline toast / popup ─────────────────────────── */
interface ActionToastProps {
  message: string
  sub: string
  type: 'success' | 'warning' | 'info'
  onClose: () => void
}

function ActionToast({ message, sub, type, onClose }: ActionToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const config = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-700/40',
      icon: CheckCircle2,
      iconCls: 'text-emerald-500',
      bar: 'bg-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-700/40',
      icon: AlertTriangle,
      iconCls: 'text-amber-500',
      bar: 'bg-amber-500',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-700/40',
      icon: CheckCircle2,
      iconCls: 'text-blue-500',
      bar: 'bg-blue-500',
    },
  }
  const c = config[type]
  const Icon = c.icon

  return (
    <div className={cn(
      'relative rounded-2xl border px-4 py-3.5 overflow-hidden anim-pop-in',
      c.bg
    )}>
      {/* progress bar */}
      <div
        className={cn('absolute bottom-0 left-0 h-0.5 rounded-full', c.bar)}
        style={{ animation: 'shrinkBar 3.5s linear forwards' }}
      />
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 shrink-0', c.iconCls)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{message}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ── Actuator indicator row ───────────────────────── */
function ActuatorRow({ label, isOn, icon: Icon }: { label: string; isOn: boolean; icon: React.ElementType }) {
  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300',
      isOn
        ? 'bg-primary/8 dark:bg-primary/12 border-primary/25 dark:border-primary/30'
        : 'bg-muted/30 border-border/50'
    )}>
      <div className="flex items-center gap-2.5">
        <Icon className={cn('w-4 h-4', isOn ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.8} />
        <span className={cn('text-sm font-medium', isOn ? 'text-foreground' : 'text-muted-foreground')}>
          {label}
        </span>
      </div>
      <span className={cn(
        'text-[11px] font-bold px-2 py-0.5 rounded-lg tracking-wider',
        isOn
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground border border-border/60'
      )}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  )
}

interface ActuatorControlPanelProps {
  actuators: ActuatorState
  language: Language
}

type ToastState = { message: string; sub: string; type: 'success' | 'warning' | 'info' } | null

export function ActuatorControlPanel({ actuators, language }: ActuatorControlPanelProps) {
  const [local, setLocal] = useState<ActuatorState>(actuators)
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  useEffect(() => { setLocal(actuators) }, [actuators])

  const trigger = async (action: string) => {
    setLoading(action)
    await new Promise(r => setTimeout(r, 900))

    if (action === 'acid-flush') {
      setLocal(p => ({ ...p, flushPump: true, acidInjection: true }))
      setToast({
        type: 'success',
        message: 'Acid Flush Started',
        sub: 'Flushing for 2 minutes. Monitor branch pressures.',
      })
    } else if (action === 'stop-flush') {
      setLocal(p => ({ ...p, flushPump: false, acidInjection: false }))
      setToast({
        type: 'info',
        message: 'Flush Stopped',
        sub: 'System returning to normal sampling mode.',
      })
    } else if (action === 'manual-override') {
      setLocal(p => ({ ...p, mainSolenoid: !p.mainSolenoid }))
      setToast({
        type: 'warning',
        message: 'Manual Override Active',
        sub: 'Main solenoid toggled. Monitor system closely.',
      })
    }
    setLoading(null)
  }

  const buttons: {
    id: string
    label: string
    icon: React.ElementType
    cls: string
  }[] = [
    {
      id: 'acid-flush',
      label: t(language, 'startAcidFlush'),
      icon: FlaskConical,
      cls: 'btn-danger ripple-btn w-full',
    },
    {
      id: 'stop-flush',
      label: t(language, 'stopFlush'),
      icon: Square,
      cls: 'btn-ghost ripple-btn w-full',
    },
    {
      id: 'manual-override',
      label: t(language, 'manualOverride'),
      icon: SlidersHorizontal,
      cls: 'btn-warning ripple-btn w-full',
    },
  ]

  return (
    <div className="card-base p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
          {t(language, 'actuatorControl')}
        </h2>
        <span className={cn(
          'text-[11px] font-semibold px-2.5 py-1 rounded-lg border',
          local.flushPump
            ? 'bg-amber-100 text-amber-700 border-amber-200/80 dark:bg-amber-900/25 dark:text-amber-400 dark:border-amber-700/40'
            : 'bg-emerald-100 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/25 dark:text-emerald-400 dark:border-emerald-700/40'
        )}>
          {local.flushPump ? '⚡ Flushing' : '✓ Standby'}
        </span>
      </div>

      {/* Toast notification */}
      {toast && (
        <ActionToast
          {...toast}
          onClose={() => setToast(null)}
        />
      )}

      {/* Control buttons */}
      <div className="flex flex-col gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => trigger(btn.id)}
            disabled={!!loading}
            className={btn.cls}
          >
            {loading === btn.id
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <btn.icon className="w-4 h-4" strokeWidth={2} />
            }
            {btn.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Actuator Status
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* Status rows */}
      <div className="flex flex-col gap-2">
        <ActuatorRow label={t(language, 'mainSolenoid')} isOn={local.mainSolenoid} icon={Gauge} />
        <ActuatorRow label={t(language, 'flushPump')}    isOn={local.flushPump}    icon={Waves} />
        <ActuatorRow label={t(language, 'acidInjection')} isOn={local.acidInjection} icon={Beaker} />
      </div>
    </div>
  )
}