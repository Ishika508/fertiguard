import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'

type Language = 'en' | 'hi' | 'mr'

type DeviceContext = {
  ph?: number
  turbidity?: number
  startFlow?: number
  endFlow?: number
  flowDiff?: number
  clogDetected?: boolean
  leakDetected?: boolean
  sensorFault?: boolean
  status?: string
  mode?: string
  branches?: Record<string, unknown>
  [key: string]: unknown
}

type MlInsight = {
  clogProbability: number
  recommendedAction: string
  anomaly: number
  anomalyType: string
  severity: string
  reason: string
  confidence: number
}

function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function parseDeviceContext(input: unknown): DeviceContext | null {
  if (!input) return null
  if (typeof input === 'object') return input as DeviceContext
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      if (parsed && typeof parsed === 'object') return parsed as DeviceContext
    } catch {
      return null
    }
  }
  return null
}

function detectIntent(message: string): 'flow' | 'clog' | 'ph' | 'turbidity' | 'leak' | 'sensor' | 'default' {
  const lower = message.toLowerCase()
  if (lower.includes('flow') || lower.includes('प्रवाह')) return 'flow'
  if (lower.includes('clog') || lower.includes('block') || lower.includes('रुकावट') || lower.includes('अडथळा')) return 'clog'
  if (lower.includes('ph') || lower.includes('acid') || lower.includes('alkalin')) return 'ph'
  if (lower.includes('turbid') || lower.includes('murky') || lower.includes('गंदल') || lower.includes('गढूळ')) return 'turbidity'
  if (lower.includes('leak') || lower.includes('रिसाव') || lower.includes('गळती')) return 'leak'
  if (lower.includes('sensor') || lower.includes('fault') || lower.includes('सेंसर') || lower.includes('सेन्सर')) return 'sensor'
  return 'default'
}

function buildMlPayloadFromContext(ctx: DeviceContext): Record<string, unknown> | null {
  const ph = asNumber(ctx.ph)
  const turbidity = asNumber(ctx.turbidity)
  const startFlow = asNumber(ctx.startFlow)
  const endFlow = asNumber(ctx.endFlow)
  if (ph === null || turbidity === null || startFlow === null || endFlow === null) return null

  return {
    sensors: {
      ph,
      turbidity,
      startFlow,
      endFlow,
    },
    branches: ctx.branches && typeof ctx.branches === 'object' ? ctx.branches : {},
  }
}

function runMlPredictionFromContext(ctx: DeviceContext): Promise<MlInsight | null> {
  const payload = buildMlPayloadFromContext(ctx)
  if (!payload) return Promise.resolve(null)

  return new Promise((resolve) => {
    const py = spawn('python', ['ml/predict.py', JSON.stringify(payload)], { cwd: process.cwd() })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      py.kill()
      resolve(null)
    }, 5000)

    py.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    py.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    py.on('error', () => {
      clearTimeout(timer)
      resolve(null)
    })

    py.on('close', () => {
      clearTimeout(timer)
      if (!stdout || stderr.trim()) {
        resolve(null)
        return
      }
      try {
        resolve(JSON.parse(stdout) as MlInsight)
      } catch {
        resolve(null)
      }
    })
  })
}

function likelyWrongLanguage(text: string, language: Language): boolean {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length
  const latin = (text.match(/[A-Za-z]/g) || []).length
  const englishWordCount = (text.match(/\b[A-Za-z]{3,}\b/g) || []).length
  if (language === 'en') return devanagari > 10 && latin < 8
  return (devanagari < 8 && latin > 20) || englishWordCount > 10
}

