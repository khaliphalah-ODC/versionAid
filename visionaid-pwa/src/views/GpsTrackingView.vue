<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import LocationMap from '../components/LocationMap.vue'
import { useGpsTracking } from '../composables/useGpsTracking'

const { mode, status, running, sample, current, selectMode, start, stop, reset } = useGpsTracking()
const map = ref<InstanceType<typeof LocationMap>>()
const tilesEnabled = ref(false)
const online = ref(navigator.onLine)
const isDemo = computed(() => mode.value === 'demo')
const marker = computed(() => isDemo.value ? sample.value : current.value)
const time = computed(() => sample.value ? new Date(sample.value.timestamp) : undefined)

const realMessages = {
  idle: 'Not started. Select Start Tracking to request location access.',
  requesting: 'Requesting location. Respond to the browser permission prompt if it appears, then wait for a position.',
  active: 'Tracking active. The browser is providing location updates.',
  stopped: 'Tracking stopped. Select Start Tracking to resume.',
  stale: 'Location stale. Waiting for a fresh reading. Try moving where your device has a better signal.',
  denied: 'Permission denied. Allow location access in your browser’s site settings, then try again.',
  unavailable: 'Location unavailable. Check that device location is enabled and try in an open area.',
  timeout: 'Location timed out. Try again where your device can get a stronger signal.',
  unsupported: 'This browser does not expose location access. Use Demo Mode or try a supported browser.',
  insecure: 'Location access requires HTTPS or localhost. Open a secure URL or use Demo Mode.',
}
const message = computed(() => {
  if (!isDemo.value) return realMessages[status.value]
  if (running.value) return 'Demo Mode. The simulated position moves along the sample route.'
  if (sample.value) return 'Demo Mode. Simulation paused.'
  return 'Demo Mode. Select Start Simulation to move along the sample route.'
})

function setMode(next: 'real' | 'demo') {
  if (mode.value === next) return
  tilesEnabled.value = false
  selectMode(next)
}

function syncOnline() { online.value = navigator.onLine }

onMounted(() => {
  window.addEventListener('online', syncOnline)
  window.addEventListener('offline', syncOnline)
})
onUnmounted(() => {
  window.removeEventListener('online', syncOnline)
  window.removeEventListener('offline', syncOnline)
})
</script>

<template>
  <h1>GPS Tracking</h1>
  <p>Use your device’s location to show your position in VisionAid. Tracking starts only when you ask and is designed for use while this page is open.</p>

  <fieldset>
    <legend>Location source</legend>
    <label><input type="radio" name="location-mode" :checked="!isDemo" @change="setMode('real')"> Device location</label>
    <label><input type="radio" name="location-mode" :checked="isDemo" @change="setMode('demo')"> Demo Mode</label>
  </fieldset>

  <p class="status" role="status" aria-atomic="true">{{ message }}</p>
  <p v-if="isDemo"><strong>DEMO — SIMULATED LOCATION</strong></p>
  <p v-else>Start Tracking asks your browser for permission to read your device’s location. VisionAid keeps the last reading in this page.</p>

  <div class="actions">
    <template v-if="isDemo">
      <button type="button" :disabled="running" @click="start">Start Simulation</button>
      <button type="button" :disabled="!running" @click="stop">Pause Simulation</button>
      <button type="button" @click="reset">Reset</button>
    </template>
    <template v-else>
      <button type="button" :disabled="running" @click="start">Start Tracking</button>
      <button type="button" :disabled="!running" @click="stop">Stop Tracking</button>
    </template>
    <button type="button" :disabled="!marker && !isDemo" @click="map?.center()">Center Map</button>
  </div>

  <section aria-labelledby="map-heading">
    <h2 id="map-heading">Location map</h2>
    <label class="tile-option">
      <input v-model="tilesEnabled" type="checkbox" :disabled="!online" aria-describedby="tiles-note">
      Load OpenStreetMap street tiles
    </label>
    <p id="tiles-note">Street tiles are optional. Requests to OpenStreetMap reveal the approximate area visible on the map.</p>
    <p v-if="!online" role="status">Offline. Street tiles are unavailable. Device location may still work if your device can determine a position.</p>
    <LocationMap ref="map" :point="marker" :demo="isDemo" :show-tiles="tilesEnabled && online" />
  </section>

  <section aria-labelledby="details-heading">
    <h2 id="details-heading">{{ isDemo ? 'Simulated location details' : 'Device location details' }}</h2>
    <p v-if="sample && !current">{{ isDemo ? 'Last simulated reading.' : 'Last known reading. This position is historical.' }}</p>
    <p v-if="!sample">{{ status === 'requesting' ? 'Waiting for the first location reading.' : 'No location reading is available.' }}</p>
    <dl v-else>
      <div><dt>Latitude</dt><dd>{{ sample.latitude.toFixed(6) }} degrees</dd></div>
      <div><dt>Longitude</dt><dd>{{ sample.longitude.toFixed(6) }} degrees</dd></div>
      <div><dt>{{ isDemo ? 'Simulated accuracy' : 'Estimated accuracy' }}</dt><dd>{{ Math.round(sample.accuracy) }} meters</dd></div>
      <div><dt>Last successful update</dt><dd><time :datetime="time?.toISOString()">{{ time?.toLocaleString() }}</time></dd></div>
    </dl>
  </section>

  <section aria-labelledby="sharing-heading">
    <h2 id="sharing-heading">Caretaker sharing</h2>
    <p id="sharing-status">Sharing is off. Secure caretaker sharing is pending.</p>
    <button type="button" disabled aria-describedby="sharing-status">Share location</button>
  </section>
</template>

<style scoped>
fieldset, .status {
  margin-inline: 0;
  border: 1px solid #49615c;
  border-radius: .5rem;
  padding: .5rem 1rem;
}
.status { background: #e5f2ed; font-weight: 700; }
legend, dt { font-weight: 700; }
label { display: inline-flex; align-items: center; gap: .45rem; min-height: 44px; margin-inline-end: 1rem; }
input { width: 1.25rem; height: 1.25rem; flex: none; accent-color: #23695e; }
.actions { display: flex; flex-wrap: wrap; gap: .5rem; }
button {
  min-height: 44px;
  padding: .45rem .8rem;
  border: 1px solid #49615c;
  border-radius: .4rem;
  background: #102e2c;
  color: white;
  font: inherit;
  cursor: pointer;
}
button:disabled { background: #e6eeeb; color: #42524f; cursor: default; }
dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: .75rem; }
dl > div { background: white; padding: .75rem; border-radius: .4rem; }
dd { margin: 0; overflow-wrap: anywhere; }
</style>
