// @vitest-environment jsdom
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GpsTrackingView from '../src/views/GpsTrackingView.vue'
import { LOCATION_STALE_MS } from '../src/data-sources/location'

vi.mock('../src/components/LocationMap.vue', () => ({
  default: defineComponent({
    props: ['point', 'route', 'enabled', 'online'],
    setup: (props) => () => h('div', { 'data-marker': props.point?.latitude, 'data-longitude': props.point?.longitude }),
  }),
}))

const initial = vi.fn<Geolocation['getCurrentPosition']>()
const watch = vi.fn<Geolocation['watchPosition']>()
const clear = vi.fn<Geolocation['clearWatch']>()
let container: HTMLElement
let app: App | undefined

function position(latitude = 6.3, accuracy = 9): GeolocationPosition {
  return {
    coords: { latitude, longitude: -10.8, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
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
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
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
  Reflect.deleteProperty(navigator, 'onLine')
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('GPS tracking dashboard', () => {
  it('starts only on request, validates fixes, updates details, and stops watch zero', async () => {
    expect(initial).not.toHaveBeenCalled()
    expect(button('Stop Tracking').disabled).toBe(true)
    expect(button('Start Sharing').disabled).toBe(true)
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

  it('announces GPS transitions and provides an on-demand location summary without coordinates', async () => {
    button('Start Tracking').click()
    await nextTick()
    expect(status()).toContain('Requesting location')
    initial.mock.calls[0][0](position(6.123456789, 11))
    await nextTick()
    expect(status()).toContain('Tracking active')
    button('Read My Location Status').click()
    await nextTick()
    await nextTick()
    const summary = container.querySelector('.status-result')?.textContent
    expect(summary).toContain('Estimated accuracy: 11 meters')
    expect(summary).not.toContain('6.123')
    button('Stop Tracking').click()
    await nextTick()
    expect(status()).toContain('Tracking stopped')
  })

  it('requests fresh high-accuracy fixes and explains an approximate reading', async () => {
    const options = expect.objectContaining({ enableHighAccuracy: true, maximumAge: 0 })
    button('Start Tracking').click()
    expect(initial).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), options)
    initial.mock.calls[0][0](position(6.3, 250))
    await nextTick()
    expect(watch).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), options)
    expect(container.textContent).toContain('250 meters')
    expect(container.textContent).toContain('reporting an approximate location')

    watch.mock.calls[0][0](position(6.31, 10))
    await nextTick()
    expect(container.textContent).toContain('10 meters')
    expect(container.textContent).not.toContain('reporting an approximate location')
  })

  it('clears demo data before reporting exact device coordinates and fix age', async () => {
    const details = container.querySelector('details')!
    details.open = true
    details.dispatchEvent(new Event('toggle'))
    await nextTick()
    expect(details.textContent).toContain('No fix')

    const [device, demo] = container.querySelectorAll<HTMLInputElement>('input[type="radio"]')
    demo.click()
    await nextTick()
    button('Start Simulation').click()
    await vi.advanceTimersByTimeAsync(2000)
    expect(details.textContent).toContain('VisionAid simulator')

    device.click()
    await nextTick()
    expect(details.textContent).toContain('Browser Geolocation (navigator.geolocation)')
    expect(details.textContent).not.toContain('6.3034')
    expect(container.querySelector('[data-marker]')).toBeNull()

    button('Start Tracking').click()
    initial.mock.calls[0][0](position(6.123456789, 8.75))
    await vi.advanceTimersByTimeAsync(3000)
    const marker = container.querySelector('[data-marker]')
    expect(marker?.getAttribute('data-marker')).toBe('6.123456789')
    expect(marker?.getAttribute('data-longitude')).toBe('-10.8')
    expect(details.textContent).toContain('6.123456789')
    expect(details.textContent).toContain('8.75 meters')
    expect(details.textContent).toContain('3 seconds')
    expect(details.textContent).toContain('2026-11-21T12:00:02.000Z')
  })

  it('stops after an initial permission denial', async () => {
    button('Start Tracking').click()
    fail(1)
    await nextTick()
    expect(status()).toContain('Permission denied')
    expect(watch).not.toHaveBeenCalled()
    expect(button('Start Tracking').disabled).toBe(false)
  })

  it.each([[2, 'Location unavailable'], [3, 'Location timed out']])(
    'continues watching after an initial browser error %i',
    async (code, message) => {
      button('Start Tracking').click()
      fail(code)
      await nextTick()
      expect(status()).toContain(message)
      expect(container.textContent).not.toContain('Showing your last known position')
      expect(watch).toHaveBeenCalledOnce()
      watch.mock.calls[0][0](position())
      await nextTick()
      expect(status()).toContain('Tracking active')
    },
  )

  it('keeps the watcher on through offline updates, loss of fix, and reconnection', async () => {
    button('Start Tracking').click()
    initial.mock.calls[0][0](position(6.49))
    await nextTick()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    window.dispatchEvent(new Event('offline'))
    await nextTick()
    expect(container.textContent).toContain('Offline Location Status')
    expect(clear).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2000)
    watch.mock.calls[0][0](position(6.51, 21))
    await vi.advanceTimersByTimeAsync(1000)
    const panel = container.querySelector('[aria-labelledby="details-heading"]')!
    expect(panel.textContent).toContain('6.510000 degrees')
    expect(panel.textContent).toContain('21 meters')
    expect(panel.textContent).toContain('1 second')
    const fixTime = panel.querySelector('time')?.dateTime
    expect(fixTime).toBe('2026-11-21T12:00:02.000Z')
    expect(status()).toContain('Tracking active')

    watch.mock.calls[0][1]?.({ code: 2 } as GeolocationPositionError)
    await nextTick()
    expect(panel.textContent).toContain('Unable to obtain a new location. Showing your last known position.')
    expect(panel.textContent).toContain('This position is historical')
    expect(panel.textContent).toContain('6.510000 degrees')
    expect(panel.querySelector('time')?.dateTime).toBe(fixTime)
    expect(container.querySelector('[data-marker]')).toBeNull()
    expect(clear).not.toHaveBeenCalled()

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    window.dispatchEvent(new Event('online'))
    await nextTick()
    expect(panel.textContent).toContain('Online')
    expect(watch).toHaveBeenCalledOnce()
    watch.mock.calls[0][0](position(6.52))
    await nextTick()
    expect(status()).toContain('Tracking active')
    expect(panel.textContent).not.toContain('historical')
    expect(panel.textContent).toContain('6.520000 degrees')
  })

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
    expect(container.textContent).toContain('DEMO MODE — SIMULATED LOCATION')
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
