// @vitest-environment jsdom
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GpsTrackingView from '../src/views/GpsTrackingView.vue'
import { LOCATION_STALE_MS } from '../src/data-sources/location'

vi.mock('../src/components/LocationMap.vue', () => ({
  default: defineComponent({
    props: ['point', 'demo', 'showTiles'],
    setup: (props) => () => h('div', { 'data-marker': props.point?.latitude, 'data-tiles': props.showTiles }),
  }),
}))

const initial = vi.fn<Geolocation['getCurrentPosition']>()
const watch = vi.fn<Geolocation['watchPosition']>()
const clear = vi.fn<Geolocation['clearWatch']>()
let container: HTMLElement
let app: App | undefined

function position(latitude = 6.3): GeolocationPosition {
  return {
    coords: { latitude, longitude: -10.8, accuracy: 9, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: Date.now(),
  } as GeolocationPosition
}

function button(text: string) {
  const result = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === text)
  if (!result) throw new Error('Missing button: ' + text)
  return result
}

function status() {
  return container.querySelector('[role="status"]')?.textContent
}

function fail(code: number) {
  initial.mock.calls[0][1]?.({ code } as GeolocationPositionError)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-21T12:00:00Z'))
  vi.resetAllMocks()
  watch.mockReturnValue(0)
  vi.stubGlobal('isSecureContext', true)
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: initial, watchPosition: watch, clearWatch: clear },
  })
  container = document.createElement('div')
  document.body.append(container)
  app = createApp(GpsTrackingView)
  app.mount(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  Reflect.deleteProperty(navigator, 'geolocation')
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('GPS tracking dashboard', () => {
  it('starts only on request, validates fixes, updates details, and stops watch zero', async () => {
    expect(initial).not.toHaveBeenCalled()
    expect(button('Stop Tracking').disabled).toBe(true)
    expect(button('Share location').disabled).toBe(true)
    button('Start Tracking').click()
    await nextTick()
    expect(status()).toMatch(/Requesting location/)
    initial.mock.calls[0][0](position())
    await nextTick()
    expect(status()).toMatch(/Tracking active/)
    expect(watch).toHaveBeenCalledOnce()
    expect(container.textContent).toContain('9 meters')
    expect(container.querySelector('time')?.dateTime).toBe(new Date().toISOString())
    expect(container.querySelector('[data-marker]')?.getAttribute('data-marker')).toBe('6.3')

    watch.mock.calls[0][0](position(6.45))
    await nextTick()
    expect(container.textContent).toContain('6.450000 degrees')
    watch.mock.calls[0][0](position(91))
    await nextTick()
    expect(status()).toMatch(/Location unavailable/)
    expect(container.textContent).toContain('This position is historical.')
    expect(container.querySelector('[data-marker]')).toBeNull()

    button('Stop Tracking').click()
    watch.mock.calls[0][0](position(6.55))
    await nextTick()
    expect(clear).toHaveBeenCalledWith(0)
    expect(status()).toMatch(/Tracking stopped/)
    expect(container.textContent).not.toContain('6.550000 degrees')
  })

  it.each([[1, 'Permission denied'], [2, 'Location unavailable'], [3, 'Location timed out']])(
    'handles browser error %i and allows another attempt',
    async (code, message) => {
      button('Start Tracking').click()
      fail(code)
      await nextTick()
      expect(status()).toContain(message)
      expect(watch).not.toHaveBeenCalled()
      expect(button('Start Tracking').disabled).toBe(false)
    },
  )

  it('marks expired fixes historical, removes the marker, and accepts a new fix', async () => {
    button('Start Tracking').click()
    initial.mock.calls[0][0](position())
    await vi.advanceTimersByTimeAsync(LOCATION_STALE_MS)
    expect(status()).toContain('Location stale')
    expect(container.querySelector('[data-marker]')).toBeNull()
    watch.mock.calls[0][0](position(6.4))
    await nextTick()
    expect(status()).toContain('Tracking active')
    expect(container.querySelector('[data-marker]')).not.toBeNull()
    app?.unmount()
    app = undefined
  container.remove()
    expect(clear).toHaveBeenCalledExactlyOnceWith(0)
  })

  it('cancels a pending request locally and ignores its late callback', async () => {
    button('Start Tracking').click()
    await nextTick()
    button('Stop Tracking').click()
    initial.mock.calls[0][0](position())
    await nextTick()
    expect(watch).not.toHaveBeenCalled()
    expect(status()).toMatch(/Tracking stopped/)
  })

  it('isolates demo coordinates and supports pause and reset', async () => {
    button('Start Tracking').click()
    initial.mock.calls[0][0](position())
    await nextTick()
    const demoRadio = container.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1]
    demoRadio.click()
    await nextTick()
    expect(clear).toHaveBeenCalledWith(0)
    expect(container.textContent).toContain('DEMO — SIMULATED LOCATION')
    expect(container.textContent).not.toContain('6.300000 degrees')
    button('Start Simulation').click()
    await vi.advanceTimersByTimeAsync(2_000)
    expect(container.textContent).toContain('6.303400 degrees')
    button('Pause Simulation').click()
    await vi.advanceTimersByTimeAsync(4_000)
    expect(container.textContent).toContain('6.303400 degrees')
    button('Reset').click()
    await nextTick()
    expect(container.textContent).not.toContain('6.303400 degrees')
    expect(initial).toHaveBeenCalledOnce()
  })

  it('shows HTTPS and unsupported-browser guidance before calling the provider', async () => {
    vi.stubGlobal('isSecureContext', false)
    button('Start Tracking').click()
    await nextTick()
    expect(status()).toContain('requires HTTPS or localhost')
    vi.stubGlobal('isSecureContext', true)
    Reflect.deleteProperty(navigator, 'geolocation')
    button('Start Tracking').click()
    await nextTick()
    expect(status()).toContain('does not expose location access')
    expect(initial).not.toHaveBeenCalled()
  })
})
