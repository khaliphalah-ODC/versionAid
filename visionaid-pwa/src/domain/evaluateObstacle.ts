import {
  isValidDistance,
  OBSTACLE_THRESHOLD_CM,
  sensorDirections,
  snapshotStatus,
  type DeviceSnapshot,
  type SensorDirection,
} from './device'

interface Obstacle {
  direction: SensorDirection
  distanceCm: number
}

export type Evaluation =
  | { status: 'obstacle'; obstacles: Obstacle[] }
  | { status: 'none-detected' }
  | { status: 'unknown'; reason: 'incomplete' | 'stale' | 'unavailable' }

export function evaluateObstacle(snapshot: DeviceSnapshot, now = Date.now()): Evaluation {
  const freshness = snapshotStatus(snapshot, now)
  if (freshness !== 'fresh') return { status: 'unknown', reason: freshness }

  const obstacles: Obstacle[] = []
  let incomplete = false

  for (const direction of sensorDirections) {
    const { status, distanceCm } = snapshot.readings[direction]
    if (status !== 'valid' || !isValidDistance(distanceCm)) {
      incomplete = true
    } else if (distanceCm < OBSTACLE_THRESHOLD_CM) {
      obstacles.push({ direction, distanceCm })
    }
  }

  if (obstacles.length) return { status: 'obstacle', obstacles }
  if (incomplete) return { status: 'unknown', reason: 'incomplete' }
  return { status: 'none-detected' }
}
