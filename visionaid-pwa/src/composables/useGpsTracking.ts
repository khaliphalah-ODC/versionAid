import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import {
  browserLocationProvider, demoLocationProvider, isValidLocation, LOCATION_STALE_MS,
  type LocationError, type LocationSample,
} from '../data-sources/location'

type Status = 'idle' | 'requesting' | 'active' | 'stopped' | 'stale'
  | 'unsupported' | 'insecure' | LocationError

export function useGpsTracking() {
  const mode = ref<'real' | 'demo'>('real')
  const status = ref<Status>('idle')
  const running = ref(false)
  const sample = shallowRef<LocationSample>()
  let stopProvider: (() => void) | undefined
  let expiry: ReturnType<typeof setTimeout> | undefined
  let demo = demoLocationProvider()

  function checkFreshness() {
    clearTimeout(expiry)
    if (mode.value !== 'real' || status.value !== 'active' || !sample.value) return
    const remaining = LOCATION_STALE_MS - (Date.now() - sample.value.timestamp)
    if (remaining <= 0) status.value = 'stale'
    else expiry = setTimeout(checkFreshness, remaining)
  }

  function stop() {
    stopProvider?.()
    stopProvider = undefined
    clearTimeout(expiry)
    running.value = false
    status.value = 'stopped'
  }

  function reset() {
    stop()
    sample.value = undefined
    demo = demoLocationProvider()
    status.value = 'idle'
  }

  function selectMode(next: 'real' | 'demo') {
    if (mode.value === next) return
    reset()
    mode.value = next
  }

  function receiveSample(next: LocationSample) {
    if (!isValidLocation(next)) {
      status.value = 'unavailable'
      clearTimeout(expiry)
      return
    }
    if (sample.value && next.timestamp < sample.value.timestamp) return
    sample.value = next
    status.value = 'active'
    checkFreshness()
  }

  function start() {
    if (running.value) return
    if (mode.value === 'real') {
      if (!window.isSecureContext) {
        status.value = 'insecure'
        return
      }
      if (!navigator.geolocation) {
        status.value = 'unsupported'
        return
      }
      sample.value = undefined
    }

    const provider = mode.value === 'demo' ? demo : browserLocationProvider(navigator.geolocation)
    running.value = true
    status.value = 'requesting'
    try {
      stopProvider = provider.start(receiveSample, (error, terminal) => {
        clearTimeout(expiry)
        if (terminal) stop()
        status.value = error
      })
    } catch {
      stop()
      status.value = 'unavailable'
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', checkFreshness)
    window.addEventListener('pagehide', stop)
  })
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', checkFreshness)
    window.removeEventListener('pagehide', stop)
    stop()
  })

  const current = computed(() => status.value === 'active' ? sample.value : undefined)

  return { mode, status, running, sample, current, selectMode, start, stop, reset }
}
