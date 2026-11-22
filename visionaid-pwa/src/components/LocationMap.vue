<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { prefersReducedMotion } from '../services/accessibilityPreferences'
import type { LocationSample } from '../data-sources/location'

const props = defineProps<{
  point?: LocationSample
  route?: readonly [number, number][]
  enabled: boolean
  online: boolean
}>()

declare global {
  interface Window {
    gm_authFailure?: () => void
  }
}

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim()
const defaultCenter = { lat: 6.3156, lng: -10.8074 } // Initial map viewport in Monrovia
const container = ref<HTMLElement>()
const ready = ref(false)
const error = ref('')
const needsRetry = ref(false)
const mapType = ref<'roadmap' | 'satellite'>('roadmap')
const showMap = computed(() => props.enabled && props.online && apiKey && mapId && !error.value && !needsRetry.value)

let offlineViewport: { center: google.maps.LatLngLiteral; zoom?: number } | undefined
const following = ref(true)
let lastPosition: google.maps.LatLngLiteral | undefined
let map: google.maps.Map | undefined
let marker: google.maps.marker.AdvancedMarkerElement | undefined
let accuracy: google.maps.Circle | undefined
let routeLine: google.maps.Polyline | undefined

function pointPosition(point: LocationSample): google.maps.LatLngLiteral {
  return { lat: point.latitude, lng: point.longitude }
}

function center() {
  if (!map || !ready.value) return
  if (props.point) {
    if (!props.route) following.value = true
    const position = pointPosition(props.point)
    if (prefersReducedMotion()) map.setCenter(position)
    else map.panTo(position)
    if ((map.getZoom() ?? 0) < 16) map.setZoom(16)
  } else if (routeLine) {
    fitRoute()
  }
}

function toggleFollow() {
  following.value = !following.value
  if (following.value) center()
}

function fitRoute() {
  if (!map || !props.route) return
  const bounds = new google.maps.LatLngBounds()
  for (const [lat, lng] of props.route) bounds.extend({ lat, lng })
  if (!bounds.isEmpty()) map.fitBounds(bounds, 36)
}

function syncRoute() {
  if (!map || !routeLine) return
  routeLine.setPath(props.route?.map(([lat, lng]) => ({ lat, lng })) ?? [])
  routeLine.setMap(props.route?.length ? map : null)
  if (props.route?.length) fitRoute()
}

function syncPoint() {
  if (!map || !marker || !accuracy) return
  if (!props.point) {
    marker.map = null
    marker.position = null
    accuracy.setMap(null)
    lastPosition = undefined
    return
  }

  const position = pointPosition(props.point)
  marker.position = position
  marker.title = props.route ? 'Simulated position' : 'Current device position'
  marker.map = map
  accuracy.setOptions({ center: position, radius: props.point.accuracy })
  accuracy.setMap(map)
  if (!props.route && following.value) {
    if (!lastPosition) center()
    else if (position.lat !== lastPosition.lat || position.lng !== lastPosition.lng) map.setCenter(position)
  }
  lastPosition = position
}

