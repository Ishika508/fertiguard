'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Navbar } from '@/components/navbar'
import { Chatbot } from '@/components/chatbot/Chatbot'
import {
  type HistoricalPoint, type DeviceData,
} from '@/lib/mockData'
import { useDeviceData } from '@/hooks/useDeviceData'
import { formatNumber, t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine,
} from 'recharts'
import {
  BrainCircuit, TrendingUp, Lightbulb, Leaf, AlertTriangle,
  BarChart2, RefreshCw, Droplets, Zap, ShieldCheck,
  Activity, ArrowUpRight, ArrowDownRight, Mail, Phone,
  Wrench, ChevronRight, CheckCircle2, MessageSquare,
  SendHorizonal, X, Clock, Info, TriangleAlert, Waves,
} from 'lucide-react'

/* ─── Recharts tooltip ──────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label, language = 'en' }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((e: any) => (
        <div key={e.dataKey} className="flex items-center gap-2 mb-0.5 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-semibold text-foreground ml-auto pl-3">{formatNumber(language, Number(e.value ?? 0), { maximumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Gauge ─────────────────────────────────────────────────────── */
function Gauge({ value, language }: { value: number; language: 'en' | 'hi' | 'mr' }) {
  const clamp  = Math.max(0, Math.min(100, value))
  const color  = clamp < 30 ? '#22c55e' : clamp < 60 ? '#f59e0b' : '#ef4444'
  const toRad  = (d: number) => (d * Math.PI) / 180
  const r = 50, cx = 70, cy = 75
  const startA = -210, sweep = (clamp / 100) * 240, endA = startA + sweep
  const sx = cx + r * Math.cos(toRad(startA)), sy = cy + r * Math.sin(toRad(startA))
  const ex = cx + r * Math.cos(toRad(endA)),   ey = cy + r * Math.sin(toRad(endA))
  const large = sweep > 180 ? 1 : 0
  const ticks = [0, 25, 50, 75, 100].map(v => {
    const a = toRad(startA + (v / 100) * 240)
    return { x1: cx+(r-10)*Math.cos(a), y1: cy+(r-10)*Math.sin(a), x2: cx+(r+4)*Math.cos(a), y2: cy+(r+4)*Math.sin(a), v }
  })
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 95" className="w-48 h-[88px]">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path
          d={`M ${cx+r*Math.cos(toRad(-210))} ${cy+r*Math.sin(toRad(-210))} A ${r} ${r} 0 1 1 ${cx+r*Math.cos(toRad(30))} ${cy+r*Math.sin(toRad(30))}`}
          fill="none" stroke="hsl(var(--border))" strokeWidth="9" strokeLinecap="round"
        />
        {sweep > 0.5 && (
          <path
            d={`M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`}
            fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
            filter="url(#glow)"
            style={{ transition: 'all .8s cubic-bezier(.4,0,.2,1)' }}
          />
        )}
        {ticks.map(tk => (
          <line key={tk.v} x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
            stroke="hsl(var(--border))" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        <circle cx={cx} cy={cy} r="7" fill="hsl(var(--muted))" stroke={color} strokeWidth="2"
          style={{ transition: 'all .8s ease' }} />
        <circle cx={cx} cy={cy} r="3" fill={color} style={{ transition: 'fill .8s ease' }} />
      </svg>
      <div className="-mt-3 text-center">
        <span className="font-bold text-4xl tabular-nums tracking-tight" style={{ color }}>{formatNumber(language, value)}%</span>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">Next clog probability</p>
      </div>
    </div>
  )
}

/* ─── StatChip ───────────────────────────────────────────────────── */
function StatChip({ label, value, delta, positive }: {
  label: string; value: string; delta?: string; positive?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-muted/40 border border-border/50 hover:border-border transition-colors">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-bold text-lg text-foreground tabular-nums">{value}</span>
        {delta && (
          <span className={cn('flex items-center text-[11px] font-semibold', positive ? 'text-emerald-500' : 'text-red-500')}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── MetricBar ──────────────────────────────────────────────────── */
function MetricBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{Math.round(val)}%</span>
      </div>
      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${val}%`, background: color, boxShadow: `0 0 6px ${color}50` }}
        />
      </div>
    </div>
  )
}

/* ─── InsightCard ────────────────────────────────────────────────── */
function InsightCard({ icon: Icon, iconColor, iconBg, title, value, valueCls, sub }: {
  icon: React.ElementType; iconColor: string; iconBg: string
  title: string; value: string; valueCls?: string; sub?: string
}) {
  return (
    <div className="card-base p-5 flex gap-4 items-start hover:border-border transition-colors">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-muted-foreground mb-1">{title}</p>
        <p className={cn('text-[15px] font-bold leading-snug', valueCls ?? 'text-foreground')}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── RecommendedActionCard (rich, no empty space) ───────────────── */
function RecommendedActionCard({
  prob, recommend, loadingML, device, riskLabel, riskCls, confidence, language,
}: {
  prob: number; recommend: string; loadingML: boolean
  device: DeviceData; riskLabel: string; riskCls: string; confidence: number | null
  language: 'en' | 'hi' | 'mr'
}) {
  const txt = language === 'hi'
    ? {
        title: 'अनुशंसित कार्रवाई',
        updating: 'अपडेट हो रहा है…',
        analysing: 'सेंसर डेटा का विश्लेषण…',
        flowDelta: 'प्रवाह अंतर',
        turbidity: 'गंदलापन',
        ai: 'AI-सहायित',
        confidence: 'भरोसा',
        systemNormal: 'सिस्टम सामान्य रूप से चल रहा है',
        scheduleFlush: 'रूटीन फ्लश पहले से शेड्यूल करें',
        continueMonitor: 'प्रवाह अंतर की निगरानी जारी रखें',
        elevatedRisk: 'क्लॉग जोखिम बढ़ा हुआ है — सतर्क रहें',
        checkPressure: 'एमिटर दबाव स्तर जांचें',
        flushSoon: 'अगले 30 मिनट में फ्लश करें',
        criticalRisk: 'गंभीर क्लॉग जोखिम — तुरंत कार्रवाई करें',
        emergencyFlush: 'अभी आपातकालीन फ्लश चलाएं',
        inspectAfterFlush: 'फ्लश के बाद एमिटर साफ करें और जांचें',
      }
    : language === 'mr'
    ? {
        title: 'शिफारस केलेली कृती',
        updating: 'अपडेट सुरू…',
        analysing: 'सेन्सर डेटाचा अभ्यास…',
        flowDelta: 'प्रवाह फरक',
        turbidity: 'गढूळपणा',
        ai: 'AI-सहाय्यित',
        confidence: 'विश्वास',
        systemNormal: 'सिस्टम सामान्यपणे कार्यरत आहे',
        scheduleFlush: 'नियमित फ्लश आधीच ठरवा',
        continueMonitor: 'प्रवाह फरकाचे निरीक्षण सुरू ठेवा',
        elevatedRisk: 'क्लॉगचा धोका वाढला आहे — सतर्क रहा',
        checkPressure: 'एमिटर दाब पातळी तपासा',
        flushSoon: 'पुढील 30 मिनिटांत फ्लश करा',
        criticalRisk: 'गंभीर क्लॉग धोका — तातडीने कृती करा',
        emergencyFlush: 'आत्ता आपत्कालीन फ्लश चालवा',
        inspectAfterFlush: 'फ्लशनंतर एमिटर्स तपासा आणि साफ करा',
      }
    : {
        title: 'Recommended Action',
        updating: 'updating…',
        analysing: 'Analysing sensor data…',
        flowDelta: 'Flow Δ',
        turbidity: 'Turbidity',
        ai: 'AI-assisted',
        confidence: 'confidence',
        systemNormal: 'System operating normally',
        scheduleFlush: 'Schedule routine flush in advance',
        continueMonitor: 'Continue monitoring flow differential',
        elevatedRisk: 'Elevated clog risk — stay alert',
        checkPressure: 'Check emitter pressure levels',
        flushSoon: 'Flush within the next 30 minutes',
        criticalRisk: 'Critical clog risk — immediate action required',
        emergencyFlush: 'Run emergency flush cycle now',
        inspectAfterFlush: 'Inspect and clear emitters after flush',
      }

  // Contextual action steps based on risk level
  const steps = prob < 30
    ? [
        { icon: CheckCircle2, cls: 'text-emerald-500', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', label: txt.systemNormal },
        { icon: Clock,        cls: 'text-emerald-500', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', label: txt.scheduleFlush },
        { icon: Waves,        cls: 'text-blue-500',    bg: 'bg-blue-500/10 dark:bg-blue-500/15',       label: txt.continueMonitor },
      ]
    : prob < 60
    ? [
        { icon: AlertTriangle, cls: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/15', label: txt.elevatedRisk },
        { icon: Waves,         cls: 'text-blue-500',  bg: 'bg-blue-500/10 dark:bg-blue-500/15',   label: txt.checkPressure },
        { icon: Zap,           cls: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/15', label: txt.flushSoon },
      ]
    : [
        { icon: TriangleAlert, cls: 'text-red-500',   bg: 'bg-red-500/10 dark:bg-red-500/15',    label: txt.criticalRisk },
        { icon: Zap,           cls: 'text-red-500',   bg: 'bg-red-500/10 dark:bg-red-500/15',    label: txt.emergencyFlush },
        { icon: Wrench,        cls: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/15', label: txt.inspectAfterFlush },
      ]

  const turbidity = typeof device.sensors.turbidity === 'number' ? device.sensors.turbidity : null

  const sensors = [
    {
      label: txt.flowDelta,
      value: `${device.sensors.flowDiff.toFixed(1)}%`,
      ok: device.sensors.flowDiff < 25,
    },
    {
      label: 'pH',
      value: device.sensors.ph.toFixed(1),
      ok: device.sensors.ph >= 6 && device.sensors.ph <= 7.5,
    },
    {
      label: txt.turbidity,
      value: turbidity !== null ? `${turbidity.toFixed(1)} NTU` : '— NTU',
      ok: turbidity !== null ? turbidity < 2.5 : true,
    },
  ]

  return (
    <div className="card-base p-5 flex flex-col gap-3.5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" strokeWidth={1.8} />
          <span className="text-[13px] font-semibold text-foreground">{txt.title}</span>
        </div>
        {loadingML && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> {txt.updating}
          </span>
        )}
      </div>

      {/* Main text */}
      <div className="rounded-xl bg-muted/30 border border-border/60 px-3.5 py-3">
        <p className="text-[13px] text-foreground leading-relaxed font-medium">
          {loadingML ? txt.analysing : recommend}
        </p>
      </div>

      {/* Action steps */}
      <div className="space-y-1.5">
        {steps.map(({ icon: I, cls, bg, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', bg)}>
              <I className={cn('w-3 h-3', cls)} strokeWidth={2} />
            </div>
            <span className="text-[12px] font-medium text-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Live sensor snapshot */}
      <div className="grid grid-cols-3 gap-1.5">
        {sensors.map(({ label, value, ok }) => (
          <div key={label} className={cn(
            'flex flex-col items-center py-2 rounded-xl border text-center',
            ok
              ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10'
              : 'bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10'
          )}>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className={cn('text-[12px] font-bold tabular-nums mt-0.5', ok ? 'text-emerald-500' : 'text-amber-500')}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 mt-auto">
        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-lg border', riskCls)}>
          {riskLabel}
        </span>
        {confidence !== null && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-blue-500/10 text-blue-500 border-blue-500/20">
            {formatNumber(language, Math.round(confidence * 100))}% {txt.confidence}
          </span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" /> {txt.ai}
        </span>
      </div>
    </div>
  )
}

/* ─── SupportPanel ───────────────────────────────────────────────── */
function SupportPanel({ language }: { language: 'en' | 'hi' | 'mr' }) {
  const [open, setOpen]             = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [ticketRef]                 = useState(() => `TKT-${Math.floor(Math.random() * 9000 + 1000)}`)
  const [form, setForm]             = useState({ issue: '', device: '', desc: '', contact: '' })

  const txt = language === 'hi'
    ? {
        title: 'सेंसर सहायता और प्रतिस्थापन',
        subtitle: 'खराबी दर्ज करें · तकनीशियन अनुरोध करें · टिकट ट्रैक करें',
        emergency: 'आपातकालीन लाइन',
        supportEmail: 'सपोर्ट ईमेल',
        liveChat: 'लाइव चैट',
        avgResponse: 'औसत 2 मिनट प्रतिक्रिया',
        submitTicket: 'सपोर्ट टिकट जमा करें',
        issueType: 'समस्या प्रकार *',
        selectIssue: 'समस्या चुनें…',
        deviceId: 'डिवाइस आईडी',
        description: 'विवरण *',
        descriptionPlaceholder: 'समस्या को विस्तार से लिखें…',
        contact: 'संपर्क / ईमेल',
        submit: 'टिकट जमा करें',
        submitting: 'जमा हो रहा है…',
        submitted: 'टिकट सफलतापूर्वक जमा हुआ',
        responseEta: 'हमारी टीम 2–4 घंटे में उत्तर देगी।',
        reference: 'संदर्भ:',
        replacements: 'सामान्य प्रतिस्थापन',
        inStock: 'स्टॉक में',
        twoToThreeDays: '2–3 दिन',
        issueSensorMalfunction: 'सेंसर खराबी',
        issueFlowAnomaly: 'प्रवाह दर विसंगति',
        issuePhError: 'pH सेंसर त्रुटि',
        issueTurbidityFault: 'गंदलापन सेंसर खराबी',
        issueNotConnecting: 'डिवाइस कनेक्ट नहीं हो रहा',
        issueEmitterReplacement: 'एमिटर प्रतिस्थापन आवश्यक',
        issueOther: 'अन्य',
      }
    : language === 'mr'
    ? {
        title: 'सेन्सर सपोर्ट आणि बदल',
        subtitle: 'बिघाड नोंदवा · तंत्रज्ञ मागवा · तिकीट ट्रॅक करा',
        emergency: 'आपत्कालीन लाईन',
        supportEmail: 'सपोर्ट ईमेल',
        liveChat: 'लाईव्ह चॅट',
        avgResponse: 'सरासरी 2 मिनिट प्रतिसाद',
        submitTicket: 'सपोर्ट तिकीट पाठवा',
        issueType: 'समस्या प्रकार *',
        selectIssue: 'समस्या निवडा…',
        deviceId: 'डिव्हाइस आयडी',
        description: 'वर्णन *',
        descriptionPlaceholder: 'समस्या सविस्तर लिहा…',
        contact: 'संपर्क / ईमेल',
        submit: 'तिकीट पाठवा',
        submitting: 'पाठवत आहे…',
        submitted: 'तिकीट यशस्वीरित्या पाठवले',
        responseEta: 'आमची टीम 2–4 तासांत प्रतिसाद देईल.',
        reference: 'संदर्भ:',
        replacements: 'सामान्य बदल भाग',
        inStock: 'स्टॉकमध्ये',
        twoToThreeDays: '2–3 दिवस',
        issueSensorMalfunction: 'सेन्सर बिघाड',
        issueFlowAnomaly: 'प्रवाह दर विसंगती',
        issuePhError: 'pH सेन्सर त्रुटी',
        issueTurbidityFault: 'गढूळपणा सेन्सर बिघाड',
        issueNotConnecting: 'डिव्हाइस कनेक्ट होत नाही',
        issueEmitterReplacement: 'एमिटर बदल आवश्यक',
        issueOther: 'इतर',
      }
    : {
        title: 'Sensor Support and Replacement',
        subtitle: 'Report malfunction · Request technician · Track ticket',
        emergency: 'Emergency Line',
        supportEmail: 'Support Email',
        liveChat: 'Live Chat',
        avgResponse: 'Avg. 2 min response',
        submitTicket: 'Submit Support Ticket',
        issueType: 'Issue Type *',
        selectIssue: 'Select issue…',
        deviceId: 'Device ID',
        description: 'Description *',
        descriptionPlaceholder: 'Describe the issue in detail…',
        contact: 'Contact / Email',
        submit: 'Submit Ticket',
        submitting: 'Submitting…',
        submitted: 'Ticket Submitted Successfully',
        responseEta: 'Our team will respond within 2-4 hours.',
        reference: 'Reference:',
        replacements: 'Common Replacements',
        inStock: 'In Stock',
        twoToThreeDays: '2-3 Days',
        issueSensorMalfunction: 'Sensor Malfunction',
        issueFlowAnomaly: 'Flow Rate Anomaly',
        issuePhError: 'pH Sensor Error',
        issueTurbidityFault: 'Turbidity Sensor Fault',
        issueNotConnecting: 'Device Not Connecting',
        issueEmitterReplacement: 'Emitter Replacement Needed',
        issueOther: 'Other',
      }

  const handleSubmit = async () => {
    if (!form.issue || !form.desc) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    setSubmitted(true)
  }

  const issues = [
    txt.issueSensorMalfunction, txt.issueFlowAnomaly, txt.issuePhError,
    txt.issueTurbidityFault, txt.issueNotConnecting,
    txt.issueEmitterReplacement, txt.issueOther,
  ]

  return (
    <div className="card-base overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-amber-500" strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">{txt.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {txt.subtitle}
            </p>
          </div>
        </div>
        <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="border-t border-border p-5 space-y-5">

          {/* Quick contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Phone,         label: txt.emergency,    val: '+1-800-FERTI-01',       ringCls: 'text-red-500',     bgCls: 'bg-red-500/10',     borderCls: 'border-red-500/20'     },
              { icon: Mail,          label: txt.supportEmail, val: 'support@fertiguard.io',  ringCls: 'text-emerald-500', bgCls: 'bg-emerald-500/10', borderCls: 'border-emerald-500/20' },
              { icon: MessageSquare, label: txt.liveChat,     val: txt.avgResponse,          ringCls: 'text-blue-500',    bgCls: 'bg-blue-500/10',    borderCls: 'border-blue-500/20'    },
            ].map(({ icon: I, label, val, ringCls, bgCls, borderCls }) => (
              <div key={label} className={cn('flex items-center gap-3 p-3 rounded-xl bg-muted/30 border', borderCls)}>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border', bgCls, borderCls)}>
                  <I className={cn('w-3.5 h-3.5', ringCls)} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
                  <p className="text-[12px] font-semibold text-foreground">{val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ticket form */}
          {!submitted ? (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{txt.submitTicket}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
                    {txt.issueType}
                  </label>
                  <select
                    value={form.issue}
                    onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl text-sm text-foreground px-3 py-2.5 focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="">{txt.selectIssue}</option>
                    {issues.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
                    {txt.deviceId}
                  </label>
                  <input
                    value={form.device}
                    onChange={e => setForm(f => ({ ...f, device: e.target.value }))}
                    placeholder="e.g. FG-01"
                    className="w-full bg-background border border-border rounded-xl text-sm text-foreground px-3 py-2.5 focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
                  {txt.description}
                </label>
                <textarea
                  rows={3}
                  value={form.desc}
                  onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                  placeholder={txt.descriptionPlaceholder}
                  className="w-full bg-background border border-border rounded-xl text-sm text-foreground px-3 py-2.5 focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
                  {txt.contact}
                </label>
                <input
                  value={form.contact}
                  onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full bg-background border border-border rounded-xl text-sm text-foreground px-3 py-2.5 focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.issue || !form.desc}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <SendHorizonal className="w-3.5 h-3.5" />
                }
                {submitting ? txt.submitting : txt.submit}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-emerald-500 text-sm">{txt.submitted}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {txt.responseEta}{' '}
                  {txt.reference} <strong className="text-foreground">{ticketRef}</strong>
                </p>
              </div>
              <button
                onClick={() => { setSubmitted(false); setForm({ issue: '', device: '', desc: '', contact: '' }) }}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Parts availability */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{txt.replacements}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { part: 'Flow Sensor Module', sku: 'FG-FSM-200', status: txt.inStock,      ok: true  },
                { part: 'pH Probe',           sku: 'FG-PH-100',  status: txt.inStock,      ok: true  },
                { part: 'Turbidity Sensor',   sku: 'FG-TRB-150', status: txt.twoToThreeDays, ok: false },
                { part: 'Emitter Set (x10)',  sku: 'FG-EM-10X',  status: txt.inStock,      ok: true  },
              ].map(({ part, sku, status, ok }) => (
                <div key={sku} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60">
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">{part}</p>
                    <p className="text-[10px] text-muted-foreground">{sku}</p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold px-2.5 py-1 rounded-lg border',
                    ok
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  )}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

/* ══════════════════════ MAIN PAGE ════════════════════════════════ */
export default function MLAnalysisPage() {
  const { user, loading: authLoading, language } = useAuth()
  const router = useRouter()
  const { data: device, isLoading: deviceLoading } = useDeviceData(5000)
  const [history, setHistory]       = useState<HistoricalPoint[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [mlData, setMlData]         = useState<any>(null)
  const [loadingML, setLoadingML]   = useState(false)
  const [analysisTick, setAnalysisTick] = useState(0)
  const latestSensorRef = useRef<Pick<HistoricalPoint, 'startFlow' | 'endFlow' | 'ph' | 'turbidity'> | null>(null)

  const HISTORY_POINTS = 28
  const LIVE_POINT_INTERVAL_MS = 5000

  const appendHistoryPoint = useCallback(
    (sensorValues: Pick<HistoricalPoint, 'startFlow' | 'endFlow' | 'ph' | 'turbidity'>) => {
      const point: HistoricalPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        startFlow: Number(sensorValues.startFlow.toFixed(1)),
        endFlow: Number(sensorValues.endFlow.toFixed(1)),
        ph: Number(sensorValues.ph.toFixed(2)),
        turbidity: Number(sensorValues.turbidity.toFixed(2)),
      }

      setHistory(prev => {
        const next = [...prev, point]
        return next.slice(-HISTORY_POINTS)
      })
    },
    []
  )

  useEffect(() => { if (!authLoading && !user) router.push('/login') }, [user, authLoading, router])

  useEffect(() => {
    if (!device) return

    const sensorValues = {
      startFlow: device.sensors.startFlow,
      endFlow: device.sensors.endFlow,
      ph: device.sensors.ph,
      turbidity: device.sensors.turbidity,
    }

    latestSensorRef.current = sensorValues
    appendHistoryPoint(sensorValues)
  }, [device, appendHistoryPoint])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!latestSensorRef.current) return
      appendHistoryPoint(latestSensorRef.current)
    }, LIVE_POINT_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [appendHistoryPoint])

  const handleRefresh = async () => {
    setRefreshing(true)
    setMlData(null)
    setAnalysisTick(v => v + 1)
    await new Promise(r => setTimeout(r, 400))
    setRefreshing(false)
  }

  useEffect(() => {
    if (!device) return
    setLoadingML(true)
    fetch('/api/ml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device),
    })
      .then(async res => { if (!res.ok) throw new Error('ML failed'); return res.json() })
      .then(data => { setMlData(data); setLoadingML(false) })
      .catch(() => setLoadingML(false))
  }, [device, analysisTick])

  if (deviceLoading && !device) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">{language === 'hi' ? 'विश्लेषण लोड हो रहा है…' : language === 'mr' ? 'विश्लेषण लोड होत आहे…' : 'Loading analysis…'}</p>
      </div>
    </div>
  )

  if (!device) return null

  /* ── Derived values — all safely defaulted so nothing is ever NaN or undefined ── */
  const prob = typeof mlData?.clogProbability === 'number' ? mlData.clogProbability : 0

// ✅ DEFINE FIRST
const anomaly = Number(mlData?.anomaly) === 1
const anomalyType = mlData?.anomalyType ?? ''
const severity = mlData?.severity ?? 'low'
const reason = mlData?.reason ?? ''
const confidence = typeof mlData?.confidence === 'number' ? mlData.confidence : null
const anomalyLabel = (() => {
  const key = String(anomalyType || '').toLowerCase()
  if (language === 'hi') {
    if (key === 'clog') return 'रुकावट'
    if (key === 'leak') return 'लीकेज'
    if (key === 'ph_anomaly') return 'pH विसंगति'
    return 'अज्ञात'
  }
  if (language === 'mr') {
    if (key === 'clog') return 'अडथळा'
    if (key === 'leak') return 'गळती'
    if (key === 'ph_anomaly') return 'pH विसंगती'
    return 'अज्ञात'
  }
  return (anomalyType || 'unknown').toUpperCase()
})()

// ✅ THEN USE IT
const recommend = anomaly
  ? language === 'hi'
    ? `⚠️ ${anomalyLabel} पाया गया — तुरंत जांच करें`
    : language === 'mr'
    ? `⚠️ ${anomalyLabel} आढळले — तातडीने तपासणी करा`
    : `⚠️ ${anomalyLabel} detected — immediate inspection required`
  : mlData?.recommendedAction ?? (language === 'hi' ? 'भविष्यवाणी लोड हो रही है…' : language === 'mr' ? 'अंदाज लोड होत आहे…' : 'Fetching prediction…')

  const gain = prob < 20 ? '+2%' : prob < 40 ? '+5%' : prob < 65 ? '+8%' : '+12%'
  const nf = (v: number, options?: Intl.NumberFormatOptions) => formatNumber(language, v, options)
  const chatDeviceContext = JSON.stringify({
    ph: device.sensors.ph,
    turbidity: device.sensors.turbidity,
    startFlow: device.sensors.startFlow,
    endFlow: device.sensors.endFlow,
    flowDiff: device.sensors.flowDiff,
    clogDetected: anomalyType === 'blockage' || prob >= 60,
    leakDetected: anomalyType === 'leak',
    sensorFault: anomalyType === 'sensor_fault' || anomalyType === 'ph_anomaly',
    status: prob >= 60 ? 'critical' : prob >= 35 ? 'warning' : 'active',
    mode: prob >= 60 ? 'CLEARING' : 'SAMPLING',
    branches: device.branches,
    ml: {
      clogProbability: prob,
      recommendedAction: recommend,
      anomaly: anomaly ? 1 : 0,
      anomalyType,
      severity,
      reason,
      confidence,
    },
  })
  const mlText = language === 'hi'
    ? {
        livePrediction: 'लाइव भविष्यवाणी',
        stableNoAnomaly: 'सिस्टम स्थिर — कोई विसंगति नहीं मिली',
        avgStartFlow: 'औसत प्रारंभ प्रवाह',
        avgEndFlow: 'औसत अंत प्रवाह',
        avgPh: 'औसत pH',
        avgTurbidity: 'औसत गंदलापन',
        flowDiffOverTime: 'समय के साथ प्रवाह अंतर %',
        phTurbTrend: 'pH और गंदलापन ट्रेंड',
        nextFlush: 'अगला फ्लश सुझाव',
        emitterHealth: 'एमिटर हेल्थ स्कोर',
        waterEfficiency: 'पानी उपयोग दक्षता',
        sensorStatus: 'सेंसर स्थिति',
        systemIntelligence: 'सिस्टम इंटेलिजेंस',
        modelConfidence: 'मॉडल भरोसा',
        device: 'डिवाइस',
        refresh: 'रीफ्रेश',
        lowRisk: 'कम जोखिम',
        mediumRisk: 'मध्यम जोखिम',
        highRisk: 'उच्च जोखिम',
        low: 'कम',
        med: 'मध्यम',
        high: 'उच्च',
        start: 'प्रारंभ',
        end: 'अंत',
        alert: 'अलर्ट',
        estimatedYieldImprovement: 'अनुमानित उपज सुधार',
        flowHistoryPoints: 'बिंदु',
        emitterHealthMetric: 'एमिटर हेल्थ',
        waterEfficiencyMetric: 'पानी दक्षता',
        clogRiskMetric: 'क्लॉग जोखिम',
        flushNowUrgent: 'अभी फ्लश करें — तात्कालिक',
        clogExpectedIn: 'क्लॉग अनुमानित',
        flushIn: 'फ्लश करें',
        minShort: 'मिनट',
        riskIncreasing: 'जोखिम तेजी से बढ़ रहा है (प्रवाह घट रहा है)',
        systemRecovering: 'सिस्टम सुधर रहा है (प्रवाह स्थिर हो रहा है)',
        stableConditions: 'स्थितियां स्थिर हैं',
        emittersNormal: 'एमिटर सामान्य रूप से काम कर रहे हैं',
        blockageLikely: 'आंशिक रुकावट संभव — फ्लश शेड्यूल करें',
        optimalWater: 'श्रेष्ठ — पानी सभी एमिटरों तक पहुंच रहा है',
        lossesDetected: 'वितरण में नुकसान मिला',
        sensorHealthy: 'सेंसर सामान्य',
        sensorWarning: 'सेंसर चेतावनी',
        sensorFaultState: 'सेंसर खराबी',
        mlNoSensorFault: 'ML के अनुसार कोई सेंसर खराबी नहीं मिली',
        mlCheckSensors: 'ML के अनुसार सेंसर जांच आवश्यक',
        detected: 'पाया गया',
        allSystemsNormal: 'सभी सिस्टम सामान्य',
        paramsNormal: 'सभी पैरामीटर सामान्य सीमा में हैं',
      }
    : language === 'mr'
    ? {
        livePrediction: 'लाईव्ह अंदाज',
        stableNoAnomaly: 'सिस्टम स्थिर — कोणतीही विसंगती नाही',
        avgStartFlow: 'सरासरी सुरुवातीचा प्रवाह',
        avgEndFlow: 'सरासरी शेवटचा प्रवाह',
        avgPh: 'सरासरी pH',
        avgTurbidity: 'सरासरी गढूळपणा',
        flowDiffOverTime: 'वेळेनुसार प्रवाह फरक %',
        phTurbTrend: 'pH आणि गढूळपणा ट्रेंड',
        nextFlush: 'पुढील फ्लश शिफारस',
        emitterHealth: 'एमिटर हेल्थ स्कोर',
        waterEfficiency: 'पाणी वापर कार्यक्षमता',
        sensorStatus: 'सेन्सर स्थिती',
        systemIntelligence: 'सिस्टम इंटेलिजन्स',
        modelConfidence: 'मॉडेल विश्वास',
        device: 'डिव्हाइस',
        refresh: 'रिफ्रेश',
        lowRisk: 'कमी धोका',
        mediumRisk: 'मध्यम धोका',
        highRisk: 'उच्च धोका',
        low: 'कमी',
        med: 'मध्यम',
        high: 'उच्च',
        start: 'सुरुवात',
        end: 'शेवट',
        alert: 'सूचना',
        estimatedYieldImprovement: 'अंदाजित उत्पादन सुधारणा',
        flowHistoryPoints: 'बिंदू',
        emitterHealthMetric: 'एमिटर हेल्थ',
        waterEfficiencyMetric: 'पाणी कार्यक्षमता',
        clogRiskMetric: 'क्लॉग धोका',
        flushNowUrgent: 'आत्ता फ्लश करा — तातडीचे',
        clogExpectedIn: 'क्लॉग अपेक्षित',
        flushIn: 'फ्लश करा',
        minShort: 'मिनिटे',
        riskIncreasing: 'धोका वेगाने वाढतो आहे (प्रवाह कमी होतो आहे)',
        systemRecovering: 'सिस्टम सुधारते आहे (प्रवाह स्थिर होतो आहे)',
        stableConditions: 'स्थिती स्थिर आहे',
        emittersNormal: 'एमिटर्स सामान्यपणे कार्यरत',
        blockageLikely: 'आंशिक अडथळा शक्य — फ्लश ठरवा',
        optimalWater: 'उत्तम — पाणी सर्व एमिटर्सपर्यंत पोहोचते',
        lossesDetected: 'वितरणात नुकसान आढळले',
        sensorHealthy: 'सेन्सर सामान्य',
        sensorWarning: 'सेन्सर इशारा',
        sensorFaultState: 'सेन्सर बिघाड',
        mlNoSensorFault: 'ML नुसार सेन्सर बिघाड आढळला नाही',
        mlCheckSensors: 'ML नुसार सेन्सर तपासणी आवश्यक',
        detected: 'आढळले',
        allSystemsNormal: 'सर्व सिस्टम सामान्य',
        paramsNormal: 'सर्व पॅरामीटर्स सामान्य मर्यादेत आहेत',
      }
    : {
        livePrediction: 'Live prediction',
        stableNoAnomaly: 'System stable — no anomalies detected',
        avgStartFlow: 'Avg Start Flow',
        avgEndFlow: 'Avg End Flow',
        avgPh: 'Avg pH',
        avgTurbidity: 'Avg Turbidity',
        flowDiffOverTime: 'Flow Diff % Over Time',
        phTurbTrend: 'pH & Turbidity Trend',
        nextFlush: 'Next Flush Recommendation',
        emitterHealth: 'Emitter Health Score',
        waterEfficiency: 'Water Use Efficiency',
        sensorStatus: 'Sensor Status',
        systemIntelligence: 'System Intelligence',
        modelConfidence: 'Model Confidence',
        device: 'Device',
        refresh: 'Refresh',
        lowRisk: 'Low Risk',
        mediumRisk: 'Medium Risk',
        highRisk: 'High Risk',
        low: 'Low',
        med: 'Med',
        high: 'High',
        start: 'Start',
        end: 'End',
        alert: 'Alert',
        estimatedYieldImprovement: 'estimated yield improvement',
        flowHistoryPoints: 'pts',
        emitterHealthMetric: 'Emitter Health',
        waterEfficiencyMetric: 'Water Efficiency',
        clogRiskMetric: 'Clog Risk',
        flushNowUrgent: 'Flush now — urgent',
        clogExpectedIn: 'Clog expected in',
        flushIn: 'Flush in',
        minShort: 'min',
        riskIncreasing: 'Risk increasing rapidly (flow degrading)',
        systemRecovering: 'System recovering (flow stabilizing)',
        stableConditions: 'Stable conditions',
        emittersNormal: 'Emitters operating normally',
        blockageLikely: 'Partial blockage likely — schedule flush',
        optimalWater: 'Optimal — water reaching all emitters',
        lossesDetected: 'Losses detected in distribution',
        sensorHealthy: 'Sensors Normal',
        sensorWarning: 'Sensor Warning',
        sensorFaultState: 'Sensor Fault',
        mlNoSensorFault: 'No sensor fault detected by ML',
        mlCheckSensors: 'ML suggests sensor inspection',
        detected: 'DETECTED',
        allSystemsNormal: 'All Systems Normal',
        paramsNormal: 'All parameters within normal range',
      }

  const riskCls = prob < 30
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/25 dark:text-emerald-400 dark:border-emerald-700/40'
    : prob < 60
    ? 'bg-amber-100 text-amber-700 border-amber-200/80 dark:bg-amber-900/25 dark:text-amber-400 dark:border-amber-700/40'
    : 'bg-red-100 text-red-700 border-red-200/80 dark:bg-red-900/25 dark:text-red-400 dark:border-red-800/40'
  const riskLabel = prob < 30 ? mlText.lowRisk : prob < 60 ? mlText.mediumRisk : mlText.highRisk

  const flowDiffHist = history.map(h => ({
    time: h.time,
    flowDiff: parseFloat((((h.startFlow - h.endFlow) / h.startFlow) * 100).toFixed(1)),
  }))

  const last5      = flowDiffHist.slice(-5)
  const trendSlope = last5.length >= 2
    ? (last5[last5.length - 1].flowDiff - last5[0].flowDiff) / last5.length
    : 0
  const trend =
  trendSlope > 0.5 ? 'increasing' :
  trendSlope < -0.5 ? 'decreasing' :
  'stable'

  const clogMinutesRaw = Math.round((100 - prob) * 0.3)
  const clogMinutes    = trend === 'increasing' ? Math.min(60, Math.max(5, clogMinutesRaw)) : null

  const emitter = Math.max(40, 100 - prob)
  const wEffic  = Math.max(55, 100 - device.sensors.flowDiff * 0.8).toFixed(0)
  const nextMin = Math.round((100 - prob) * 0.5)

  const mlAnomalyType = String(anomalyType || '').toLowerCase()
  const sensorState: 'healthy' | 'warning' | 'fault' = !anomaly
    ? 'healthy'
    : (mlAnomalyType === 'sensor_fault' || mlAnomalyType === 'ph_anomaly')
    ? 'fault'
    : 'warning'

  const sensorStateValue = sensorState === 'healthy'
    ? mlText.sensorHealthy
    : sensorState === 'fault'
    ? mlText.sensorFaultState
    : mlText.sensorWarning

  const sensorStateSub = reason
    ? reason
    : sensorState === 'healthy'
    ? mlText.mlNoSensorFault
    : mlText.mlCheckSensors

  const historyCount = history.length
  const avgStartFlow = historyCount
    ? (history.reduce((s, h) => s + h.startFlow, 0) / historyCount).toFixed(1)
    : device.sensors.startFlow.toFixed(1)
  const avgEndFlow = historyCount
    ? (history.reduce((s, h) => s + h.endFlow, 0) / historyCount).toFixed(1)
    : device.sensors.endFlow.toFixed(1)
  const avgPh = historyCount
    ? (history.reduce((s, h) => s + h.ph, 0) / historyCount).toFixed(2)
    : device.sensors.ph.toFixed(2)
  const avgTurb = historyCount
    ? (history.reduce((s, h) => s + h.turbidity, 0) / historyCount).toFixed(2)
    : device.sensors.turbidity.toFixed(2)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-5 sm:px-8 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between anim-fade-up">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-primary" strokeWidth={1.8} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{t(language, 'mlAnalysisTitle')}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{mlText.device}: {device.deviceId} · {mlText.livePrediction}</p>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="btn-primary">
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">{mlText.refresh}</span>
          </button>
        </div>

        {/* ── Anomaly banner ── */}
        <div className="anim-fade-up">
  {anomaly ? (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-300/60 bg-red-50 dark:bg-red-900/20 dark:border-red-800/60 anim-fade-up">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                {anomalyLabel} {mlText.detected}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{reason}</p>
            </div>
            <span className={cn(
              'text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0',
              severity === 'high'
                ? 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700/50'
                : 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700/50'
            )}>
              {severity?.toUpperCase()}
            </span>
          </div>
        
  ) : (
    <div className="w-full p-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-sm font-medium">
      {mlText.stableNoAnomaly}
    </div>
  )}
</div>
        {/* ── Summary chips ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 anim-fade-up" style={{ animationDelay: '.04s' }}>
          <StatChip label={mlText.avgStartFlow} value={`${nf(Number(avgStartFlow), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L/h`} delta="stable" positive />
          <StatChip label={mlText.avgEndFlow}   value={`${nf(Number(avgEndFlow), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L/h`} />
          <StatChip label={mlText.avgPh}         value={nf(Number(avgPh), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            delta={parseFloat(avgPh) >= 6 && parseFloat(avgPh) <= 7.5 ? 'normal' : 'off'}
            positive={parseFloat(avgPh) >= 6 && parseFloat(avgPh) <= 7.5} />
          <StatChip label={mlText.avgTurbidity}  value={`${nf(Number(avgTurb), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NTU`}
            delta={parseFloat(avgTurb) > 2 ? 'high' : 'normal'}
            positive={parseFloat(avgTurb) <= 2} />
        </div>

        {/* ── Hero 3-col ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Gauge card */}
          <div className="card-base p-5 flex flex-col anim-fade-up" style={{ animationDelay: '.08s' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle
                className={cn('w-4 h-4', prob < 30 ? 'text-emerald-500' : prob < 60 ? 'text-amber-500' : 'text-red-500')}
                strokeWidth={2}
              />
              <span className="text-[13px] font-semibold text-foreground">{t(language, 'clogProbability')}</span>
            </div>
            <Gauge value={prob} language={language} />
            <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px] font-semibold">
              {[['0–30', 'Low', 'text-emerald-500'], ['30–60', 'Med', 'text-amber-500'], ['60+', 'High', 'text-red-500']].map(([r, l, c]) => (
                <div key={l} className="py-1.5 rounded-lg bg-muted/40 border border-border/40">
                  <p className={cn(c)}>{l === 'Low' ? mlText.low : l === 'Med' ? mlText.med : mlText.high}</p>
                  <p className="text-muted-foreground text-[9px]">{r}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rich recommended action */}
          <div className="anim-fade-up" style={{ animationDelay: '.12s' }}>
            <RecommendedActionCard
              prob={prob}
              recommend={recommend}
              loadingML={loadingML}
              device={device}
              riskLabel={riskLabel}
              riskCls={riskCls}
              confidence={confidence}
              language={language}
            />
          </div>

          {/* Yield impact */}
          <div className="card-base p-5 flex flex-col gap-3 anim-fade-up" style={{ animationDelay: '.16s' }}>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />
              <span className="text-[13px] font-semibold text-foreground">{t(language, 'yieldImpact')}</span>
            </div>
            <div>
              <span className="font-bold text-4xl text-primary tabular-nums tracking-tight">{gain}</span>
              <p className="text-xs text-muted-foreground mt-1">{mlText.estimatedYieldImprovement}</p>
            </div>
            <div className="space-y-2 mt-auto">
              <MetricBar label={mlText.emitterHealthMetric}  val={emitter}            color={emitter > 70 ? '#22c55e' : '#f59e0b'} />
              <MetricBar label={mlText.waterEfficiencyMetric} val={parseFloat(wEffic)} color="#3b82f6" />
              <MetricBar label={mlText.clogRiskMetric}        val={prob}               color={prob < 30 ? '#22c55e' : prob < 60 ? '#f59e0b' : '#ef4444'} />
            </div>
          </div>
        </div>

        {/* ── Flow Rate History ── */}
        <div className="card-base p-5 anim-fade-up" style={{ animationDelay: '.2s' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.8} />
              <h2 className="text-[15px] font-semibold text-foreground">{t(language, 'flowHistory')}</h2>
              <span className="ml-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {nf(history.length)} {mlText.flowHistoryPoints}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{mlText.start}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{mlText.end}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={history} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={.25} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={.5} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip language={language} />} />
              <Area type="monotone" dataKey="startFlow" name="Start Flow (L/h)" stroke="#34d399" fill="url(#gS)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="endFlow"   name="End Flow (L/h)"   stroke="#60a5fa" fill="url(#gE)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card-base p-5 anim-fade-up" style={{ animationDelay: '.24s' }}>
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="w-4 h-4 text-amber-500" strokeWidth={1.8} />
              <h2 className="text-[15px] font-semibold text-foreground">{mlText.flowDiffOverTime}</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={flowDiffHist} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={.5} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip language={language} />} />
                <ReferenceLine y={30} stroke="#f87171" strokeDasharray="4 4" strokeWidth={1.5}
                  label={{ value: mlText.alert, position: 'insideTopRight', fill: '#f87171', fontSize: 9 }} />
                <Bar dataKey="flowDiff" name="Flow Diff %" fill="#fbbf24" radius={[3, 3, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-base p-5 anim-fade-up" style={{ animationDelay: '.28s' }}>
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-violet-500" strokeWidth={1.8} />
              <h2 className="text-[15px] font-semibold text-foreground">{mlText.phTurbTrend}</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={.5} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip language={language} />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={7} />
                <Line type="monotone" dataKey="ph"        name="pH"             stroke="#a78bfa" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="turbidity" name={`${mlText.avgTurbidity} (NTU)`} stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Insight cards — 4-col, fills evenly, no orphan ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up" style={{ animationDelay: '.32s' }}>
          <InsightCard
            icon={Zap}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            title={mlText.nextFlush}
            value={
              prob > 70 && trend === 'increasing'
                ? mlText.flushNowUrgent
                : clogMinutes ? `${mlText.clogExpectedIn} ~${nf(clogMinutes)} ${mlText.minShort}`
                : `${mlText.flushIn} ~${nf(nextMin)} ${mlText.minShort}`
            }
            valueCls={prob > 50 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}
            sub={
              trend === 'increasing' ? mlText.riskIncreasing
              : trend === 'decreasing' ? mlText.systemRecovering
              : mlText.stableConditions
            }
          />
          <InsightCard
            icon={Droplets}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            title={mlText.emitterHealth}
            value={`${nf(emitter)}%`}
            valueCls={emitter > 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
            sub={emitter > 70 ? mlText.emittersNormal : mlText.blockageLikely}
          />
          <InsightCard
            icon={ShieldCheck}
            iconColor={sensorState === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' : sensorState === 'fault' ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}
            iconBg={sensorState === 'healthy' ? 'bg-emerald-100 dark:bg-emerald-900/30' : sensorState === 'fault' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}
            title={mlText.sensorStatus}
            value={sensorStateValue}
            valueCls={sensorState === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' : sensorState === 'fault' ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}
            sub={sensorStateSub}
          />
          <InsightCard
            icon={AlertTriangle}
            iconColor={anomaly ? (severity === 'high' ? 'text-red-500' : 'text-amber-500') : 'text-emerald-500'}
            iconBg={anomaly
              ? (severity === 'high' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30')
              : 'bg-emerald-100 dark:bg-emerald-900/30'}
            title={mlText.systemIntelligence}
            value={anomaly ? `${anomalyLabel} ${mlText.detected}` : mlText.allSystemsNormal}
            valueCls={anomaly
              ? (severity === 'high' ? 'text-red-500' : 'text-amber-500')
              : 'text-emerald-600 dark:text-emerald-400'}
            sub={
              reason
                ? reason
                : confidence !== null
                ? `${mlText.modelConfidence}: ${nf(Math.max(20, Math.round(confidence * 100)))}%`
                : mlText.paramsNormal
            }
          />
        </div>

        {/* ── Model confidence strip (only when data is available) ── */}
        {confidence !== null && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/60 anim-fade-up" style={{ animationDelay: '.36s' }}>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-4 h-4 text-blue-500" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                {mlText.modelConfidence}
              </p>
              <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-blue-500"
                  style={{ width: `${Math.max(20, Math.round(confidence * 100))}%` }}
                />
              </div>
            </div>
            <span className="font-bold text-blue-500 text-lg tabular-nums">
              {nf(Math.max(20, Math.round(confidence * 100)))}%
            </span>
          </div>
        )}

        {/* ── Support Panel ── */}
        <div className="anim-fade-up" style={{ animationDelay: '.4s' }}>
          <SupportPanel language={language} />
        </div>

      </main>
      <Chatbot language={language} deviceContext={chatDeviceContext} />
    </div>
  )
}