function fallbackByContext(message: string, language: Language, ctx: DeviceContext | null, ml: MlInsight | null): string {
  const intent = detectIntent(message)
  const flowDiff = asNumber(ctx?.flowDiff) ?? (() => {
    const start = asNumber(ctx?.startFlow)
    const end = asNumber(ctx?.endFlow)
    if (start === null || end === null || start <= 0) return null
    return Number((((start - end) / start) * 100).toFixed(1))
  })()
  const clogProbability = typeof ml?.clogProbability === 'number' ? Number(ml.clogProbability.toFixed(1)) : null
  const confidence = typeof ml?.confidence === 'number' ? Math.round(ml.confidence * 100) : null
  const ph = asNumber(ctx?.ph)
  const turbidity = asNumber(ctx?.turbidity)
  const leak = Boolean(ctx?.leakDetected)
  const sensorFault = Boolean(ctx?.sensorFault)
  const clogDetected = Boolean(ctx?.clogDetected)

  if (language === 'hi') {
    if (intent === 'ph') {
      return `अभी pH ${ph ?? 'उपलब्ध नहीं'} है। आदर्श सीमा 5.5 से 7.5 है, इसलिए सीमा से बाहर हो तो धीरे-धीरे समायोजन करें और 30 मिनट बाद फिर जांचें।`
    }
    if (intent === 'turbidity') {
      return `अभी गंदलापन ${turbidity ?? 'उपलब्ध नहीं'} NTU है। मान अधिक होने पर लाइन फ्लश करें और फिल्टर की सफाई करें ताकि ड्रिप एमिटर ब्लॉक न हों।`
    }
    if (intent === 'leak' || leak) {
      return `लीकेज संकेत ${leak ? 'मिला है' : 'स्पष्ट नहीं है'}। मुख्य पाइप और जॉइंट तुरंत जांचें, और आवश्यकता हो तो मुख्य सोलिनॉयड बंद करके निरीक्षण करें।`
    }
    if (intent === 'sensor' || sensorFault) {
      return `सेंसर फॉल्ट ${sensorFault ? 'डिटेक्ट हुआ है' : 'स्पष्ट नहीं है'}। केबल कनेक्शन, सेंसर सफाई और कैलिब्रेशन तुरंत जांचें।`
    }
    if (intent === 'clog' || intent === 'flow') {
      return `वर्तमान Flow Difference ${flowDiff ?? 'उपलब्ध नहीं'}% है और ML clog probability ${clogProbability ?? 'उपलब्ध नहीं'}% है। ${clogDetected || (flowDiff !== null && flowDiff > 40) ? 'क्लॉग जोखिम अधिक है, 20 सेकंड क्लियरिंग/एसिड फ्लश तुरंत चलाएं।' : 'जोखिम नियंत्रित है, लेकिन B1 शाखा और फ्लो ट्रेंड पर निगरानी रखें।'}${confidence !== null ? ` मॉडल भरोसा लगभग ${confidence}% है।` : ''}`
    }
    return `मैं आपके लाइव डैशबोर्ड और ML संकेतों के आधार पर जवाब देता हूं। अभी Flow Difference ${flowDiff ?? 'उपलब्ध नहीं'}% और clog probability ${clogProbability ?? 'उपलब्ध नहीं'}% है, इसलिए सिस्टम को उसी अनुसार मॉनिटर करें।`
  }

  if (language === 'mr') {
    if (intent === 'ph') {
      return `आताचा pH ${ph ?? 'उपलब्ध नाही'} आहे। आदर्श श्रेणी 5.5 ते 7.5 आहे, त्यामुळे बाहेर असल्यास टप्प्याटप्प्याने समायोजन करा आणि 30 मिनिटांनी पुन्हा तपासा।`
    }
    if (intent === 'turbidity') {
      return `आताचा गढूळपणा ${turbidity ?? 'उपलब्ध नाही'} NTU आहे। मूल्य जास्त असल्यास लाइन फ्लश करा आणि फिल्टर स्वच्छ करा, म्हणजे एमिटर ब्लॉक होणार नाहीत।`
    }
    if (intent === 'leak' || leak) {
      return `गळती संकेत ${leak ? 'आढळले आहेत' : 'स्पष्ट नाहीत'}। मुख्य पाइपलाइन आणि जोड तातडीने तपासा, आणि गरज असल्यास मुख्य सोलेनॉइड बंद करून प्रत्यक्ष तपासणी करा।`
    }
    if (intent === 'sensor' || sensorFault) {
      return `सेन्सर फॉल्ट ${sensorFault ? 'आढळला आहे' : 'स्पष्ट नाही'}। केबल कनेक्शन, सेन्सर स्वच्छता आणि कॅलिब्रेशन लगेच तपासा।`
    }
    if (intent === 'clog' || intent === 'flow') {
      return `सध्याचा Flow Difference ${flowDiff ?? 'उपलब्ध नाही'}% आणि ML clog probability ${clogProbability ?? 'उपलब्ध नाही'}% आहे। ${clogDetected || (flowDiff !== null && flowDiff > 40) ? 'क्लॉग धोका जास्त आहे, 20 सेकंद clearing/acid flush लगेच चालवा।' : 'धोका नियंत्रित आहे, पण B1 शाखा आणि फ्लो ट्रेंडवर लक्ष ठेवा।'}${confidence !== null ? ` मॉडेल विश्वास सुमारे ${confidence}% आहे।` : ''}`
    }
    return `मी लाईव्ह डॅशबोर्ड आणि ML मूल्यांवर आधारित उत्तर देतो। सध्या Flow Difference ${flowDiff ?? 'उपलब्ध नाही'}% आणि clog probability ${clogProbability ?? 'उपलब्ध नाही'}% आहे, त्यामुळे त्यानुसार निरीक्षण ठेवा।`
  }

  if (intent === 'ph') {
    return `Current pH is ${ph ?? 'not available'}. Keep it within 5.5 to 7.5 for stable nutrient uptake, and make gradual correction before rechecking.`
  }
  if (intent === 'turbidity') {
    return `Current turbidity is ${turbidity ?? 'not available'} NTU. If it is rising, flush lines and clean filters to prevent emitter blockage.`
  }
  if (intent === 'leak' || leak) {
    return `Leak signal is ${leak ? 'active' : 'not clearly active'}. Inspect main pipeline joints immediately and isolate the main solenoid during physical checks.`
  }
  if (intent === 'sensor' || sensorFault) {
    return `Sensor fault status is ${sensorFault ? 'active' : 'not clearly active'}. Verify wiring, clean probes, and recalibrate affected sensors.`
  }
  if (intent === 'clog' || intent === 'flow') {
    return `Current flow difference is ${flowDiff ?? 'not available'}% and ML clog probability is ${clogProbability ?? 'not available'}%. ${clogDetected || (flowDiff !== null && flowDiff > 40) ? 'Clog risk is high, so run an immediate clearing or acid flush cycle.' : 'Risk is moderate to low, so continue monitoring branch B1 and flow trend.'}${confidence !== null ? ` Model confidence is about ${confidence}%.` : ''}`
  }

  return `I use your live dashboard and ML values for guidance. Right now flow difference is ${flowDiff ?? 'not available'}% and clog probability is ${clogProbability ?? 'not available'}%, so actions should follow this risk level.`
}

