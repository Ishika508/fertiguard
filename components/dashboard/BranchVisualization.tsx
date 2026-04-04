'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import type { BranchData } from '@/lib/mockData'
import {
  AlertTriangle, Zap, Droplets,
  CheckCircle2, PlugZap, CircleDashed,
} from 'lucide-react'

type BranchStatus = 'normal' | 'low' | 'risk' | 'clog' | 'not_connected'

// B2 and B3 are always not connected — only B1 carries live sensor data
const DISCONNECTED_BRANCHES = ['B2', 'B3']

function getBranchStatus(
  val: number | null,
  clogBranch: string | null,
  name: string
): BranchStatus {
  if (DISCONNECTED_BRANCHES.includes(name)) return 'not_connected'
  if (val === null) return 'not_connected'
  if (clogBranch === name) return 'clog'
  if (val < 10) return 'risk'
  if (val < 12) return 'low'
  return 'normal'
}

/* ── status config ────────────────────────────── */
const STATUS_CFG: Record<BranchStatus, {
  card: string
  ring: string
  badge: string
  badgeText: string
  nameBadge: string
  fillCls: string
  barColor: string
  pipeClass: string
  animate: string
  Icon: React.ElementType
  iconCls: string
}> = {
  normal: {
    card:      'bg-white dark:bg-card border-border/60',
    ring:      '',
    badge:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    badgeText: 'Normal Flow',
    nameBadge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    fillCls:   'bg-emerald-500',
    barColor:  '#34d399',
    pipeClass: 'pipe-flow',
    animate:   '',
    Icon:      CheckCircle2,
    iconCls:   'text-emerald-500',
  },
  low: {
    card:      'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40',
    ring:      '',
    badge:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    badgeText: 'Low Flow',
    nameBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    fillCls:   'bg-amber-400',
    barColor:  '#fbbf24',
    pipeClass: 'pipe-flow-slow',
    animate:   '',
    Icon:      AlertTriangle,
    iconCls:   'text-amber-500',
  },
  risk: {
    card:      'bg-orange-50/60 dark:bg-orange-950/20 border-orange-300/80 dark:border-orange-700/50',
    ring:      'ring-2 ring-orange-400/40',
    badge:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/40',
    badgeText: 'Clog Risk',
    nameBadge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/40',
    fillCls:   'bg-orange-400',
    barColor:  '#fb923c',
    pipeClass: 'pipe-flow-slow',
    animate:   'anim-pulse-red',
    Icon:      AlertTriangle,
    iconCls:   'text-orange-500 anim-pulse-red',
  },
  clog: {
    card:      'bg-red-50/70 dark:bg-red-950/25 border-red-300/80 dark:border-red-700/50',
    ring:      'ring-2 ring-red-500/40',
    badge:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/40',
    badgeText: 'CLOGGED',
    nameBadge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/40',
    fillCls:   'bg-red-500',
    barColor:  '#f87171',
    pipeClass: 'pipe-flow-clog',
    animate:   'anim-pulse-red',
    Icon:      Zap,
    iconCls:   'text-red-500 anim-pulse-red',
  },
  not_connected: {
    card:      'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200/60 dark:border-neutral-700/30',
    ring:      '',
    badge:     'bg-neutral-100 text-neutral-400 dark:bg-neutral-800/50 dark:text-neutral-500 border-neutral-200/80 dark:border-neutral-700/40',
    badgeText: 'Not Connected',
    nameBadge: 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800/50 dark:text-neutral-500 border-neutral-200/80 dark:border-neutral-700/40',
    fillCls:   'bg-neutral-300 dark:bg-neutral-700',
    barColor:  '#9ca3af',
    pipeClass: '',
    animate:   '',
    Icon:      PlugZap,
    iconCls:   'text-neutral-300 dark:text-neutral-600',
  },
}

/* ── flow bar ─────────────────────────────────── */
function FlowBar({ pct, status }: { pct: number; status: BranchStatus }) {
  const cfg = STATUS_CFG[status]
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (status === 'not_connected') return
    const id = setTimeout(() => setWidth(pct), 80)
    return () => clearTimeout(id)
  }, [pct, status])

  if (status === 'not_connected') {
    return (
      <div className="h-5 rounded-full bg-neutral-100 dark:bg-neutral-800/50 border border-dashed border-neutral-200/80 dark:border-neutral-700/40 overflow-hidden flex items-center px-2.5 gap-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-neutral-200/70 dark:bg-neutral-700/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="relative h-5 rounded-full bg-muted/50 border border-border/50 overflow-hidden shadow-inner">
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', cfg.fillCls)}
        style={{ width: `${width}%` }}
      >
        <div className={cn('absolute inset-0 rounded-full opacity-70', cfg.pipeClass)} />
      </div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
    </div>
  )
}

