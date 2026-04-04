'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import type { SensorData } from '@/lib/mockData'
import { Droplets, ScanEye, ArrowRightToLine, ArrowLeftToLine, ArrowDownUp, Info } from 'lucide-react'

/* ── animated counter ─────────────────────────── */
function useAnimatedValue(target: number, decimals = 1) {
  const [val, setVal] = useState(target)
  const ref = useRef(target)
  useEffect(() => {
    if (Math.abs(target - ref.current) < 0.001) return
    const start = ref.current
    const diff  = target - start
    const steps = 24
    let i = 0
    const id = setInterval(() => {
      i++
      const ease = 1 - Math.pow(1 - i / steps, 3) // ease-out-cubic
      setVal(parseFloat((start + diff * ease).toFixed(decimals)))
      if (i >= steps) { ref.current = target; clearInterval(id) }
    }, 20)
    return () => clearInterval(id)
  }, [target, decimals])
  return val
}

/* ── mini sparkline canvas ────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c || data.length < 2) return
    const ctx = c.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = 88, H = 32
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr)
    const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
    const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - ((v - min) / range) * (H - 6) - 3 }))
    // gradient fill
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, color + '44'); g.addColorStop(1, color + '00')
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
    pts.slice(1).forEach((p, i) => {
      const cp = pts[i]; ctx.bezierCurveTo((cp.x + p.x) / 2, cp.y, (cp.x + p.x) / 2, p.y, p.x, p.y)
    })
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
    ctx.fillStyle = g; ctx.fill()
    // line
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
    pts.slice(1).forEach((p, i) => {
      const cp = pts[i]; ctx.bezierCurveTo((cp.x + p.x) / 2, cp.y, (cp.x + p.x) / 2, p.y, p.x, p.y)
    })
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke()
    // last dot
    const last = pts[pts.length - 1]
    ctx.beginPath(); ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = color; ctx.fill()
  }, [data, color])
  return <canvas ref={ref} style={{ width: 88, height: 32 }} />
}

/* ── arc progress ring ────────────────────────── */
function ArcRing({ pct, color }: { pct: number; color: string }) {
  const r = 18, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="3.5" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={color} strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  )
}

/* ── color config ─────────────────────────────── */
type Level = 'green' | 'yellow' | 'red'
const LEVEL_CFG: Record<Level, {
  card: string; label: string; icon: string; arc: string; spark: string; badge: string
}> = {
  green: {
    card:  'bg-white dark:bg-card border-border/60',
    label: 'text-emerald-600 dark:text-emerald-400',
    icon:  'bg-emerald-100 dark:bg-emerald-900/35 text-emerald-600 dark:text-emerald-400',
    arc:   '#34d399',
    spark: '#34d399',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
  },
  yellow: {
    card:  'bg-white dark:bg-card border-amber-200/60 dark:border-amber-800/30',
    label: 'text-amber-600 dark:text-amber-400',
    icon:  'bg-amber-100 dark:bg-amber-900/35 text-amber-600 dark:text-amber-400',
    arc:   '#fbbf24',
    spark: '#fbbf24',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
  },
  red: {
    card:  'bg-white dark:bg-card border-red-200/70 dark:border-red-800/40',
    label: 'text-red-600 dark:text-red-400',
    icon:  'bg-red-100 dark:bg-red-900/35 text-red-600 dark:text-red-400',
    arc:   '#f87171',
    spark: '#f87171',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/40',
  },
}

/* ── individual sensor card ───────────────────── */
interface SensorCardProps {
  label: string; value: number; unit: string; description: string
  icon: React.ElementType; level: Level; history: number[]; pct: number
  prevValue?: number; decimals?: number
}

