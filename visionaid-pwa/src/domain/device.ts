export const sensorDirections = ['front', 'left', 'right'] as const

export type SensorDirection = (typeof sensorDirections)[number]
export type ConnectionStatus =
  | 'demo'
  | 'unsupported'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export interface SensorReading {
  direction: SensorDirection
  distanceCm: number | null
  status: 'valid' | 'invalid' | 'stale'
}

export interface DeviceSnapshot {
  source: 'simulator' | 'bluetooth'
  connectionStatus: ConnectionStatus
  readings: Record<SensorDirection, SensorReading>
  receivedAt: number
  deviceId?: string
  batteryPercent?: number
}

export const OBSTACLE_THRESHOLD_CM = 50
export const STALE_AFTER_MS = 3_000

export function isValidDistance(distance: number | null): distance is number {
  return distance !== null && Number.isFinite(distance) && distance >= 0
}

export function snapshotStatus(snapshot: DeviceSnapshot, now: number) {
  const expectedStatus = snapshot.source === 'simulator' ? 'demo' : 'connected'
  if (snapshot.connectionStatus !== expectedStatus) return 'unavailable'

  const age = now - snapshot.receivedAt
  if (!Number.isFinite(age) || age < 0) return 'unavailable'
  return age > STALE_AFTER_MS ? 'stale' : 'fresh'
}