watch(container, async (host, _previous, onCleanup) => {
  if (!host || !apiKey || !mapId) return
  let cancelled = false
  let dragListener: google.maps.MapsEventListener | undefined
  function pauseOnKeyboardPan(event: KeyboardEvent) {
    if (event.key.startsWith('Arrow')) following.value = false
  }
  host.addEventListener('keydown', pauseOnKeyboardPan)
  let tilesListener: google.maps.MapsEventListener | undefined
  const previousAuthFailure = window.gm_authFailure
  const authFailure = () => {
    if (!cancelled) error.value = 'Google Maps rejected the configuration. Check the API key, website restrictions, API enablement, and billing.'
    previousAuthFailure?.()
  }
  window.gm_authFailure = authFailure
  const deadline = setTimeout(() => {
    error.value = 'Google Maps did not finish loading. Check your connection and try again.'
  }, 20_000)

  onCleanup(() => {
    cancelled = true
    clearTimeout(deadline)
    if (window.gm_authFailure === authFailure) window.gm_authFailure = previousAuthFailure
    tilesListener?.remove()
    dragListener?.remove()
    host.removeEventListener('keydown', pauseOnKeyboardPan)
    if (!props.online && map) {
      const center = map.getCenter()?.toJSON()
      if (center) offlineViewport = { center, zoom: map.getZoom() }
    }
    if (marker) marker.map = null
    accuracy?.setMap(null)
    routeLine?.setMap(null)
    map = marker = accuracy = routeLine = undefined
    ready.value = false
    lastPosition = undefined
    host.replaceChildren()
  })

  try {
    // The loader accepts options once per window. Subsequent visits reuse its libraries.
    if (!window.google?.maps?.importLibrary) setOptions({ key: apiKey, v: 'weekly', authReferrerPolicy: 'origin' })
    const [{ Map, Circle, Polyline }, { AdvancedMarkerElement }] = await Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
    ])
    if (cancelled || error.value) return
    const instance = new Map(host, {
      mapId,
      center: props.point ? pointPosition(props.point) : (offlineViewport?.center ?? defaultCenter),
      zoom: props.point ? 16 : (offlineViewport?.zoom ?? 12),
      mapTypeId: mapType.value,
      mapTypeControl: false,
      zoomControl: true,
      streetViewControl: false,
      keyboardShortcuts: true,
      gestureHandling: 'cooperative',
    })
    map = instance
    dragListener = instance.addListener('dragstart', () => { following.value = false })
    marker = new AdvancedMarkerElement()
    accuracy = new Circle({
      strokeColor: '#005760', strokeOpacity: 0.9, strokeWeight: 2,
      fillColor: '#087f8c', fillOpacity: 0.2, clickable: false,
    })
    routeLine = new Polyline({ strokeColor: '#00646f', strokeWeight: 5, clickable: false })

    tilesListener = instance.addListener('tilesloaded', () => {
      clearTimeout(deadline)
      tilesListener?.remove()
      if (!instance.getMapCapabilities().isAdvancedMarkersAvailable) {
        error.value = 'Google Maps could not enable location markers. Check that the map ID is configured for a JavaScript map.'
        return
      }
      ready.value = true
      syncRoute()
      syncPoint()
    })
  } catch {
    if (!cancelled) error.value = 'Google Maps could not load. Check your connection and map configuration, then try again.'
  }
}, { flush: 'post' })

watch(() => props.enabled, (enabled) => {
  if (!enabled) {
    error.value = ''
    needsRetry.value = false
    offlineViewport = undefined
    following.value = true
  }
})
watch(() => props.online, (online) => {
  if (!online && props.enabled) needsRetry.value = true
}, { immediate: true })

function retryMap() {
  error.value = ''
  needsRetry.value = false
}

watch(() => props.route, () => { if (ready.value) syncRoute() })
watch(() => props.point, () => { if (ready.value) syncPoint() })
watch(mapType, (type) => map?.setMapTypeId(type))

defineExpose({ center, ready })
</script>

<template>
  <div class="map-options" v-if="ready" role="group" aria-label="Google Maps view">
    <button type="button" :aria-pressed="mapType === 'roadmap'" @click="mapType = 'roadmap'">Street map</button>
    <button type="button" :aria-pressed="mapType === 'satellite'" @click="mapType = 'satellite'">Satellite</button>
    <button v-if="!route" type="button" :aria-pressed="following" @click="toggleFollow">Follow my location</button>
  </div>
  <div
    v-if="showMap"
    ref="container"
    class="location-map"
    role="region"
    aria-label="Interactive Google Maps"
    :aria-describedby="ready ? 'map-description' : undefined"
  ></div>
  <p role="status">
    <template v-if="!online">Map unavailable offline. Device location can still update if your browser supplies a fix.</template>
    <template v-else-if="!apiKey">Google Maps is unavailable. The Maps API key has not been configured.</template>
    <template v-else-if="!mapId">Google Maps is unavailable. The Google Maps map ID has not been configured.</template>
    <template v-else-if="error">{{ error }}</template>
    <template v-else-if="needsRetry">Connection restored. Select Retry Map to reload Google Maps.</template>
    <template v-else-if="enabled && !ready">Loading Google Maps…</template>
  </p>
  <p v-if="ready" id="map-description">
    <template v-if="route">The line shows the simulated route. A marker appears when there is a simulated position.</template>
    <template v-else-if="point">The marker shows the current device estimate. The circle shows its estimated accuracy. Panning pauses follow mode.</template>
    <template v-else>No current device position is plotted. The map starts in Monrovia and may show the last area viewed.</template>
    Location details are listed below.
  </p>
  <button v-if="enabled && online && (error || needsRetry)" type="button" @click="retryMap">Retry Map</button>
</template>

<style scoped>
.location-map {
  height: clamp(15rem, 48vw, 25rem);
  isolation: isolate;
  border: 1px solid #49615c;
  border-radius: .5rem;
  overflow: hidden;
}
.map-options {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  margin-bottom: .5rem;
}
button {
  min-height: 44px;
  padding: .45rem .8rem;
  border: 1px solid #49615c;
  border-radius: .4rem;
  background: white;
  color: #102e2c;
  font: inherit;
  cursor: pointer;
}
button[aria-pressed='true'] { background: #102e2c; color: white; }
p:empty { margin: 0; }
</style>