export async function POST(req: NextRequest) {
  let language: Language = 'en'
  try {
    const payload = await req.json()
    const message = typeof payload?.message === 'string' ? payload.message : ''
    language = payload?.language === 'hi' || payload?.language === 'mr' ? payload.language : 'en'
    const deviceContext = parseDeviceContext(payload?.deviceContext)
    const history = Array.isArray(payload?.history) ? payload.history : []
    const mlInsight = deviceContext ? await runMlPredictionFromContext(deviceContext) : null

    if (!message.trim()) {
      return NextResponse.json({ response: fallbackByContext('', language, deviceContext, mlInsight), source: 'fallback' })
    }

    const langName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'
    const langCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN'

    const systemPrompt = `You are FertiGuard Assistant, an expert in fertigation systems, drip irrigation, and agricultural IoT.

Current device context (JSON): ${JSON.stringify(deviceContext ?? { note: 'No live data available' })}
Current ML context (JSON): ${JSON.stringify(mlInsight ?? { note: 'ML insight not available' })}

Instructions:
- Respond ONLY in ${langName} (${langCode})
- Never switch to another language unless user explicitly asks
- Keep common technical terms as-is only when needed (example: pH)
- Keep responses short (2-4 sentences max) and farmer-friendly
- Focus on practical, actionable advice
- Use simple language that farmers can understand
- If clog probability or flow difference is high, recommend immediate flushing
- Quote the live numeric values when relevant (flowDiff, pH, turbidity, clogProbability, confidence)
- If value is missing, say it is unavailable instead of guessing`

    const ollamaMessages = [
      ...history,
      { role: 'user', content: message }
    ]

    // Try Ollama first
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...ollamaMessages,
          ],
          stream: false,
          options: { temperature: 0.7, num_predict: 200 },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (ollamaRes.ok) {
        const data = await ollamaRes.json()
        const response = (data.message?.content || data.response || '').trim()
        if (response) {
          if (likelyWrongLanguage(response, language)) {
            const fallback = fallbackByContext(message, language, deviceContext, mlInsight)
            return NextResponse.json({ response: fallback, source: 'fallback' })
          }
          return NextResponse.json({ response, source: 'ollama' })
        }
      }
    } catch {
      // Ollama not available — use fallback
    }

    const fallback = fallbackByContext(message, language, deviceContext, mlInsight)
    return NextResponse.json({ response: fallback, source: 'fallback' })
  } catch {
    const errorResponse = language === 'hi'
      ? 'अनुरोध प्रोसेस नहीं हो सका। कृपया फिर प्रयास करें।'
      : language === 'mr'
      ? 'विनंती प्रक्रिया झाली नाही। कृपया पुन्हा प्रयत्न करा।'
      : 'Request could not be processed. Please try again.'
    return NextResponse.json(
      { response: errorResponse, source: 'error' },
      { status: 500 }
    )
  }
}
