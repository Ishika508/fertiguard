'use client'

import React, { useState } from 'react'
import type { Language } from '@/lib/i18n'
import {
  X,
  Wrench,
  SendHorizonal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Droplets,
  FlaskConical,
  Gauge,
  Wifi,
  WifiOff,
  Clock,
  User,
  Phone,
  MapPin,
  Tag,
  FileText,
  Zap,
  Shield,
  Activity,
  Info,
} from 'lucide-react'

type Priority = 'low' | 'medium' | 'high' | 'critical'

type Props = {
  open: boolean
  language: Language
  onClose: () => void
}

const ISSUE_ICONS: Record<string, React.ElementType> = {
  sensor:    Cpu,
  flow:      Gauge,
  ph:        FlaskConical,
  turbidity: Droplets,
  connect:   WifiOff,
  emitter:   Zap,
  other:     Wrench,
}

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; border: string; dot: string }> = {
  low:      { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
  medium:   { color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-900/20',    border: 'border-amber-200 dark:border-amber-800/50',    dot: 'bg-amber-500'   },
  high:     { color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-900/20',  border: 'border-orange-200 dark:border-orange-800/50',  dot: 'bg-orange-500'  },
  critical: { color: 'text-red-600 dark:text-red-400',        bg: 'bg-red-50 dark:bg-red-900/20',        border: 'border-red-200 dark:border-red-800/50',        dot: 'bg-red-500'     },
}

// ── Shared field styles ────────────────────────────────────────────────────────
// text-sm + leading-5 + placeholder:text-sm keeps inputs and textareas
// visually consistent at 14px — no more oversized placeholder text.
const BASE_FIELD =
  'w-full bg-background border border-border rounded-xl ' +
  'text-sm leading-5 text-foreground ' +
  'px-3 py-2.5 ' +
  'focus:outline-none focus:border-primary/50 transition-colors ' +
  'placeholder:text-muted-foreground/40 placeholder:text-sm placeholder:leading-5'

const INPUT_CLS    = BASE_FIELD
const TEXTAREA_CLS = BASE_FIELD + ' resize-none'
const TEXTAREA_MONO = BASE_FIELD + ' resize-none font-mono text-[12px] leading-[1.6] placeholder:text-[12px]'

export function SupportTicketModal({ open, language, onClose }: Props) {
  const [submitted, setSubmitted]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab]   = useState<'issue' | 'technician' | 'system'>('issue')
  const [ticketRef]                 = useState(() => `FG-${Math.floor(Math.random() * 90000 + 10000)}`)
  const [form, setForm] = useState({
    issue:        '',
    priority:     'medium' as Priority,
    device:       '',
    desc:         '',
    contact:      '',
    phone:        '',
    location:     '',
    techNotes:    '',
    attachLogs:   false,
    remoteAccess: false,
  })

  // ── Translations ──────────────────────────────────────────────────────────
  const txt = {
    en: {
      title: 'Support Ticket', subtitle: 'Report an issue & request technician support',
      tabIssue: 'Issue Details', tabTech: 'Technician Info', tabSystem: 'System Context',
      issueType: 'Issue Type', priority: 'Priority',
      device: 'Device ID', devicePh: 'e.g. FG-01',
      desc: 'Description',
      descPh: 'Describe the problem in detail — what you observed, when it started, what you already tried…',
      contact: 'Name / Email', contactPh: 'your@email.com',
      phone: 'Phone', phonePh: '+91 98765 43210',
      location: 'Site Location', locationPh: 'Field section / zone name',
      techNotes: 'Technician Notes',
      techNotesPh: 'Error codes, LED status, last maintenance date, sensor serial numbers…',
      attachLogs: 'Attach device logs automatically',
      remoteAccess: 'Allow remote diagnostic access',
      submit: 'Submit Ticket', submitting: 'Submitting…',
      successTitle: 'Ticket Submitted!',
      successSub: 'Our team will respond within 2–4 hours. For critical issues, expect a callback within 30 minutes.',
      reference: 'Reference ID', etaLabel: 'Response ETA',
      etaCritical: '< 30 min', etaHigh: '< 2 hrs', etaMed: '2–4 hrs', etaLow: '4–8 hrs',
      close: 'Close', newTicket: 'New Ticket',
      issueSensor: 'Sensor Malfunction', issueFlow: 'Flow Rate Anomaly',
      issuePh: 'pH Sensor Error', issueTurbidity: 'Turbidity Sensor Fault',
      issueConnect: 'Device Not Connecting', issueEmitter: 'Emitter Replacement',
      issueOther: 'Other',
      priLow: 'Low', priMed: 'Medium', priHigh: 'High', priCritical: 'Critical',
      sysPhLabel: 'Current pH', sysTurbLabel: 'Turbidity', sysFlowLabel: 'Flow Diff',
    },
    hi: {
      title: 'सपोर्ट टिकट', subtitle: 'समस्या दर्ज करें और टेक्नीशियन सहायता लें',
      tabIssue: 'समस्या विवरण', tabTech: 'टेक्नीशियन जानकारी', tabSystem: 'सिस्टम संदर्भ',
      issueType: 'समस्या प्रकार', priority: 'प्राथमिकता',
      device: 'डिवाइस आईडी', devicePh: 'जैसे FG-01',
      desc: 'विवरण', descPh: 'समस्या को विस्तार से लिखें…',
      contact: 'नाम / ईमेल', contactPh: 'your@email.com',
      phone: 'फोन', phonePh: '+91 98765 43210',
      location: 'साइट स्थान', locationPh: 'खेत अनुभाग / क्षेत्र नाम',
      techNotes: 'टेक्नीशियन नोट्स',
      techNotesPh: 'त्रुटि कोड, LED स्थिति, अंतिम रखरखाव तिथि…',
      attachLogs: 'डिवाइस लॉग स्वचालित रूप से संलग्न करें',
      remoteAccess: 'रिमोट डायग्नोस्टिक एक्सेस की अनुमति दें',
      submit: 'टिकट जमा करें', submitting: 'जमा हो रहा है…',
      successTitle: 'टिकट जमा हुआ!',
      successSub: 'हमारी टीम 2–4 घंटे में उत्तर देगी। गंभीर मामलों में 30 मिनट में कॉलबैक।',
      reference: 'संदर्भ आईडी', etaLabel: 'प्रतिक्रिया समय',
      etaCritical: '< 30 मिनट', etaHigh: '< 2 घंटे', etaMed: '2–4 घंटे', etaLow: '4–8 घंटे',
      close: 'बंद करें', newTicket: 'नया टिकट',
      issueSensor: 'सेंसर खराबी', issueFlow: 'प्रवाह दर विसंगति',
      issuePh: 'pH सेंसर त्रुटि', issueTurbidity: 'गंदलापन सेंसर खराबी',
      issueConnect: 'डिवाइस कनेक्ट नहीं', issueEmitter: 'एमिटर प्रतिस्थापन',
      issueOther: 'अन्य',
      priLow: 'कम', priMed: 'मध्यम', priHigh: 'उच्च', priCritical: 'गंभीर',
      sysPhLabel: 'वर्तमान pH', sysTurbLabel: 'गंदलापन', sysFlowLabel: 'प्रवाह अंतर',
    },
    mr: {
      title: 'सपोर्ट तिकीट', subtitle: 'समस्या नोंदवा आणि तंत्रज्ञ मदत घ्या',
      tabIssue: 'समस्या तपशील', tabTech: 'तंत्रज्ञ माहिती', tabSystem: 'सिस्टम संदर्भ',
      issueType: 'समस्या प्रकार', priority: 'प्राधान्य',
      device: 'डिव्हाइस आयडी', devicePh: 'उदा. FG-01',
      desc: 'वर्णन', descPh: 'समस्या सविस्तर लिहा…',
      contact: 'नाव / ईमेल', contactPh: 'your@email.com',
      phone: 'फोन', phonePh: '+91 98765 43210',
      location: 'साइट स्थान', locationPh: 'शेत विभाग / झोन नाव',
      techNotes: 'तंत्रज्ञ नोट्स',
      techNotesPh: 'त्रुटी कोड, LED स्थिती, शेवटची देखभाल तारीख…',
      attachLogs: 'डिव्हाइस लॉग आपोआप जोडा',
      remoteAccess: 'रिमोट डायग्नोस्टिक ॲक्सेसला परवानगी द्या',
      submit: 'तिकीट पाठवा', submitting: 'पाठवत आहे…',
      successTitle: 'तिकीट पाठवले!',
      successSub: 'आमची टीम 2–4 तासांत प्रतिसाद देईल. गंभीर प्रकरणांसाठी 30 मिनिटांत कॉलबॅक.',
      reference: 'संदर्भ आयडी', etaLabel: 'प्रतिसाद वेळ',
      etaCritical: '< 30 मिनिटे', etaHigh: '< 2 तास', etaMed: '2–4 तास', etaLow: '4–8 तास',
      close: 'बंद करा', newTicket: 'नवीन तिकीट',
      issueSensor: 'सेन्सर बिघाड', issueFlow: 'प्रवाह दर विसंगती',
      issuePh: 'pH सेन्सर त्रुटी', issueTurbidity: 'गढूळपणा सेन्सर बिघाड',
      issueConnect: 'डिव्हाइस कनेक्ट होत नाही', issueEmitter: 'एमिटर बदल',
      issueOther: 'इतर',
      priLow: 'कमी', priMed: 'मध्यम', priHigh: 'उच्च', priCritical: 'गंभीर',
      sysPhLabel: 'सध्याचा pH', sysTurbLabel: 'गढूळपणा', sysFlowLabel: 'प्रवाह फरक',
    },
  }[language]

  const issues = [
    { key: 'sensor',    label: txt.issueSensor,    icon: 'sensor'    },
    { key: 'flow',      label: txt.issueFlow,      icon: 'flow'      },
    { key: 'ph',        label: txt.issuePh,        icon: 'ph'        },
    { key: 'turbidity', label: txt.issueTurbidity, icon: 'turbidity' },
    { key: 'connect',   label: txt.issueConnect,   icon: 'connect'   },
    { key: 'emitter',   label: txt.issueEmitter,   icon: 'emitter'   },
    { key: 'other',     label: txt.issueOther,     icon: 'other'     },
  ]

  const priorities: { key: Priority; label: string }[] = [
    { key: 'low',      label: txt.priLow      },
    { key: 'medium',   label: txt.priMed      },
    { key: 'high',     label: txt.priHigh     },
    { key: 'critical', label: txt.priCritical },
  ]

  const etaMap: Record<Priority, string> = {
    critical: txt.etaCritical,
    high:     txt.etaHigh,
    medium:   txt.etaMed,
    low:      txt.etaLow,
  }

  const tabs = [
    { key: 'issue'      as const, label: txt.tabIssue,  icon: FileText },
    { key: 'technician' as const, label: txt.tabTech,   icon: Wrench   },
    { key: 'system'     as const, label: txt.tabSystem, icon: Activity },
  ]

  const handleSubmit = async () => {
    if (!form.issue || !form.desc || submitting) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSubmitting(false)
    setSubmitted(true)
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setSubmitted(false)
      setSubmitting(false)
      setActiveTab('issue')
      setForm({
        issue: '', priority: 'medium', device: '', desc: '',
        contact: '', phone: '', location: '', techNotes: '',
        attachLogs: false, remoteAccess: false,
      })
    }, 200)
  }

  if (!open) return null

  const pc = PRIORITY_CONFIG[form.priority]

  // ── Reusable label row ────────────────────────────────────────────────────
  function FieldLabel({
    icon: Icon,
    children,
    required,
  }: {
    icon?: React.ElementType
    children: React.ReactNode
    required?: boolean
  }) {
    return (
      <label className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">
        {Icon && <Icon className="w-3 h-3 shrink-0" strokeWidth={2} />}
        {children}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-label={txt.close}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Wrench className="w-[18px] h-[18px] text-amber-500" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{txt.title}</p>
              <p className="text-[11px] text-muted-foreground">{txt.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-muted border border-border text-muted-foreground">
              <Tag className="w-3 h-3" />
              {ticketRef}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!submitted ? (
          <>
            {/* ── Tabs ── */}
            <div className="flex border-b border-border shrink-0 bg-muted/20">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-semibold transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── Scrollable content ── */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* ══════════════════════════════════════════
                  TAB 1 — Issue Details
              ══════════════════════════════════════════ */}
              {activeTab === 'issue' && (
                <>
                  {/* Issue type grid */}
                  <div>
                    <FieldLabel required>{txt.issueType}</FieldLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {issues.map((item) => {
                        const Icon = ISSUE_ICONS[item.icon]
                        const selected = form.issue === item.key
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, issue: item.key }))}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center text-[11px] font-semibold transition-all ${
                              selected
                                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/60 hover:text-foreground'
                            }`}
                          >
                            <Icon className="w-4 h-4" strokeWidth={1.8} />
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Priority selector */}
                  <div>
                    <FieldLabel>{txt.priority}</FieldLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {priorities.map((p) => {
                        const cfg = PRIORITY_CONFIG[p.key]
                        const selected = form.priority === p.key
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, priority: p.key }))}
                            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all ${
                              selected
                                ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${selected ? cfg.dot : 'bg-muted-foreground/40'}`} />
                            {p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Device ID + Site Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel icon={Cpu}>{txt.device}</FieldLabel>
                      <input
                        value={form.device}
                        onChange={(e) => setForm((f) => ({ ...f, device: e.target.value }))}
                        placeholder={txt.devicePh}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <FieldLabel icon={MapPin}>{txt.location}</FieldLabel>
                      <input
                        value={form.location}
                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                        placeholder={txt.locationPh}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  {/* Description textarea — fixed font size */}
                  <div>
                    <FieldLabel icon={FileText} required>{txt.desc}</FieldLabel>
                    <textarea
                      rows={4}
                      value={form.desc}
                      onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                      placeholder={txt.descPh}
                      className={TEXTAREA_CLS}
                    />
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════════
                  TAB 2 — Technician Info
              ══════════════════════════════════════════ */}
              {activeTab === 'technician' && (
                <>
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-300">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-[12px] leading-relaxed">
                      Technician information helps us route your ticket to the nearest available engineer and reduces diagnosis time by up to 60%.
                    </p>
                  </div>

                  {/* Name / Email + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel icon={User}>{txt.contact}</FieldLabel>
                      <input
                        value={form.contact}
                        onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                        placeholder={txt.contactPh}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <FieldLabel icon={Phone}>{txt.phone}</FieldLabel>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder={txt.phonePh}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  {/* Technician notes — monospace, compact */}
                  <div>
                    <FieldLabel icon={Wrench}>{txt.techNotes}</FieldLabel>
                    <textarea
                      rows={4}
                      value={form.techNotes}
                      onChange={(e) => setForm((f) => ({ ...f, techNotes: e.target.value }))}
                      placeholder={txt.techNotesPh}
                      className={TEXTAREA_MONO}
                    />
                  </div>

                  {/* Toggle switches */}
                  <div className="space-y-2">
                    {([
                      { key: 'attachLogs'   as const, label: txt.attachLogs,   icon: Activity },
                      { key: 'remoteAccess' as const, label: txt.remoteAccess, icon: Wifi     },
                    ] as const).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, [opt.key]: !f[opt.key] }))}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                          form[opt.key]
                            ? 'border-primary/50 bg-primary/[0.08] text-foreground'
                            : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          form[opt.key] ? 'bg-primary/15' : 'bg-muted'
                        }`}>
                          <opt.icon className={`w-4 h-4 ${form[opt.key] ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.8} />
                        </div>
                        <span className="text-[13px] font-medium flex-1">{opt.label}</span>
                        {/* Toggle pill */}
                        <div className={`w-10 h-[22px] rounded-full border-2 transition-colors relative shrink-0 ${
                          form[opt.key] ? 'bg-primary border-primary' : 'bg-muted border-border'
                        }`}>
                          <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${
                            form[opt.key] ? 'left-[18px]' : 'left-[2px]'
                          }`} />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Response ETA card */}
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${pc.border} ${pc.bg}`}>
                    <div className="flex items-center gap-2.5">
                      <Clock className={`w-4 h-4 ${pc.color}`} />
                      <div>
                        <p className={`text-[12px] font-bold ${pc.color}`}>{txt.etaLabel}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{form.priority} priority</p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold tabular-nums ${pc.color}`}>{etaMap[form.priority]}</span>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════════
                  TAB 3 — System Context
              ══════════════════════════════════════════ */}
              {activeTab === 'system' && (
                <>
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-[12px] leading-relaxed">
                      System context is auto-captured from your live device. This snapshot will be attached to your ticket to help our engineers diagnose faster.
                    </p>
                  </div>

                  {/* Live sensor snapshot */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Live Sensor Snapshot</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: txt.sysPhLabel,   value: '—', unit: 'pH',  icon: FlaskConical, color: 'text-primary'   },
                        { label: txt.sysTurbLabel, value: '—', unit: 'NTU', icon: Droplets,     color: 'text-sky-500'   },
                        { label: txt.sysFlowLabel, value: '—', unit: '%',   icon: Gauge,        color: 'text-amber-500' },
                      ].map((s) => (
                        <div key={s.label} className="card-inset p-3 rounded-xl text-center">
                          <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} strokeWidth={1.8} />
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className={`text-lg font-bold tabular-nums ${s.color}`}>
                            {s.value}{' '}
                            <span className="text-[10px] font-normal text-muted-foreground">{s.unit}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pre-submission checklist */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Pre-Submission Checklist</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Power supply checked',              icon: Zap           },
                        { label: 'Sensor cable connections verified', icon: Cpu           },
                        { label: 'Device restarted once',             icon: RefreshCw     },
                        { label: 'No physical damage visible',        icon: Shield        },
                        { label: 'Issue persists after restart',      icon: AlertTriangle },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/60 bg-muted/20 text-[12px] text-muted-foreground"
                        >
                          <item.icon className="w-3.5 h-3.5 shrink-0 text-primary/60" strokeWidth={1.8} />
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ticket summary */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2 text-[12px]">
                    <p className="font-bold text-foreground mb-1">Ticket Summary</p>
                    {[
                      { label: 'Issue',    value: issues.find((i) => i.key === form.issue)?.label || '—' },
                      { label: 'Priority', value: form.priority || '—' },
                      { label: 'Device',   value: form.device   || '—' },
                      { label: 'Location', value: form.location || '—' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between border-b border-border/40 pb-1.5 last:border-0 last:pb-0"
                      >
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-semibold text-foreground capitalize">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Footer / Submit ── */}
            <div className="px-5 py-4 border-t border-border bg-muted/20 shrink-0 flex items-center gap-3">
              {/* Tab dot indicators */}
              <div className="flex gap-1.5 mr-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`h-2 rounded-full transition-all ${
                      activeTab === tab.key
                        ? 'bg-primary w-5'
                        : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/60'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !form.issue || !form.desc}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-primary/30"
              >
                {submitting
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <SendHorizonal className="w-3.5 h-3.5" />
                }
                {submitting ? txt.submitting : txt.submit}
              </button>
            </div>
          </>
        ) : (
          /* ── Success state ── */
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{txt.successTitle}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">{txt.successSub}</p>
            </div>

            {/* Reference card */}
            <div className="w-full max-w-xs p-4 rounded-2xl border border-border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{txt.reference}</span>
                <span className="text-sm font-mono font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg">{ticketRef}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{txt.etaLabel}</span>
                <span className={`text-sm font-bold ${pc.color}`}>{etaMap[form.priority]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Priority</span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${pc.bg} ${pc.border} ${pc.color} capitalize flex items-center gap-1`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                  {form.priority}
                </span>
              </div>
            </div>

            <div className="flex gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setActiveTab('issue')
                  setForm({
                    issue: '', priority: 'medium', device: '', desc: '',
                    contact: '', phone: '', location: '', techNotes: '',
                    attachLogs: false, remoteAccess: false,
                  })
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {txt.newTicket}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {txt.close}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}