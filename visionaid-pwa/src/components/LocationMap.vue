<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { circleMarker, map as createMap, polyline, tileLayer, type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { demoRoute, type LocationSample } from '../data-sources/location'

const props = defineProps<{
  point?: LocationSample
  demo: boolean
  showTiles: boolean
}>()

const container = ref<HTMLElement>()
const tileError = ref(false)
let map: ReturnType<typeof createMap> | undefined
let marker: ReturnType<typeof circleMarker> | undefined
let route: ReturnType<typeof polyline> | undefined
let tiles: ReturnType<typeof tileLayer> | undefined

function center() {
  if (!map) return
  if (props.point) {
    map.setView([props.point.latitude, props.point.longitude], Math.max(16, map.getZoom()), { animate: false })
  } else if (route) {
    map.fitBounds(route.getBounds(), { padding: [25, 25], maxZoom: 17, animate: false })
  }
}

function syncMode() {
  if (!map) return
  tiles?.remove()
  tiles = undefined
  route?.remove()
  route = props.demo ? polyline([...demoRoute], { color: '#23695e', weight: 5 }).addTo(map) : undefined
  if (route) map.fitBounds(route.getBounds(), { padding: [25, 25], maxZoom: 17, animate: false })
  else map.setView([0, 0], 2, { animate: false })
}

function syncPoint() {
  if (!map) return
  if (!props.point) {
    marker?.remove()
    marker = undefined
    return
  }
  const position: LatLngTuple = [props.point.latitude, props.point.longitude]
  if (marker) {
    marker.setLatLng(position)
    if (!map.getBounds().contains(position)) center()
  } else {
    marker = circleMarker(position, {
      radius: 9, color: '#102e2c', fillColor: '#f4dfac', fillOpacity: 1, weight: 3,
    }).addTo(map)
    if (!props.demo) center()
  }
}

function syncTiles() {
  if (!map) return
  tileError.value = false
  tiles?.remove()
  tiles = undefined
  if (!props.showTiles || (!props.demo && !props.point)) return
  tiles = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    referrerPolicy: 'strict-origin-when-cross-origin',
  })
  tiles.on('tileerror', () => { tileError.value = true })
  tiles.addTo(map)
}

onMounted(() => {
  if (!container.value) return
  map = createMap(container.value, { zoomAnimation: false, scrollWheelZoom: false })
  syncMode()
  syncPoint()
  syncTiles()
})

watch(() => props.demo, syncMode)
watch(() => props.point, syncPoint)
watch([() => props.showTiles, () => props.demo, () => Boolean(props.point)], syncTiles)
onUnmounted(() => map?.remove())

defineExpose({ center })
</script>

<template>
  <div
    ref="container"
    class="location-map"
    role="region"
    aria-label="Interactive location map"
    aria-describedby="map-description"
  ></div>
  <p id="map-description">
    {{ demo ? 'Map shows the simulated route. The location details below describe the simulated position.'
      : 'The live marker appears when a current position is available. Location details are listed below.' }}
  </p>
  <p v-if="showTiles && tileError" role="status">Some street tiles could not load. Location details are still available.</p>
</template>

<style scoped>
.location-map {
  height: clamp(15rem, 48vw, 25rem);
  isolation: isolate;
  background: #dcece6;
  border: 1px solid #49615c;
  border-radius: .5rem;
}
</style>
