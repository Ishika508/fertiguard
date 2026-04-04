export type DeviceStatus = 'active' | 'warning' | 'critical'
export type DeviceMode = 'SAMPLING' | 'CLEARING'
export type Language = 'en' | 'hi' | 'mr'

export interface SensorData {
  ph: number
  turbidity: number
  startFlow: number
  endFlow: number
  flowDiff: number
  timestamp: number
}

export interface BranchData {
  B1: number | null
  B2: number | null
  B3: number | null
}

export interface SystemStatus {
  clogDetected: boolean
  clogBranch: string | null
  leakDetected: boolean
  sensorFault: boolean
}

export interface ActuatorState {
  mainSolenoid: boolean
  flushPump: boolean
  acidInjection: boolean
}

export interface DeviceData {
  deviceId: string
  status: DeviceStatus
  mode: DeviceMode
  sensors: SensorData
  branches: BranchData
  systemStatus: SystemStatus
  actuators: ActuatorState
  lastUpdated: number
}

export interface HistoricalPoint {
  time: string
  startFlow: number
  endFlow: number
  ph: number
  turbidity: number
}

function randomInRange(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

export function generateMockData(prevData?: DeviceData): DeviceData {
  const ph = prevData
    ? Math.max(5.5, Math.min(8.0, prevData.sensors.ph + randomInRange(-0.1, 0.1)))
    : randomInRange(6.2, 7.4)

  const turbidity = prevData
    ? Math.max(0.1, Math.min(5.0, prevData.sensors.turbidity + randomInRange(-0.2, 0.3)))
    : randomInRange(0.8, 2.5)

  const startFlow = prevData
    ? Math.max(30, Math.min(80, prevData.sensors.startFlow + randomInRange(-2, 2)))
    : randomInRange(40, 60)

  const endFlow = prevData
    ? Math.max(20, Math.min(startFlow, prevData.sensors.endFlow + randomInRange(-2, 2)))
    : randomInRange(25, 50)

  const flowDiff = parseFloat(
    (((startFlow - endFlow) / startFlow) * 100).toFixed(1)
  )

  const B1 = randomInRange(10, 15)
  const B2 = randomInRange(10, 15)
  const B3 = Math.random() > 0.9 ? null : randomInRange(8, 15)

  const clogDetected = flowDiff > 35
  const leakDetected = startFlow > 55 && endFlow < 20 && !clogDetected
  const sensorFault = turbidity > 4.5 || ph < 5.5 || ph > 8.5

  let clogBranch: string | null = null
  if (clogDetected) {
    const branchVals = [B1 ?? 999, B2 ?? 999, B3 ?? 999]
    const minIdx = branchVals.reduce<number>((minI, b, i) => {
      const minBVal = branchVals[minI]
      return b < minBVal ? i : minI
    }, 0)
    clogBranch = ['B1', 'B2', 'B3'][minIdx]
  }

  const status: DeviceStatus = sensorFault || (clogDetected && leakDetected)
    ? 'critical'
    : clogDetected || leakDetected || flowDiff > 25
    ? 'warning'
    : 'active'

  const mode: DeviceMode = flowDiff > 30 ? 'CLEARING' : 'SAMPLING'

  return {
    deviceId: process.env.NEXT_PUBLIC_DEVICE_ID || 'FG-01',
    status,
    mode,
    sensors: { ph, turbidity, startFlow, endFlow, flowDiff, timestamp: Date.now() },
    branches: { B1, B2, B3 },
    systemStatus: { clogDetected, clogBranch, leakDetected, sensorFault },
    actuators: {
      mainSolenoid: true,
      flushPump: mode === 'CLEARING',
      acidInjection: false,
    },
    lastUpdated: Date.now(),
  }
}

export function generateHistoricalData(points = 20): HistoricalPoint[] {
  const now = Date.now()
  const data: HistoricalPoint[] = []
  let startFlow = 48
  let endFlow = 38

  for (let i = points; i >= 0; i--) {
    startFlow = Math.max(30, Math.min(70, startFlow + randomInRange(-3, 3)))
    endFlow = Math.max(20, Math.min(startFlow - 2, endFlow + randomInRange(-3, 3)))
    const ts = new Date(now - i * 3 * 60 * 1000)
    data.push({
      time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startFlow: parseFloat(startFlow.toFixed(1)),
      endFlow: parseFloat(endFlow.toFixed(1)),
      ph: parseFloat(randomInRange(6.2, 7.4).toFixed(2)),
      turbidity: parseFloat(randomInRange(0.5, 3.5).toFixed(2)),
    })
  }
  return data
}

export function getClogProbability(data: DeviceData): number {
  let score = 0
  if (data.sensors.flowDiff > 20) score += 30
  if (data.sensors.flowDiff > 35) score += 20
  if (data.sensors.turbidity > 2) score += 15
  if (data.sensors.turbidity > 3.5) score += 10
  if (data.sensors.ph < 6 || data.sensors.ph > 7.5) score += 10
  if (data.systemStatus.clogDetected) score += 15
  return Math.min(score, 95)
}

export function getRecommendedAction(data: DeviceData, lang: Language): string {
  const actions: Record<Language, Record<string, string>> = {
    en: {
      flush: 'Acid flush for 2 minutes recommended immediately',
      monitor: 'Monitor flow rates — flush if difference exceeds 30%',
      ok: 'System healthy — continue normal operation',
      fault: 'Check sensor connections and recalibrate',
      leak: 'Inspect main pipeline for physical damage or leaks',
    },
    hi: {
      flush: 'तुरंत 2 मिनट का एसिड फ्लश अनुशंसित',
      monitor: 'प्रवाह दर की निगरानी करें — 30% से अधिक होने पर फ्लश करें',
      ok: 'सिस्टम स्वस्थ — सामान्य संचालन जारी रखें',
      fault: 'सेंसर कनेक्शन जांचें और पुनः कैलिब्रेट करें',
      leak: 'रिसाव के लिए मुख्य पाइपलाइन का निरीक्षण करें',
    },
    mr: {
      flush: 'ताबडतोब 2 मिनिटांचे अॅसिड फ्लश शिफारस केले',
      monitor: 'प्रवाह दर तपासा — 30% पेक्षा जास्त असल्यास फ्लश करा',
      ok: 'सिस्टम निरोगी — सामान्य ऑपरेशन सुरू ठेवा',
      fault: 'सेन्सर कनेक्शन तपासा आणि पुन्हा कॅलिब्रेट करा',
      leak: 'मुख्य पाइपलाइनमध्ये गळती तपासा',
    },
  }
  const a = actions[lang]
  if (data.systemStatus.sensorFault) return a.fault
  if (data.systemStatus.leakDetected) return a.leak
  if (data.systemStatus.clogDetected || data.sensors.flowDiff > 35) return a.flush
  if (data.sensors.flowDiff > 20) return a.monitor
  return a.ok
}
