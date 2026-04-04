'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useDeviceData } from '@/hooks/useDeviceData'
import { writeActuatorState } from '@/lib/firebaseRTDB'
import { Navbar } from '@/components/navbar'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { ActuatorControlPanel } from '@/components/dashboard/ActuatorControl'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import { Chatbot } from '@/components/chatbot/Chatbot'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Droplets,
  FlaskConical,
  Gauge,
  GitBranch,
  Lightbulb,
  OctagonAlert,
  Shield,
  Waves,
  WifiOff,
} from 'lucide-react'
import { formatNumber, t } from '@/lib/i18n'
import type { SensorData } from '@/lib/mockData'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartPoint = {
  t: string
  startFlow: number
  endFlow: number
  flowDiff: number
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  valueClass,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  valueClass?: string
}) {
  return (
    <div className="card-base p-4 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
        </div>
      </div>
      <p className={`text-3xl font-bold tracking-tight tabular-nums ${valueClass ?? 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

function RingMeter({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = clamped < 35 ? '#22c55e' : clamped < 65 ? '#f59e0b' : '#ef4444'
  const size = 180
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (clamped / 100) * circumference

  return (
    <div className="relative w-[180px] h-[180px] mx-auto">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          style={{ transition: 'stroke-dashoffset .7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums" style={{ color }}>{Math.round(clamped)}</span>
        <span className="text-xs text-muted-foreground font-semibold">RISK %</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading: authLoading, language } = useAuth()
  const router = useRouter()
  const { data, isLoading, refresh } = useDeviceData(5000)

  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [isClearingCycle, setIsClearingCycle] = useState(false)
  const [cycleEndsAt, setCycleEndsAt] = useState<number | null>(null)
  const lastSnapshotRef = useRef<string | null>(null)
  const prevClogDetectedRef = useRef(false)
  const clearingTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!data) return

    const rawTs = Number(data.sensors.timestamp ?? data.lastUpdated ?? Date.now())
    const sourceTs = Number.isFinite(rawTs)
      ? (rawTs > 0 && rawTs < 1e12 ? rawTs * 1000 : rawTs)
      : Date.now()
    const now = Date.now()
    const ts = Math.abs(now - sourceTs) > 120000 ? now : sourceTs
    const snapshotKey = [
      ts,
      Number(data.sensors.startFlow.toFixed(3)),
      Number(data.sensors.endFlow.toFixed(3)),
      Number(data.sensors.ph.toFixed(3)),
      Number(data.sensors.turbidity.toFixed(3)),
      Number((data.branches.B1 ?? -1).toFixed?.(3) ?? data.branches.B1 ?? -1),
    ].join('|')
    if (lastSnapshotRef.current === snapshotKey) return

    lastSnapshotRef.current = snapshotKey
    const flowDiff = Number((data.sensors.flowDiff ?? (data.sensors.startFlow - data.sensors.endFlow)).toFixed(1))

    setChartData((prev) => {
      const next: ChartPoint[] = [
        ...prev,
        {
          t: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          startFlow: Number(data.sensors.startFlow.toFixed(1)),
          endFlow: Number(data.sensors.endFlow.toFixed(1)),
          flowDiff,
        },
      ]
      return next.slice(-24)
    })
  }, [data])

  const computedFlowDiff = data
    ? Number((data.sensors.flowDiff ?? (data.sensors.startFlow - data.sensors.endFlow)).toFixed(1))
    : 0
  const clogDetectedByRule = computedFlowDiff > 40

  useEffect(() => {
    if (!data) return

    const hasNewClogEvent = clogDetectedByRule && !prevClogDetectedRef.current && !isClearingCycle
    prevClogDetectedRef.current = clogDetectedByRule

    if (!hasNewClogEvent) return

    setIsClearingCycle(true)
    setCycleEndsAt(Date.now() + 20000)

    writeActuatorState(data.deviceId, {
      mainSolenoid: true,
      flushPump: true,
      acidInjection: true,
    }).catch(() => {})

    if (clearingTimerRef.current) clearTimeout(clearingTimerRef.current)
    clearingTimerRef.current = setTimeout(() => {
      writeActuatorState(data.deviceId, {
        mainSolenoid: true,
        flushPump: false,
        acidInjection: false,
      }).catch(() => {})
      setIsClearingCycle(false)
      setCycleEndsAt(null)
      clearingTimerRef.current = null
    }, 20000)
  }, [data, clogDetectedByRule, isClearingCycle])

  useEffect(() => {
    return () => {
      if (clearingTimerRef.current) clearTimeout(clearingTimerRef.current)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const b1Flow = data?.branches.B1
  const b1Disconnected = b1Flow === null || b1Flow === undefined || b1Flow <= 0

  const deviceContext = data
    ? JSON.stringify({
        ph: data.sensors.ph,
        turbidity: data.sensors.turbidity,
        startFlow: data.sensors.startFlow,
        endFlow: data.sensors.endFlow,
        flowDiff: computedFlowDiff,
        clogDetected: clogDetectedByRule,
        clogBranch: data.systemStatus.clogBranch,
        leakDetected: data.systemStatus.leakDetected,
        sensorFault: data.systemStatus.sensorFault,
        status: clogDetectedByRule ? 'warning' : data.status,
        mode: isClearingCycle ? 'CLEARING' : 'SAMPLING',
        branches: data.branches,
      })
    : ''

  const clogRisk = computedFlowDiff
  const alertCount = data
    ? Number(clogDetectedByRule) + Number(data.systemStatus.leakDetected) + Number(data.systemStatus.sensorFault) + Number(b1Disconnected)
    : 0
  const hasAlert = alertCount > 0

  const aiConfidence = useMemo(() => {
    if (!data) return 0
    const baseline = Math.max(25, Math.min(70, 70 - computedFlowDiff))
    return Math.round(baseline)
  }, [data, computedFlowDiff])

  const viewText = {
    en: {
      systemHealth: 'System Health Overview',
      liveLastUpdate: 'Live - Last update',
      minutesAgo: 'minutes ago',
      sensorsOk: 'Sensors OK',
      leakDetected: 'Leak Detected',
      noLeak: 'No Leak',
      clogStatus: 'Clog Status',
      clear: 'CLEAR',
      clog: 'CLOG',
      branchAttention: 'Flow diff threshold breached',
      branchClear: 'All branches clear',
      activeAlerts: 'Active Alerts',
      pending: 'Pending',
      clogRiskIndex: 'Clog Risk Index',
      lowRisk: 'Low Risk',
      mediumRisk: 'Medium',
      highRisk: 'High Risk',
      liveSensorData: 'Live Sensor Data',
      live: 'LIVE',
      aiInsights: 'AI Insights',
      recommendedAction: 'Recommended Action',
      realTimeAnalytics: 'Real-Time Analytics',
      branchNodes: 'Branch Nodes',
      checkConnection: 'CHECK CONNECTION',
      active: 'ACTIVE',
      flowRate: 'Flow Rate',
      checkB1: 'B1 is 0 - check B1 sensor and wiring connections',
      activeAlertsTitle: 'Active Alerts',
      allClear: 'All Clear',
      noActiveAlerts: 'No active alerts',
      refreshText: 'Auto-refreshing every 5 seconds - Device ID:',
      cannotLoad: 'Could not load device data',
      retry: 'Retry',
      criticalAlert: 'Critical alert: Immediate attention required. Check clog and sensor status below.',
      clogRuleAlert: 'Flow Difference > 40%: clog detected. CLEARING MODE active for 20 seconds with acid injection and continuous main line flow.',
      leakPipeline: 'Leak detected in main pipeline. Inspect connections immediately.',
      b1ZeroWarn: 'B1 flow is 0. Check B1 connections/sensor wiring before continuing.',
      sensorFaultWarn: 'Sensor fault detected. Check sensor cable connections and recalibrate.',
      systemMode: 'System Mode',
      clearingSub: 'Acid clearing cycle active',
      monitoringSub: 'Active monitoring',
      clogRisk: 'Clog Risk',
      ruleText: 'Rule: Start Flow - End Flow',
      b1Flow: 'B1 Flow',
      b1CheckSub: 'Check B1 connections',
      b1ActiveSub: 'L/min - Active branch',
      phOptimal: 'Optimal: 5.5 - 7.5',
      systemNominal: 'System nominal',
      aiConfidence: 'AI Confidence',
      timeToFailure: 'Time to Failure',
      clearing: 'Clearing',
      watch: 'Watch',
      stable: 'Stable',
      firebaseValue: 'Live value from Firebase',
      confidence: 'Confidence',
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      clearingAction: 'Acid injection and flush are triggered for 20 seconds. Main line remains ON during clearing.',
      continueMonitoring: 'Continue monitoring historical trend and keep scheduled maintenance.',
      clogDetectedLabel: 'Clog Detected',
      leakDetectedLabel: 'Leak Detected',
      sensorFaultLabel: 'Sensor Fault',
      yes: 'YES',
      no: 'NO',
      clearingCycle: 'Clearing Cycle',
      activeState: 'ACTIVE',
      idleState: 'IDLE',
      b1StreamLast: 'B1 stream - Last',
      readings: 'readings',
      flow: 'Flow',
      branchNode: 'Branch Node',
      placeholder: 'PLACEHOLDER',
      noSensorsInstalled: 'No sensors installed - Reserved for future expansion',
      clogRuleDetectedPrefix: 'Clog detected by rule: Flow Difference',
      exceeds: '>',
      leakMainLine: 'Leak detected in main pipeline',
      sensorCalibration: 'Sensor fault requires calibration check',
    },
    hi: {
      systemHealth: 'सिस्टम स्वास्थ्य अवलोकन',
      liveLastUpdate: 'लाइव - अंतिम अपडेट',
      minutesAgo: 'मिनट पहले',
      sensorsOk: 'सेंसर ठीक',
      leakDetected: 'रिसाव मिला',
      noLeak: 'कोई रिसाव नहीं',
      clogStatus: 'रुकावट स्थिति',
      clear: 'साफ',
      clog: 'रुकावट',
      branchAttention: 'प्रवाह अंतर सीमा से अधिक',
      branchClear: 'सभी शाखाएं साफ',
      activeAlerts: 'सक्रिय अलर्ट',
      pending: 'लंबित',
      clogRiskIndex: 'रुकावट जोखिम सूचकांक',
      lowRisk: 'कम जोखिम',
      mediumRisk: 'मध्यम',
      highRisk: 'उच्च जोखिम',
      liveSensorData: 'लाइव सेंसर डेटा',
      live: 'लाइव',
      aiInsights: 'AI अंतर्दृष्टि',
      recommendedAction: 'अनुशंसित कार्रवाई',
      realTimeAnalytics: 'रीयल-टाइम विश्लेषण',
      branchNodes: 'ब्रांच नोड्स',
      checkConnection: 'कनेक्शन जांचें',
      active: 'सक्रिय',
      flowRate: 'प्रवाह दर',
      checkB1: 'B1 शून्य है - B1 सेंसर और वायरिंग जांचें',
      activeAlertsTitle: 'सक्रिय अलर्ट',
      allClear: 'सब ठीक',
      noActiveAlerts: 'कोई सक्रिय अलर्ट नहीं',
      refreshText: 'हर 5 सेकंड में ऑटो-रिफ्रेश - डिवाइस ID:',
      cannotLoad: 'डिवाइस डेटा लोड नहीं हुआ',
      retry: 'पुनः प्रयास',
      criticalAlert: 'गंभीर अलर्ट: तुरंत ध्यान दें। नीचे रुकावट और सेंसर स्थिति जांचें।',
      clogRuleAlert: 'प्रवाह अंतर > 40%: रुकावट मिली। 20 सेकंड के लिए CLEARING MODE सक्रिय है।',
      leakPipeline: 'मुख्य पाइपलाइन में रिसाव मिला। तुरंत निरीक्षण करें।',
      b1ZeroWarn: 'B1 प्रवाह 0 है। जारी रखने से पहले B1 कनेक्शन/सेंसर जांचें।',
      sensorFaultWarn: 'सेंसर खराबी मिली। सेंसर केबल और कैलिब्रेशन जांचें।',
      systemMode: 'सिस्टम मोड',
      clearingSub: 'एसिड क्लियरिंग चक्र सक्रिय',
      monitoringSub: 'सक्रिय निगरानी',
      clogRisk: 'रुकावट जोखिम',
      ruleText: 'नियम: प्रारंभ प्रवाह - अंत प्रवाह',
      b1Flow: 'B1 प्रवाह',
      b1CheckSub: 'B1 कनेक्शन जांचें',
      b1ActiveSub: 'L/min - सक्रिय शाखा',
      phOptimal: 'उत्तम: 5.5 - 7.5',
      systemNominal: 'सिस्टम सामान्य',
      aiConfidence: 'AI भरोसा',
      timeToFailure: 'विफलता समय',
      clearing: 'सफाई',
      watch: 'निगरानी',
      stable: 'स्थिर',
      firebaseValue: 'Firebase से लाइव मान',
      confidence: 'भरोसा',
      low: 'कम',
      medium: 'मध्यम',
      high: 'उच्च',
      clearingAction: '20 सेकंड के लिए एसिड इंजेक्शन और फ्लश ट्रिगर किया गया है। मुख्य लाइन चालू रहती है।',
      continueMonitoring: 'ऐतिहासिक प्रवृत्ति की निगरानी जारी रखें और रखरखाव करें।',
      clogDetectedLabel: 'रुकावट मिली',
      leakDetectedLabel: 'रिसाव मिला',
      sensorFaultLabel: 'सेंसर खराबी',
      yes: 'हाँ',
      no: 'नहीं',
      clearingCycle: 'क्लियरिंग चक्र',
      activeState: 'सक्रिय',
      idleState: 'निष्क्रिय',
      b1StreamLast: 'B1 स्ट्रीम - अंतिम',
      readings: 'रीडिंग',
      flow: 'प्रवाह',
      branchNode: 'ब्रांच नोड',
      placeholder: 'प्लेसहोल्डर',
      noSensorsInstalled: 'कोई सेंसर नहीं - भविष्य विस्तार हेतु सुरक्षित',
      clogRuleDetectedPrefix: 'नियम से रुकावट मिली: प्रवाह अंतर',
      exceeds: '>',
      leakMainLine: 'मुख्य पाइपलाइन में रिसाव मिला',
      sensorCalibration: 'सेंसर खराबी - कैलिब्रेशन जांचें',
    },
    mr: {
      systemHealth: 'सिस्टम आरोग्य आढावा',
      liveLastUpdate: 'लाईव्ह - शेवटचे अपडेट',
      minutesAgo: 'मिनिटांपूर्वी',
      sensorsOk: 'सेन्सर ठीक',
      leakDetected: 'गळती आढळली',
      noLeak: 'गळती नाही',
      clogStatus: 'अडथळा स्थिती',
      clear: 'स्वच्छ',
      clog: 'अडथळा',
      branchAttention: 'प्रवाह फरक मर्यादेपेक्षा जास्त',
      branchClear: 'सर्व शाखा स्वच्छ',
      activeAlerts: 'सक्रिय अलर्ट',
      pending: 'प्रलंबित',
      clogRiskIndex: 'अडथळा जोखीम निर्देशांक',
      lowRisk: 'कमी जोखीम',
      mediumRisk: 'मध्यम',
      highRisk: 'उच्च जोखीम',
      liveSensorData: 'लाईव्ह सेन्सर डेटा',
      live: 'लाईव्ह',
      aiInsights: 'AI अंतर्दृष्टी',
      recommendedAction: 'शिफारस केलेली कृती',
      realTimeAnalytics: 'रीयल-टाइम विश्लेषण',
      branchNodes: 'ब्रांच नोड्स',
      checkConnection: 'कनेक्शन तपासा',
      active: 'सक्रिय',
      flowRate: 'प्रवाह दर',
      checkB1: 'B1 शून्य आहे - B1 सेन्सर आणि वायरिंग तपासा',
      activeAlertsTitle: 'सक्रिय अलर्ट',
      allClear: 'सर्व ठीक',
      noActiveAlerts: 'सक्रिय अलर्ट नाहीत',
      refreshText: 'प्रत्येक 5 सेकंदांनी ऑटो-रिफ्रेश - डिव्हाइस ID:',
      cannotLoad: 'डिव्हाइस डेटा लोड झाला नाही',
      retry: 'पुन्हा प्रयत्न',
      criticalAlert: 'गंभीर अलर्ट: त्वरित लक्ष द्या. खाली अडथळा आणि सेन्सर स्थिती तपासा.',
      clogRuleAlert: 'प्रवाह फरक > 40%: अडथळा आढळला. 20 सेकंदांसाठी CLEARING MODE सक्रिय.',
      leakPipeline: 'मुख्य पाइपलाइनमध्ये गळती आढळली. त्वरित तपासा.',
      b1ZeroWarn: 'B1 प्रवाह 0 आहे. पुढे जाण्यापूर्वी B1 कनेक्शन/सेन्सर तपासा.',
      sensorFaultWarn: 'सेन्सर बिघाड आढळला. केबल आणि कॅलिब्रेशन तपासा.',
      systemMode: 'सिस्टम मोड',
      clearingSub: 'अॅसिड क्लियरिंग सायकल सक्रिय',
      monitoringSub: 'सक्रिय निरीक्षण',
      clogRisk: 'अडथळा जोखीम',
      ruleText: 'नियम: सुरुवातीचा प्रवाह - शेवटचा प्रवाह',
      b1Flow: 'B1 प्रवाह',
      b1CheckSub: 'B1 कनेक्शन तपासा',
      b1ActiveSub: 'L/min - सक्रिय शाखा',
      phOptimal: 'योग्य: 5.5 - 7.5',
      systemNominal: 'सिस्टम सामान्य',
      aiConfidence: 'AI विश्वास',
      timeToFailure: 'अपयशाची वेळ',
      clearing: 'सफाई',
      watch: 'निरीक्षण',
      stable: 'स्थिर',
      firebaseValue: 'Firebase मधून लाईव्ह मूल्य',
      confidence: 'विश्वास',
      low: 'कमी',
      medium: 'मध्यम',
      high: 'उच्च',
      clearingAction: '20 सेकंदांसाठी अॅसिड इंजेक्शन आणि फ्लश सुरू केला आहे. मुख्य लाइन चालू राहते.',
      continueMonitoring: 'ऐतिहासिक ट्रेंड पाहत रहा आणि नियोजित देखभाल करा.',
      clogDetectedLabel: 'अडथळा आढळला',
      leakDetectedLabel: 'गळती आढळली',
      sensorFaultLabel: 'सेन्सर बिघाड',
      yes: 'होय',
      no: 'नाही',
      clearingCycle: 'क्लियरिंग सायकल',
      activeState: 'सक्रिय',
      idleState: 'निष्क्रिय',
      b1StreamLast: 'B1 स्ट्रीम - शेवटच्या',
      readings: 'रीडिंग',
      flow: 'प्रवाह',
      branchNode: 'ब्रांच नोड',
      placeholder: 'प्लेसहोल्डर',
      noSensorsInstalled: 'सेन्सर नाही - भविष्यातील विस्तारासाठी राखीव',
      clogRuleDetectedPrefix: 'नियमाने अडथळा: प्रवाह फरक',
      exceeds: '>',
      leakMainLine: 'मुख्य पाइपलाइनमध्ये गळती आढळली',
      sensorCalibration: 'सेन्सर बिघाड - कॅलिब्रेशन तपासा',
    },
  }[language]

  const nf = (v: number, options?: Intl.NumberFormatOptions) => formatNumber(language, v, options)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {isLoading ? (
          <DashboardSkeleton />
        ) : !data ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <WifiOff className="w-10 h-10 opacity-40" />
              <p className="font-medium">{viewText.cannotLoad}</p>
              <button onClick={refresh} className="text-sm text-primary hover:underline">{viewText.retry}</button>
            </div>
          </div>
        ) : (
          <>
            {data.status === 'critical' && (
              <AlertBanner level="critical" message={viewText.criticalAlert} />
            )}
            {clogDetectedByRule && (
              <AlertBanner level="critical" message={viewText.clogRuleAlert} />
            )}
            {data.status === 'warning' && (
              <AlertBanner
                level="warning"
                message={
                  data.systemStatus.leakDetected
                    ? viewText.leakPipeline
                    : `${t(language, 'flowDiff')}: ${nf(computedFlowDiff, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                }
              />
            )}
            {b1Disconnected && (
              <AlertBanner level="warning" message={viewText.b1ZeroWarn} />
            )}
            {data.systemStatus.sensorFault && (
              <AlertBanner level="warning" message={viewText.sensorFaultWarn} />
            )}

            <div className="card-base p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{viewText.systemHealth}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border badge-active">
                    <Circle className="w-2.5 h-2.5 fill-current" /> {viewText.sensorsOk}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${data.systemStatus.leakDetected ? 'badge-critical' : 'badge-active'}`}>
                    <Circle className="w-2.5 h-2.5 fill-current" /> {data.systemStatus.leakDetected ? viewText.leakDetected : viewText.noLeak}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
                <StatCard
                  label={viewText.systemMode}
                  value={isClearingCycle ? 'CLEARING' : 'SAMPLING'}
                  sub={isClearingCycle ? viewText.clearingSub : viewText.monitoringSub}
                  icon={Activity}
                  valueClass={isClearingCycle ? 'text-amber-500' : 'text-primary'}
                />
                <StatCard
                  label="Clog Status"
                  value={clogDetectedByRule ? viewText.clog : viewText.clear}
                  sub={clogDetectedByRule ? viewText.branchAttention : viewText.branchClear}
                  icon={Shield}
                  valueClass={clogDetectedByRule ? 'text-red-500' : 'text-emerald-500'}
                />
                <StatCard
                  label={t(language, 'flowDiff')}
                  value={`${nf(computedFlowDiff, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                  sub={viewText.ruleText}
                  icon={AlertTriangle}
                  valueClass={computedFlowDiff > 40 ? 'text-red-500' : computedFlowDiff > 20 ? 'text-amber-500' : 'text-emerald-500'}
                />
                <StatCard
                  label={viewText.b1Flow}
                  value={`${nf(b1Flow !== null && b1Flow !== undefined ? b1Flow : 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
                  sub={b1Disconnected ? viewText.b1CheckSub : viewText.b1ActiveSub}
                  icon={GitBranch}
                  valueClass={b1Disconnected ? 'text-red-500' : 'text-sky-500'}
                />
                <StatCard label={t(language, 'phLevel')} value={nf(data.sensors.ph, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sub={viewText.phOptimal} icon={FlaskConical} valueClass="text-primary" />
                <StatCard
                  label={viewText.activeAlerts}
                  value={`${nf(alertCount)} ${viewText.pending}`}
                  sub={viewText.systemNominal}
                  icon={OctagonAlert}
                  valueClass={hasAlert ? 'text-red-500' : 'text-emerald-500'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="card-base p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{viewText.clogRiskIndex}</h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${clogRisk < 35 ? 'badge-active' : clogRisk < 65 ? 'badge-warning' : 'badge-critical'}`}>
                    {clogRisk < 35 ? viewText.lowRisk : clogRisk < 65 ? viewText.mediumRisk : viewText.highRisk}
                  </span>
                </div>
                <RingMeter value={clogRisk} />
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="card-inset p-3 text-center">
                    <p className="text-xs text-muted-foreground">{viewText.aiConfidence}</p>
                    <p className="text-2xl font-bold tabular-nums">{nf(aiConfidence)}%</p>
                  </div>
                  <div className="card-inset p-3 text-center">
                    <p className="text-xs text-muted-foreground">{viewText.timeToFailure}</p>
                    <p className="text-2xl font-bold">{isClearingCycle ? viewText.clearing : clogRisk > 40 ? viewText.watch : viewText.stable}</p>
                  </div>
                </div>
              </div>

              <div className="card-base p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{viewText.liveSensorData}</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border badge-active">
                    <Circle className="w-2.5 h-2.5 fill-current" /> {viewText.live}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: t(language, 'phLevel'), value: nf(data.sensors.ph, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: 'pH', icon: FlaskConical },
                    { label: t(language, 'turbidity'), value: nf(data.sensors.turbidity, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: 'NTU', icon: Droplets },
                    { label: t(language, 'startFlow'), value: nf(data.sensors.startFlow, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), unit: 'L/min', icon: Activity },
                    { label: t(language, 'endFlow'), value: nf(data.sensors.endFlow, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), unit: 'L/min', icon: Waves },
                    { label: t(language, 'flowDiff'), value: nf(computedFlowDiff, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), unit: '%', icon: Gauge },
                  ].map((item) => (
                    <div key={item.label} className="card-inset p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-primary" strokeWidth={1.8} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{viewText.firebaseValue}</p>
                        </div>
                      </div>
                      <p className="font-bold text-xl tabular-nums">
                        {item.value} <span className="text-xs text-muted-foreground font-medium">{item.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-base p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{viewText.aiInsights}</h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${clogRisk < 35 ? 'badge-active' : clogRisk < 65 ? 'badge-warning' : 'badge-critical'}`}>
                    {clogRisk < 35 ? viewText.low : clogRisk < 65 ? viewText.medium : viewText.high}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{viewText.confidence}: {nf(aiConfidence)}%</p>
                <div className="card-inset p-4 rounded-xl border-primary/20 bg-primary/5 mb-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{viewText.recommendedAction}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {clogDetectedByRule
                          ? viewText.clearingAction
                          : viewText.continueMonitoring}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">{viewText.clogDetectedLabel}</span>
                    <span className={`font-semibold ${clogDetectedByRule ? 'text-red-500' : 'text-emerald-500'}`}>
                      {clogDetectedByRule ? viewText.yes : viewText.no}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">{viewText.leakDetectedLabel}</span>
                    <span className={`font-semibold ${data.systemStatus.leakDetected ? 'text-red-500' : 'text-emerald-500'}`}>
                      {data.systemStatus.leakDetected ? viewText.yes : viewText.no}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">{viewText.sensorFaultLabel}</span>
                    <span className={`font-semibold ${data.systemStatus.sensorFault ? 'text-red-500' : 'text-emerald-500'}`}>
                      {data.systemStatus.sensorFault ? viewText.yes : viewText.no}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-muted-foreground">{viewText.clearingCycle}</span>
                    <span className={`font-semibold ${isClearingCycle ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {isClearingCycle ? `${viewText.activeState}${cycleEndsAt ? ` (${nf(Math.max(0, Math.ceil((cycleEndsAt - Date.now()) / 1000)))}s)` : ''}` : viewText.idleState}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-base p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{viewText.realTimeAnalytics}</h2>
                  <p className="text-sm text-muted-foreground">{viewText.b1StreamLast} {nf(chartData.length)} {viewText.readings}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border badge-active">{viewText.flow}</span>
              </div>

              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={chartData} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.55} />
                  <XAxis dataKey="t" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <ReferenceLine y={15} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Warn', fill: '#f59e0b', fontSize: 10 }} />
                  <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Clog', fill: '#ef4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="startFlow" name="Start Flow (L/min)" stroke="#22c55e" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="endFlow" name="End Flow (L/min)" stroke="#f59e0b" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="flowDiff" name="Flow Diff (%)" stroke="#ef4444" strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="card-base p-5 rounded-2xl">
                <h2 className="text-xl font-semibold mb-4">{viewText.branchNodes}</h2>
                <div className="space-y-3">
                  <div className={`rounded-xl border p-4 ${b1Disconnected ? 'border-red-200/70 dark:border-red-800/40 bg-red-50/40 dark:bg-red-900/10' : 'border-emerald-200/70 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-900/10'}`}>
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <p className="font-semibold">
                        {viewText.branchNode} 1 <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${b1Disconnected ? 'badge-critical' : 'badge-active'}`}>{b1Disconnected ? viewText.checkConnection : viewText.active}</span>
                      </p>
                      <p className={`text-3xl font-bold tabular-nums ${b1Disconnected ? 'text-red-500' : 'text-emerald-500'}`}>
                        {nf(b1Flow !== null && b1Flow !== undefined ? b1Flow : 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm text-muted-foreground">L/min</span>
                      </p>
                    </div>
                    <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                      <div className={`h-full ${b1Disconnected ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.max(8, Math.min(100, ((b1Flow ?? 0) / 60) * 100))}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {b1Disconnected ? viewText.checkB1 : viewText.flowRate}
                    </p>
                  </div>

                  {['B2', 'B3'].map((node) => (
                    <div key={node} className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 opacity-70">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">
                          {viewText.branchNode} {node === 'B2' ? nf(2) : nf(3)}
                          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">{viewText.placeholder}</span>
                        </p>
                        <p className="text-3xl font-bold text-muted-foreground tabular-nums">{nf(0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm">L/min</span></p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{viewText.noSensorsInstalled}</p>
                    </div>
                  ))}
                </div>
              </div>

              <ActuatorControlPanel actuators={data.actuators} language={language} />

              <div className="card-base p-5 rounded-2xl flex flex-col">
                <h2 className="text-xl font-semibold mb-4">{viewText.activeAlertsTitle}</h2>
                {hasAlert ? (
                  <div className="space-y-2">
                    {clogDetectedByRule && (
                      <p className="text-sm px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/70 dark:border-red-800/40">
                        {viewText.clogRuleDetectedPrefix} {nf(computedFlowDiff)}% {viewText.exceeds} {nf(40)}%
                      </p>
                    )}
                    {b1Disconnected && (
                      <p className="text-sm px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                        {viewText.b1ZeroWarn}
                      </p>
                    )}
                    {data.systemStatus.leakDetected && (
                      <p className="text-sm px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/70 dark:border-red-800/40">
                        {viewText.leakMainLine}
                      </p>
                    )}
                    {data.systemStatus.sensorFault && (
                      <p className="text-sm px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                        {viewText.sensorCalibration}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-xl font-semibold">{viewText.allClear}</p>
                    <p className="text-sm text-muted-foreground">{viewText.noActiveAlerts}</p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground pb-2">
              {viewText.refreshText} {data.deviceId}
            </p>
          </>
        )}
      </main>
      <Chatbot language={language} deviceContext={deviceContext} />
    </div>
  )
}
