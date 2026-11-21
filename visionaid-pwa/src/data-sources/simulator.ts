import { STALE_AFTER_MS, isValidDistance, type DeviceSnapshot, type SensorReading } from '../domain/device'

const scenarios = {
  normal: [85, 95, 120],
  'left-obstruction': [85, 35, 120],
  'front-obstruction': [25, 90, 100],
  'sensor-failure': [null, 95, 120],
  stale: [85, 95, 120],
} as const

export type SimulatorScenario = keyof typeof scenarios

export function simulate(scenario: SimulatorScenario, now = Date.now()): DeviceSnapshot {
  const [front, left, right] = scenarios[scenario]
  const stale = scenario === 'stale'

  function reading(direction: SensorReading['direction'], distanceCm: number | null): SensorReading {
    return {
      direction,
      distanceCm,
      status: stale ? 'stale' : isValidDistance(distanceCm) ? 'valid' : 'invalid',
    }
  }

  return {
    source: 'simulator',
    connectionStatus: 'demo',
    receivedAt: stale ? now - STALE_AFTER_MS - 1_000 : now,
    readings: {
      front: reading('front', front),
      left: reading('left', left),
      right: reading('right', right),
    },
  }
}
