/**
 * Firebase Realtime Database integration for FertiGuard
 *
 * Usage:
 *   import { subscribeToDevice, writeActuatorState } from '@/lib/firebaseRTDB'
 *
 * Expected Firebase DB structure:
 *   /devices/FG-01/
 *     sensors/
 *       ph: 6.8
 *       turbidity: 1.2
 *       startFlow: 48.0
 *       endFlow: 30.0
 *       flowDiff: 18.0
 *       timestamp: 1717000000000
 *     branches/
 *       B1: 12.6
 *       B2: 13.0
 *       B3: 11.8
 *     systemStatus/
 *       clogDetected: false
 *       clogBranch: null
 *       leakDetected: false
 *       sensorFault: false
 *     actuators/
 *       mainSolenoid: true
 *       flushPump: false
 *       acidInjection: false
 *     status: "active"
 *     mode: "SAMPLING"
 *     lastUpdated: 1717000000000
 */

import { ref, onValue, set, off, type DatabaseReference } from 'firebase/database'
import { db } from './firebase'
import type { DeviceData, ActuatorState } from './mockData'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
const DEVICE_PATH_TEMPLATE = process.env.NEXT_PUBLIC_FIREBASE_DEVICE_PATH || 'devices/{deviceId}'

function resolveDevicePath(deviceId: string): string {
  return DEVICE_PATH_TEMPLATE.replace('{deviceId}', deviceId)
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === 'true' || v === '1' || v === 'yes') return true
    if (v === 'false' || v === '0' || v === 'no' || v === '') return false
  }
  return fallback
}

function readSensorNumber(raw: any, keys: string[], fallback: number): number {
  for (const key of keys) {
    const [root, child] = key.split('.')
    const v = child ? raw?.[root]?.[child] : raw?.[root]
    if (v !== undefined && v !== null && v !== '') {
      return toNumber(v, fallback)
    }
  }
  return fallback
}

function readBranchFlow(branches: any, key: 'B1' | 'B2' | 'B3'): number | null {
  const node = branches?.[key] ?? branches?.[key.toLowerCase()] ?? branches?.[key.replace('B', 'branch')]
  if (node == null) return null
  if (typeof node === 'number' || typeof node === 'string') return toNumber(node, 0)
  if (typeof node === 'object') {
    const v = node.flow ?? node.value ?? node.rate ?? node.lpm ?? node.lph
    return v == null ? null : toNumber(v, 0)
  }
  return null
}

/**
 * Subscribe to real-time device data from Firebase.
 * Falls back to mock data in DEMO_MODE.
 */
export function subscribeToDevice(
  deviceId: string,
  callback: (data: DeviceData) => void,
  onError?: (err: Error) => void
): () => void {
  if (DEMO_MODE) {
    // In demo mode, return a no-op unsubscribe
    console.info('[FertiGuard] Demo mode: using mock data, not Firebase')
    return () => {}
  }

  const deviceRef: DatabaseReference = ref(db, resolveDevicePath(deviceId))

  onValue(
    deviceRef,
    (snapshot) => {
      const raw = snapshot.val()
      if (!raw) {
        onError?.(new Error(`No data found for device ${deviceId}`))
        return
      }

      // Map Firebase structure → DeviceData
      const statusSrc = raw.systemStatus ?? raw.systemState ?? {}
      const clogDetected = toBoolean(statusSrc.clogDetected, false)
      const leakDetected = toBoolean(statusSrc.leakDetected, false)
      const sensorFault = toBoolean(statusSrc.sensorFault, false)
      const startFlow = readSensorNumber(raw, ['sensors.startFlow', 'sensors.start_flow', 'startFlow', 'start_flow'], 48.0)
      const endFlow = readSensorNumber(raw, ['sensors.endFlow', 'sensors.end_flow', 'endFlow', 'end_flow'], 40.0)
      const flowDiffFromDb = readSensorNumber(raw, ['sensors.flowDiff', 'sensors.flow_diff', 'flowDiff', 'flow_diff'], Number.NaN)
      const flowDiff = Number.isFinite(flowDiffFromDb) ? flowDiffFromDb : Number((startFlow - endFlow).toFixed(1))

      const mapped: DeviceData = {
        deviceId: deviceId,
        status: raw.status ?? (clogDetected || sensorFault || leakDetected ? 'warning' : 'active'),
        mode: raw.mode ?? statusSrc.mode ?? 'SAMPLING',
        sensors: {
          ph: readSensorNumber(raw, ['sensors.ph', 'ph'], 7.0),
          turbidity: readSensorNumber(raw, ['sensors.turbidity', 'turbidity'], 1.0),
          startFlow,
          endFlow,
          flowDiff,
          timestamp: readSensorNumber(raw, ['sensors.timestamp', 'timestamp', 'lastUpdated', 'updatedAt'], Date.now()),
        },
        branches: {
          B1: readBranchFlow(raw.branches, 'B1'),
          B2: readBranchFlow(raw.branches, 'B2'),
          B3: readBranchFlow(raw.branches, 'B3'),
        },
        systemStatus: {
          clogDetected,
          clogBranch: statusSrc.clogBranch ?? null,
          leakDetected,
          sensorFault,
        },
        actuators: {
          mainSolenoid: raw.actuators?.mainSolenoid ?? true,
          flushPump: raw.actuators?.flushPump ?? false,
          acidInjection: raw.actuators?.acidInjection ?? false,
        },
        lastUpdated: toNumber(raw.lastUpdated ?? raw.timestamp, Date.now()),
      }

      callback(mapped)
    },
    (error) => {
      console.error('[FertiGuard] Firebase read error:', error)
      onError?.(error)
    }
  )

  // Return unsubscribe function
  return () => off(deviceRef)
}

/**
 * Write actuator state back to Firebase.
 * Used when farmer presses control buttons.
 */
export async function writeActuatorState(
  deviceId: string,
  actuators: Partial<ActuatorState>
): Promise<void> {
  if (DEMO_MODE) {
    console.info('[FertiGuard] Demo mode: actuator write skipped', actuators)
    return
  }

  const actuatorRef = ref(db, `${resolveDevicePath(deviceId)}/actuators`)
  await set(actuatorRef, actuators)
}

/**
 * Write a command to the device command queue.
 * The ESP32/microcontroller reads from this path.
 */
export async function sendDeviceCommand(
  deviceId: string,
  command: 'START_FLUSH' | 'STOP_FLUSH' | 'MANUAL_OVERRIDE' | 'RESET'
): Promise<void> {
  if (DEMO_MODE) {
    console.info('[FertiGuard] Demo mode: command skipped:', command)
    return
  }

  const cmdRef = ref(db, `${resolveDevicePath(deviceId)}/command`)
  await set(cmdRef, {
    action: command,
    timestamp: Date.now(),
    acknowledged: false,
  })
}
