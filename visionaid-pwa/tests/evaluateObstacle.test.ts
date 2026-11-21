import { describe, expect, it } from 'vitest'
import { simulate } from '../src/data-sources/simulator'
import { STALE_AFTER_MS } from '../src/domain/device'
import { evaluateObstacle } from '../src/domain/evaluateObstacle'

const now = 50_000

describe('evaluateObstacle', () => {
  it('detects a front obstacle', () => {
    expect(evaluateObstacle(simulate('front-obstruction', now), now)).toEqual({
      status: 'obstacle',
      obstacles: [{ direction: 'front', distanceCm: 25 }],
    })
  })

  it('detects a left obstacle even when another sensor fails', () => {
    const snapshot = simulate('left-obstruction', now)
    snapshot.readings.front = { direction: 'front', distanceCm: null, status: 'invalid' }
    expect(evaluateObstacle(snapshot, now)).toEqual({
      status: 'obstacle',
      obstacles: [{ direction: 'left', distanceCm: 35 }],
    })
  })

  it('reports no detected obstacle when every reading is fresh and at least 50 cm', () => {
    const snapshot = simulate('normal', now)
    snapshot.readings.front.distanceCm = 50
    expect(evaluateObstacle(snapshot, now)).toEqual({ status: 'none-detected' })
  })

  it('treats a simulated sensor failure as unknown', () => {
    expect(evaluateObstacle(simulate('sensor-failure', now), now)).toEqual({
      status: 'unknown',
      reason: 'incomplete',
    })
  })

  it.each([null, -1, NaN, Infinity])('rejects invalid numeric samples (%s)', (distanceCm) => {
    const snapshot = simulate('normal', now)
    snapshot.readings.front.distanceCm = distanceCm
    expect(evaluateObstacle(snapshot, now)).toEqual({ status: 'unknown', reason: 'incomplete' })
  })

  it('rejects stale data, including a previously detected obstacle', () => {
    expect(evaluateObstacle(simulate('stale', now), now)).toEqual({ status: 'unknown', reason: 'stale' })
    const snapshot = simulate('front-obstruction', now)
    expect(evaluateObstacle(snapshot, now + STALE_AFTER_MS + 1)).toEqual({
      status: 'unknown',
      reason: 'stale',
    })
  })

  it('rejects readings from an unavailable connection', () => {
    const snapshot = simulate('normal', now)
    snapshot.source = 'bluetooth'
    snapshot.connectionStatus = 'disconnected'
    expect(evaluateObstacle(snapshot, now)).toEqual({ status: 'unknown', reason: 'unavailable' })
  })
})