/* ── individual branch card ───────────────────── */
function BranchCard({
  name, value, status, isHighest, language, delay,
}: {
  name: string
  value: number | null
  status: BranchStatus
  isHighest: boolean
  language: Language
  delay: number
}) {
  const cfg = STATUS_CFG[status]
  const { Icon } = cfg
  const pct = value !== null && status !== 'not_connected'
    ? Math.min(100, (value / 15) * 100)
    : 0
  const isOff = status === 'not_connected'

  return (
    <div
      className={cn(
        'relative rounded-2xl border transition-all duration-500 shadow-sm anim-fade-up',
        isOff ? 'opacity-55' : 'hover:shadow-md hover:-translate-y-0.5',
        cfg.card, cfg.ring,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* highest risk tag */}
      {isHighest && !isOff && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md shadow-red-500/30">
            <Zap className="w-2.5 h-2.5" /> Highest Risk
          </span>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* ── top row: name badge + status badge ── */}
        <div className="flex items-center justify-between mt-1">
          <div className={cn(
            'w-9 h-9 rounded-xl border-2 flex items-center justify-center font-bold text-sm',
            cfg.nameBadge
          )}>
            {name}
          </div>
          <div className="flex items-center gap-1.5">
            <Icon className={cn('w-4 h-4', cfg.iconCls)} strokeWidth={2} />
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg border', cfg.badge)}>
              {cfg.badgeText}
            </span>
          </div>
        </div>

        {/* ── connected: show live data ────────── */}
        {!isOff ? (
          <>
            <div className="flex items-baseline gap-1">
              <span
                className={cn('font-bold text-2xl tabular-nums', cfg.animate)}
                style={{ color: cfg.barColor }}
              >
                {value!.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground font-medium">L/h</span>
            </div>
            <FlowBar pct={pct} status={status} />
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>IN</span><span>→</span><span>OUT</span>
            </div>
          </>
        ) : (
          /* ── not connected: placeholder UI ──── */
          <>
            {/* plug icon with dashed ring */}
            <div className="flex flex-col items-center py-3 gap-2.5">
              <div className="relative w-14 h-14 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-600/60 flex items-center justify-center bg-neutral-100/50 dark:bg-neutral-800/30">
                <PlugZap className="w-6 h-6 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                <span className="absolute inset-0 rounded-2xl border-2 border-neutral-300/40 dark:border-neutral-600/30 animate-ping" />
              </div>

              <div className="text-center space-y-0.5">
                <p className="text-[13px] font-semibold text-neutral-400 dark:text-neutral-500">
                  No Sensor Installed
                </p>
                <p className="text-[11px] text-neutral-400/60 dark:text-neutral-600">
                  Branch {name} not connected
                </p>
              </div>

              {/* dashed flow bar */}
              <div className="w-full">
                <FlowBar pct={0} status="not_connected" />
              </div>

              {/* signal dots */}
              <div className="flex items-center gap-1.5">
                {[1, 0.6, 0.35].map((opacity, i) => (
                  <CircleDashed
                    key={i}
                    className="w-3 h-3 text-neutral-300 dark:text-neutral-600"
                    strokeWidth={2}
                    style={{ opacity }}
                  />
                ))}
                <span className="text-[10px] text-neutral-400 dark:text-neutral-600 ml-0.5 font-medium">
                  No signal
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── main component ───────────────────────────── */
interface BranchVisualizationProps {
  branches: BranchData
  clogBranch: string | null
  language: Language
}

export function BranchVisualization({ branches, clogBranch, language }: BranchVisualizationProps) {
  // B2 and B3 are forced null — only B1 has live data
  const entries: [string, number | null][] = [
    ['B1', branches.B1],
    ['B2', null],
    ['B3', null],
  ]

  // Highest risk only applies to B1 since others are not connected
  const b1Val = branches.B1
  const highestRisk: string | null =
    clogBranch === 'B1' ? 'B1'
    : b1Val !== null && b1Val < 12.5 ? 'B1'
    : null

  return (
    <div className="card-base p-5 anim-fade-up" style={{ animationDelay: '.15s' }}>

      {/* ── header ──────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-foreground leading-none">
              {t(language, 'branchVisualization')}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              1 of 3 branches active · B2, B3 not installed
            </p>
          </div>
        </div>

        {/* legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
          {[
            ['#34d399', 'Normal'],
            ['#fbbf24', 'Low'],
            ['#f87171', 'Clog'],
            ['#d1d5db', 'N/A'],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── main supply line (partial) ─────────── */}
      <div className="mb-5 px-1">
        <div className="relative h-3 rounded-full bg-muted/40 border border-border/40 overflow-hidden shadow-inner">
          {/* active left third (B1) */}
          <div className="absolute left-0 top-0 bottom-0 w-[34%] overflow-hidden">
            <div className="h-full w-full bg-primary/25 rounded-l-full">
              <div className="h-full w-full pipe-flow opacity-80" />
            </div>
          </div>
          {/* inactive right two-thirds (B2, B3) */}
          <div className="absolute left-[34%] top-0 bottom-0 right-0 bg-neutral-100 dark:bg-neutral-800/40 rounded-r-full flex items-center px-4 gap-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex-1 h-px bg-neutral-300/50 dark:bg-neutral-700/40" />
            ))}
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        </div>
        <div className="flex mt-1.5">
          <p className="w-[34%] text-center text-[10px] text-primary/70 font-semibold">Active</p>
          <p className="flex-1 text-center text-[10px] text-neutral-400 dark:text-neutral-600 font-medium">No sensors installed</p>
        </div>
      </div>

      {/* ── branch cards ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {entries.map(([name, val], i) => (
          <BranchCard
            key={name}
            name={name}
            value={val}
            status={getBranchStatus(val, clogBranch, name)}
            isHighest={highestRisk === name}
            language={language}
            delay={0.05 * i}
          />
        ))}
      </div>

      {/* ── footer note ─────────────────────────── */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        <PlugZap className="w-3 h-3 text-muted-foreground/40" strokeWidth={1.5} />
        <p className="text-[11px] text-muted-foreground/50 text-center">
          Connect B2 and B3 hardware sensors to enable full branch monitoring
        </p>
      </div>

    </div>
  )
}