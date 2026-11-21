// @vitest-environment jsdom
import { createApp, h, nextTick, reactive, type App } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import LocationMap from '../src/components/LocationMap.vue'
import { demoRoute, type LocationSample } from '../src/data-sources/location'

vi.mock('@googlemaps/js-api-loader', () => ({ importLibrary: vi.fn(), setOptions: vi.fn() }))

const sample: LocationSample = { latitude: 6.31, longitude: -10.81, accuracy: 18, timestamp: 1 }

const map = {
  addListener: vi.fn(),
  getMapCapabilities: vi.fn(),
  setMapTypeId: vi.fn(), getBounds: vi.fn(),
  panTo: vi.fn(), getZoom: vi.fn(() => 12), setZoom: vi.fn(), setCenter: vi.fn(),
  fitBounds: vi.fn(),
}
const accuracy = { setMap: vi.fn(), setOptions: vi.fn() }
const routeLine = { setMap: vi.fn(), setPath: vi.fn() }
const marker: { map?: unknown; position?: unknown; title?: string } = {}
const initialize = vi.fn(function () { return map })
const removeListener = vi.fn()

let tileCallback: () => void
let app: App | undefined
let host: HTMLElement

function mount(options: { point?: LocationSample; online?: boolean; route?: typeof demoRoute; enabled?: boolean } = {}) {
  const props = reactive({ enabled: true, online: true, ...options })
  app = createApp({ render: () => h(LocationMap, { ...props }) })
  host = document.createElement('div')
  document.body.append(host)
  app.mount(host)
  return props
}

async function settle() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'unit-test-key')
  vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', 'unit-test-map-id')
  vi.stubGlobal('google', { maps: {
    LatLngBounds: class {
      extend() {}
      isEmpty() { return false }
    },
  } })
  Object.assign(marker, { map: undefined, position: undefined, title: undefined })
  map.addListener.mockImplementation((_name, callback) => {
    tileCallback = callback
    return { remove: removeListener }
  })
  map.getMapCapabilities.mockReturnValue({ isAdvancedMarkersAvailable: true })
  vi.mocked(importLibrary).mockImplementation(async (library) => {
    const stub = library === 'maps'
      ? { Map: initialize, Circle: function () { return accuracy }, Polyline: function () { return routeLine } }
      : { AdvancedMarkerElement: function () { return marker } }
    return stub as unknown as Awaited<ReturnType<typeof importLibrary>>
  })
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host?.remove()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Google Maps location map', () => {
  it('loads the official libraries with a map ID, then updates and removes the marker and accuracy ring', async () => {
    const props = mount({ point: sample, enabled: false })
    await settle()
    expect(importLibrary).not.toHaveBeenCalled()
    props.enabled = true
    await settle()
    expect(setOptions).toHaveBeenCalledWith(expect.objectContaining({ key: 'unit-test-key' }))
    expect(importLibrary).toHaveBeenCalledWith('maps')
    expect(importLibrary).toHaveBeenCalledWith('marker')
    expect(initialize).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({
      mapId: 'unit-test-map-id', zoomControl: true, keyboardShortcuts: true, mapTypeId: 'roadmap',
    }))
    expect(host.textContent).toContain('Loading Google Maps')
    tileCallback()
    await nextTick()
    expect(marker.position).toEqual({ lat: 6.31, lng: -10.81 })
    expect(marker.map).toBe(map)
    expect(map.panTo).toHaveBeenCalledWith({ lat: 6.31, lng: -10.81 })
    expect(accuracy.setOptions).toHaveBeenCalledWith({ center: { lat: 6.31, lng: -10.81 }, radius: 18 })

    const satellite = host.querySelectorAll('button')[1]
    satellite.click()
    await nextTick()
    expect(satellite.getAttribute('aria-pressed')).toBe('true')
    expect(map.setMapTypeId).toHaveBeenCalledWith('satellite')

    props.point = { ...sample, latitude: 6.32, accuracy: 9 }
    await nextTick()
    expect(marker.position).toEqual({ lat: 6.32, lng: -10.81 })
    expect(accuracy.setOptions).toHaveBeenLastCalledWith({ center: { lat: 6.32, lng: -10.81 }, radius: 9 })

    props.point = undefined
    await nextTick()
    expect(marker.map).toBeNull()
    expect(accuracy.setMap).toHaveBeenLastCalledWith(null)
  })

  it.each([
    ['VITE_GOOGLE_MAPS_API_KEY', 'API key'],
    ['VITE_GOOGLE_MAPS_MAP_ID', 'map ID'],
  ])('explains missing %s without loading Google', async (variable, message) => {
    vi.stubEnv(variable, '')
    mount()
    await settle()
    expect(host.textContent).toContain(message)
    expect(importLibrary).not.toHaveBeenCalled()
  })

  it('shows a configuration error when Google rejects the browser key', async () => {
    mount()
    await settle()
    window.gm_authFailure?.()
    await nextTick()
    expect(host.textContent).toContain('Google Maps rejected the configuration')
    expect(host.querySelector('.location-map')).toBeNull()
  })

  it('explains when the map ID does not support Advanced Markers', async () => {
    map.getMapCapabilities.mockReturnValue({ isAdvancedMarkersAvailable: false })
    mount()
    await settle()
    tileCallback()
    await nextTick()
    expect(host.textContent).toContain('Check that the map ID')
  })

  it('fits the demo route, labels simulated positions and removes overlays when offline', async () => {
    const props = mount({ point: sample, route: demoRoute, online: false })
    await settle()
    expect(host.textContent).toContain('Google Maps tiles are unavailable')
    expect(importLibrary).not.toHaveBeenCalled()

    props.online = true
    await settle()
    tileCallback()
    await nextTick()
    expect(routeLine.setPath).toHaveBeenCalledWith(demoRoute.map(([lat, lng]) => ({ lat, lng })))
    expect(map.fitBounds).toHaveBeenCalled()
    expect(marker.title).toBe('Simulated position')

    props.online = false
    await nextTick()
    expect(marker.map).toBeNull()
    expect(routeLine.setMap).toHaveBeenLastCalledWith(null)
    expect(host.textContent).toContain('Google Maps tiles are unavailable')
  })
})