function SensorCard({ label, value, unit, description, icon: Icon, level, history, pct, prevValue, decimals = 1 }: SensorCardProps) {
  const [tip, setTip] = useState(false)
  const animated = useAnimatedValue(value, decimals)
  const cfg = LEVEL_CFG[level]
  const changed = prevValue !== undefined && Math.abs(value - prevValue) > 0.05
  const up = prevValue !== undefined && value > prevValue

  return (
    <div className={cn(
      'relative rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-500 shadow-sm hover:shadow-md hover:-translate-y-0.5',
      cfg.card
    )}>
      {/* header row */}
      <div className="flex items-start justify-between">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', cfg.icon)}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="flex items-center gap-1.5">
          {changed && (
            <span className={cn('text-xs font-bold leading-none', up ? 'text-emerald-500' : 'text-red-500')}>
              {up ? '↑' : '↓'}
            </span>
          )}
          <button
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
            className={cn('w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold', cfg.badge)}
          >
            <Info className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* value */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1 leading-none">
            <span className={cn('font-bold text-[26px] tabular-nums tracking-tight count-anim', cfg.label)}>
              {animated}
            </span>
            {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
          </div>
          <p className="text-[12px] font-medium text-muted-foreground mt-1">{label}</p>
        </div>

        {/* arc ring */}
        <div className="relative shrink-0">
          <ArcRing pct={pct} color={cfg.arc} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: cfg.arc }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>

      {/* sparkline */}
      <div className="flex items-end justify-between">
        <Sparkline data={history} color={cfg.spark} />
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-lg border self-end', cfg.badge)}>
          {level === 'green' ? 'OK' : level === 'yellow' ? 'WARN' : 'ALERT'}
        </span>
      </div>

      {/* tooltip */}
      {tip && (
        <div className="absolute bottom-full left-0 mb-2 z-20 w-52 p-3 rounded-xl border border-border bg-popover shadow-xl text-xs text-muted-foreground leading-relaxed anim-fade-up">
          {description}
        </div>
      )}
    </div>
  )
}

/* ── history buffer per sensor ────────────────── */
function useHistory(value: number, max = 18) {
  const [hist, setHist] = useState<number[]>([value])
  useEffect(() => { setHist(h => [...h.slice(-(max - 1)), value]) }, [value, max])
  return hist
}

/* ── exported grid ────────────────────────────── */
interface SensorCardsProps { sensors: SensorData; prevSensors?: SensorData; language: Language }

export function SensorCards({ sensors, prevSensors, language }: SensorCardsProps) {
  const phHist   = useHistory(sensors.ph)
  const turbHist = useHistory(sensors.turbidity)
  const sfHist   = useHistory(sensors.startFlow)
  const efHist   = useHistory(sensors.endFlow)
  const fdHist   = useHistory(sensors.flowDiff)

  const phLevel   = (v: number): Level => v >= 6 && v <= 7.5 ? 'green' : (v >= 5.5 || v <= 8) ? 'yellow' : 'red'
  const turbLevel = (v: number): Level => v <= 1.5 ? 'green' : v <= 3 ? 'yellow' : 'red'
  const sfLevel   = (v: number): Level => v >= 40 ? 'green' : v >= 25 ? 'yellow' : 'red'
  const efLevel   = (v: number): Level => v >= 35 ? 'green' : v >= 20 ? 'yellow' : 'red'
  const fdLevel   = (v: number): Level => v <= 15 ? 'green' : v <= 30 ? 'yellow' : 'red'

  const cards = [
    { label: t(language, 'phLevel'),    value: sensors.ph,        unit: '',                  description: t(language, 'phDesc'),        icon: Droplets,         level: phLevel(sensors.ph),         history: phHist,   pct: ((sensors.ph - 5) / 4) * 100,              prev: prevSensors?.ph,        dec: 2 },
    { label: t(language, 'turbidity'), value: sensors.turbidity,  unit: t(language, 'ntu'),  description: t(language, 'turbidityDesc'), icon: ScanEye,          level: turbLevel(sensors.turbidity), history: turbHist, pct: Math.min(100, (sensors.turbidity / 5) * 100), prev: prevSensors?.turbidity, dec: 2 },
    { label: t(language, 'startFlow'), value: sensors.startFlow,  unit: t(language, 'lph'),  description: t(language, 'startFlowDesc'), icon: ArrowRightToLine, level: sfLevel(sensors.startFlow),  history: sfHist,   pct: Math.min(100, (sensors.startFlow / 80) * 100), prev: prevSensors?.startFlow, dec: 1 },
    { label: t(language, 'endFlow'),   value: sensors.endFlow,    unit: t(language, 'lph'),  description: t(language, 'endFlowDesc'),   icon: ArrowLeftToLine,  level: efLevel(sensors.endFlow),    history: efHist,   pct: Math.min(100, (sensors.endFlow / 80) * 100),  prev: prevSensors?.endFlow,   dec: 1 },
    { label: t(language, 'flowDiff'),  value: sensors.flowDiff,   unit: '%',                 description: t(language, 'flowDiffDesc'),  icon: ArrowDownUp,      level: fdLevel(sensors.flowDiff),   history: fdHist,   pct: Math.min(100, sensors.flowDiff * 2),           prev: prevSensors?.flowDiff,  dec: 1 },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((c, i) => (
        <div key={c.label} className="anim-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
          <SensorCard
            label={c.label} value={c.value} unit={c.unit} description={c.description}
            icon={c.icon} level={c.level as Level} history={c.history} pct={c.pct}
            prevValue={c.prev} decimals={c.dec}
          />
        </div>
      ))}
    </div>
  )
}