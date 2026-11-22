<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import LocationMap from '../components/LocationMap.vue'
import { demoRoute } from '../data-sources/location'
import { useGpsTracking } from '../composables/useGpsTracking'

const { mode, status, running, sample, current, selectMode, start, stop, reset } = useGpsTracking()
const map = ref<InstanceType<typeof LocationMap>>()
const mapEnabled = ref(false)
const approximateLocationThresholdMeters = 100
const online = ref(navigator.onLine)
const isDemo = computed(() => mode.value === 'demo')
const marker = computed(() => isDemo.value ? sample.value : current.value)
const diagnosticsOpen = ref(false)
const fixClock = ref(Date.now())
const fixAge = computed(() => {
  if (!sample.value) return 'Unavailable'
  const seconds = Math.floor(Math.max(0, fixClock.value - sample.value.timestamp) / 1000)
  return seconds === 1 ? '1 second' : seconds + ' seconds'
})

watch(() => Boolean(sample.value), (hasFix, _previous, onCleanup) => {
  if (!hasFix) return
  fixClock.value = Date.now()
  const timer = setInterval(() => { fixClock.value = Date.now() }, 1000)
  onCleanup(() => clearInterval(timer))
})

const time = computed(() => sample.value ? new Date(sample.value.timestamp) : undefined)

const unableToGetFix = computed(() => !isDemo.value && (
  status.value === 'stale' || status.value === 'unavailable' || status.value === 'timeout'
))

const realMessages = {
  idle: 'Not started. Select Start Tracking to request location access.',
  requesting: 'Requesting location. Respond to the browser permission prompt if it appears, then wait for a position.',
  active: 'Tracking active. The browser is providing location updates.',
  stopped: 'Tracking stopped. Select Start Tracking to resume.',
  stale: 'Location stale. Waiting for a fresh reading. Try moving where your device has a better signal.',
  denied: 'Permission denied. Allow location access in your browser’s site settings, then try again.',
  unavailable: 'Location unavailable. Check that device location is enabled and try in an open area.',
  timeout: 'Location timed out. Try moving where your device can get a stronger signal.',
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
  mapEnabled.value = false
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
  <p v-if="isDemo"><strong>DEMO MODE — SIMULATED LOCATION</strong></p>
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
    <button type="button" :disabled="!map?.ready || (!marker && !isDemo)" @click="map?.center()">{{ isDemo ? 'Center demo map' : 'Center on My Location' }}</button>
  </div>

  <section aria-labelledby="map-heading">
    <h2 id="map-heading">Location map</h2>
    <label class="map-option">
      <input v-model="mapEnabled" type="checkbox" :disabled="!online" aria-describedby="map-privacy">
      Load Google Maps
    </label>
    <p id="map-privacy">Google Maps is optional. Loading it sends map viewport information and network metadata to Google.</p>
    <LocationMap ref="map" :point="marker" :route="isDemo ? demoRoute : undefined" :enabled="mapEnabled" :online="online" />
  </section>

  <section aria-labelledby="details-heading">
    <h2 id="details-heading">{{ online ? 'Location status' : 'Offline Location Status' }}</h2>
    <p><strong>Internet connectivity:</strong> {{ online ? 'Online' : 'Offline' }}</p>
    <p v-if="isDemo">Source: Simulated location</p>
    <p v-if="sample && !current">{{ isDemo ? 'Last simulated reading.' : 'Last known reading. This position is historical.' }}</p>
    <p v-if="unableToGetFix && sample">Unable to obtain a new location. Showing your last known position.</p>
    <p v-else-if="!sample">{{ status === 'requesting' ? 'Waiting for the first location reading.' : 'No location reading is available.' }}</p>
    <p v-if="!isDemo && current && current.accuracy >= approximateLocationThresholdMeters">
      Your device is reporting an approximate location. Enable precise location for your browser if available,
      then try outdoors with a clear view of the sky.
    </p>
    <dl>
      <div><dt>GPS tracking status</dt><dd>{{ message }}</dd></div>
      <div><dt>Latitude</dt><dd>{{ sample ? sample.latitude.toFixed(6) + ' degrees' : 'Unavailable' }}</dd></div>
      <div><dt>Longitude</dt><dd>{{ sample ? sample.longitude.toFixed(6) + ' degrees' : 'Unavailable' }}</dd></div>
      <div><dt>{{ isDemo ? 'Simulated accuracy' : 'Estimated accuracy' }}</dt><dd>{{ sample ? Math.round(sample.accuracy) + ' meters' : 'Unavailable' }}</dd></div>
      <div><dt>Last successful fix</dt><dd><time v-if="time" :datetime="time.toISOString()">{{ time.toLocaleString() }}</time><template v-else>Unavailable</template></dd></div>
      <div><dt>Fix age</dt><dd>{{ fixAge }}</dd></div>
    </dl>
  </section>

  <details class="diagnostics" @toggle="diagnosticsOpen = ($event.currentTarget as HTMLDetailsElement).open">
    <summary>Developer location diagnostics</summary>
    <dl v-if="diagnosticsOpen">
      <div><dt>Location provider</dt><dd>{{ isDemo ? 'VisionAid simulator' : 'Browser Geolocation (navigator.geolocation)' }}</dd></div>
      <div><dt>Fix status</dt><dd>{{ current ? (isDemo ? 'Simulated' : 'Current device estimate') : (sample ? 'Historical' : 'No fix') }}</dd></div>
      <div><dt>Latitude</dt><dd>{{ sample?.latitude ?? 'Unavailable' }}</dd></div>
      <div><dt>Longitude</dt><dd>{{ sample?.longitude ?? 'Unavailable' }}</dd></div>
      <div><dt>Estimated accuracy</dt><dd>{{ sample ? sample.accuracy + ' meters' : 'Unavailable' }}</dd></div>
      <div><dt>Fix timestamp (UTC)</dt><dd>{{ time?.toISOString() ?? 'Unavailable' }}</dd></div>
      <div><dt>Fix age</dt><dd>{{ fixAge }}</dd></div>
    </dl>
  </details>

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
.diagnostics { margin-block: 1rem; }
.diagnostics summary {
  cursor: pointer;
  min-height: 44px;
  box-sizing: border-box;
  padding: .55rem .75rem;
  border: 1px solid #49615c;
  border-radius: .4rem;
  font-weight: 700;
}
</style>
