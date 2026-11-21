export interface LocationSample {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export type LocationError = 'denied' | 'unavailable' | 'timeout'

export interface LocationProvider {
  start(onSample: (sample: LocationSample) => void, onError: (error: LocationError, terminal: boolean) => void): () => void
}

export const LOCATION_STALE_MS = 30_000

export function isValidLocation(sample: LocationSample, now = Date.now()) {
  return Number.isFinite(sample.latitude) && Math.abs(sample.latitude) <= 90
    && Number.isFinite(sample.longitude) && Math.abs(sample.longitude) <= 180
    && Number.isFinite(sample.accuracy) && sample.accuracy >= 0
    && Number.isFinite(sample.timestamp) && sample.timestamp > 0 && sample.timestamp <= now
}

export function browserLocationProvider(geolocation: Geolocation): LocationProvider {
  const options: PositionOptions = { enableHighAccuracy: false, maximumAge: 5_000, timeout: 15_000 }

  return {
    start(onSample, onError) {
      let stopped = false
      let watching = false
      let watchId: number | undefined
      const stop = () => {
        stopped = true
        if (watchId !== undefined) geolocation.clearWatch(watchId)
        watchId = undefined
      }
      const failure = ({ code }: GeolocationPositionError) => {
        if (stopped) return
        const error = code === 1 ? 'denied' : code === 3 ? 'timeout' : 'unavailable'
        const terminal = error === 'denied' || !watching
        if (terminal) stop()
        onError(error, terminal)
      }
      const success = ({ coords, timestamp }: GeolocationPosition) => {
        if (stopped) return
        const { latitude, longitude, accuracy } = coords
        onSample({ latitude, longitude, accuracy, timestamp })
      }

      geolocation.getCurrentPosition((position) => {
        if (stopped) return
        success(position)
        try {
          watching = true
          const id = geolocation.watchPosition(success, failure, options)
          if (stopped) geolocation.clearWatch(id)
          else watchId = id
        } catch {
          stop()
          onError('unavailable', true)
        }
      }, failure, options)
      return stop
    },
  }
}

// A short illustrative route in Monrovia. These points are synthetic.
export const demoRoute: readonly [number, number][] = [
  [6.303, -10.799], [6.3034, -10.7988], [6.3038, -10.7986],
  [6.304, -10.7982], [6.3043, -10.7979],
]

export function demoLocationProvider(): LocationProvider {
  let index = 0
  return {
    start(onSample) {
      function emit() {
        const [latitude, longitude] = demoRoute[index]
        onSample({ latitude, longitude, accuracy: 12, timestamp: Date.now() })
      }
      emit()
      const timer = setInterval(() => {
        index = (index + 1) % demoRoute.length
        emit()
      }, 2_000)
      return () => clearInterval(timer)
    },
  }
}
