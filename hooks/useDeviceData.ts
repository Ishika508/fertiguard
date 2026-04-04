'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { generateMockData, type DeviceData } from '@/lib/mockData'
import { subscribeToDevice } from '@/lib/firebaseRTDB'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false'
const DEVICE_ID = process.env.NEXT_PUBLIC_DEVICE_ID || 'FG-01'

export function useDeviceData(intervalMs = 5000) {
  const [data, setData] = useState<DeviceData | null>(null)
  const [prevData, setPrevData] = useState<DeviceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRef = useRef<DeviceData | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateData = useCallback((newData: DeviceData) => {
    setPrevData(dataRef.current)
    dataRef.current = newData
    setData(newData)
    setIsLoading(false)
    setError(null)
  }, [])

  const refresh = useCallback(() => {
    const newData = generateMockData(dataRef.current ?? undefined)
    updateData(newData)
  }, [updateData])

  useEffect(() => {
    if (DEMO_MODE) {
      // Simulate initial load delay
      const init = setTimeout(() => {
        refresh()
        intervalRef.current = setInterval(refresh, intervalMs)
      }, 600)
      return () => {
        clearTimeout(init)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }

    // Live Firebase subscription
    const unsubscribe = subscribeToDevice(
      DEVICE_ID,
      updateData,
      (err) => {
        setError('Firebase unavailable — showing simulated data')
        refresh()
        if (!intervalRef.current) {
          intervalRef.current = setInterval(refresh, intervalMs)
        }
      }
    )

    return () => {
      unsubscribe()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [intervalMs, refresh, updateData])

  return { data, prevData, isLoading, error, refresh }
}
