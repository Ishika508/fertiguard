'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatbotProps {
  language: Language
  deviceContext?: string
}

const CHAT_ERRORS: Record<Language, string> = {
  en: 'Connection issue. Please check chat or ML service status and try again.',
  hi: 'कनेक्शन समस्या है। कृपया चैट या ML सेवा जांचकर फिर प्रयास करें।',
  mr: 'कनेक्शन समस्या आहे. कृपया चॅट किंवा ML सेवा तपासून पुन्हा प्रयत्न करा.',
}

export function Chatbot({ language, deviceContext }: ChatbotProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [speechSupported, setSpeechSupported] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const chooseVoice = (voices: SpeechSynthesisVoice[], lang: Language) => {
    const target = getSpeechLang(lang).toLowerCase()
    const exact = voices.find((v) => v.lang.toLowerCase() === target)
    if (exact) return exact

    const primary = target.split('-')[0]
    const sameFamily = voices.find((v) => v.lang.toLowerCase().startsWith(primary))
    if (sameFamily) return sameFamily

    return voices.find((v) => v.default) ?? null
  }

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: '0',
        role: 'assistant',
        content: t(language, 'chatWelcome'),
        timestamp: new Date(),
      }])
    }
  }, [open, language, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const w = window as any
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript
      if (transcript) {
        setInput((prev) => `${prev}${prev ? ' ' : ''}${transcript}`)
      }
    }

    recognitionRef.current = recognition
    setSpeechSupported(true)

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const getSpeechLang = (lang: Language) => {
    if (lang === 'hi') return 'hi-IN'
    if (lang === 'mr') return 'mr-IN'
    return 'en-IN'
  }

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return
    const synth = window.speechSynthesis
    synth.cancel()

    const cleanText = text
      .replace(/[`*_>#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = getSpeechLang(language)
    utterance.rate = 0.95
    utterance.pitch = 1

    const voices = synth.getVoices()
    const selectedVoice = chooseVoice(voices, language)
    if (selectedVoice) utterance.voice = selectedVoice

    synth.speak(utterance)
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return
    recognitionRef.current.lang = getSpeechLang(language)
    if (isListening) {
      recognitionRef.current.stop()
      return
    }
    recognitionRef.current.start()
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language,
        },
        body: JSON.stringify({
          message: userMsg.content,
          language,
          deviceContext,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        throw new Error(data?.response || data?.error || CHAT_ERRORS[language])
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || CHAT_ERRORS[language],
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMsg])
      speakText(botMsg.content)
    } catch {
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: CHAT_ERRORS[language],
        timestamp: new Date(),
      } as Message
      setMessages(prev => [...prev, errMsg])
      speakText(errMsg.content)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300',
          open ? 'bg-red-500 hover:bg-red-600 rotate-0' : 'bg-primary hover:bg-primary/90 rotate-0'
        )}
        aria-label="Toggle chat"
      >
        {open
          ? <X className="w-5 h-5 text-white" />
          : <MessageCircle className="w-5 h-5 text-white" />
        }
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[480px] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden chat-panel">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-primary/5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{t(language, 'chatTitle')}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setSpeechEnabled((prev) => !prev)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                title={speechEnabled ? 'Disable voice reply' : 'Enable voice reply'}
                type="button"
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  msg.role === 'user' ? 'bg-primary/20' : 'bg-primary'
                )}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-primary" />
                    : <Bot className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <div className={cn(
                  'max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(language, 'chatPlaceholder')}
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
              {speechSupported && (
                <button
                  onClick={toggleListening}
                  type="button"
                  className={cn(
                    'p-2 rounded-xl transition-colors border',
                    isListening
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-muted/60 text-foreground border-border hover:bg-muted'
                  )}
                  title={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
