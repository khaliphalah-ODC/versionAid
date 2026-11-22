<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ReadStatus from '../components/ReadStatus.vue'
import SensorCard from '../components/SensorCard.vue'
import SourceBadge from '../components/SourceBadge.vue'
import ObstacleAlert from '../components/ObstacleAlert.vue'
import { simulate, type SimulatorScenario } from '../data-sources/simulator'
import { isValidDistance, snapshotStatus, OBSTACLE_THRESHOLD_CM } from '../domain/device'
import { evaluateObstacle } from '../domain/evaluateObstacle'

defineProps<{ heading: string; description: string }>()

const scenarios: Record<SimulatorScenario, string> = {
  normal: 'Normal readings',
  'left-obstruction': 'Left obstruction',
  'front-obstruction': 'Front obstruction',
  'sensor-failure': 'Sensor failure',
  stale: 'Stale data',
}

const SAMPLE_INTERVAL_MS = 1_000
const scenario = ref<SimulatorScenario>('normal')
const playing = ref(true)
const playbackStatus = computed(() => {
  if (!playing.value) return 'Playback paused'
  if (scenario.value === 'stale') return 'Stale scenario is holding the last sample'
  return 'Playback running'
})
const now = ref(Date.now())
const snapshot = ref(simulate(scenario.value, now.value))
const freshness = computed(() => snapshotStatus(snapshot.value, now.value))
const evaluation = computed(() => evaluateObstacle(snapshot.value, now.value))
const sensorSummary = computed(() => {
  const readings = Object.values(snapshot.value.readings).map(({ direction, distanceCm, status }) => {
    if (freshness.value === 'stale' || status === 'stale') return `${direction} sensor data is outdated.`
    if (freshness.value !== 'fresh' || status !== 'valid' || !isValidDistance(distanceCm)) {
      return `${direction} sensor reading unavailable.`
    }
    const warning = distanceCm < OBSTACLE_THRESHOLD_CM ? ' Obstacle detected.' : ''
    return `${direction} sensor reports ${distanceCm} centimeters.${warning}`
  })
  return 'Simulated data. ' + readings.join(' ')
})
const sampleTime = computed(() => new Date(snapshot.value.receivedAt))
const sampleAge = computed(() => Math.floor(Math.max(0, now.value - snapshot.value.receivedAt) / 1_000))
let timer: ReturnType<typeof setInterval> | undefined

function captureSample() {
  now.value = Date.now()
  snapshot.value = simulate(scenario.value, now.value)
}

function togglePlayback() {
  playing.value = !playing.value
  if (playing.value && scenario.value !== 'stale') captureSample()
}

onMounted(() => {
  timer = setInterval(() => {
    if (playing.value && scenario.value !== 'stale') {
      captureSample()
    } else {
      now.value = Date.now()
    }
  }, SAMPLE_INTERVAL_MS)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <h1>{{ heading }}</h1>
  <SourceBadge source="simulator" />
  <p>{{ description }}</p>

  <ObstacleAlert :evaluation="evaluation" />

  <div class="sensors">
    <SensorCard
      v-for="reading in snapshot.readings"
      :key="reading.direction"
      :reading="reading"
      :freshness="freshness"
    />
  </div>

  <p>
    Last sample <time :datetime="sampleTime.toISOString()">{{ sampleTime.toLocaleTimeString() }}</time>
    ({{ sampleAge }} s ago)
  </p>
  <ReadStatus label="Read Sensor Status" :message="sensorSummary" />
  <p>Obstacle threshold is below {{ OBSTACLE_THRESHOLD_CM }} cm.</p>

  <section class="controls" aria-labelledby="simulator-heading">
    <h2 id="simulator-heading">Simulator controls</h2>
    <div class="control-row">
      <div class="scenario">
        <label for="scenario">Scenario</label>
        <select id="scenario" v-model="scenario" @change="captureSample">
          <option v-for="(label, value) in scenarios" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
      <button type="button" @click="togglePlayback">{{ playing ? 'Pause playback' : 'Resume playback' }}</button>
    </div>
    <p class="playback">{{ playbackStatus }}</p>
  </section>
</template>

<style scoped>
.sensors {
  display: grid;
  gap: .75rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  margin-block-start: 1rem;
}
.controls {
  padding: 1.25rem;
  border: 1px solid #aab9b5;
  background: #fff;
  border-radius: .75rem;
}
.controls h2 { margin-block: 0 .75rem; }
.control-row { display: flex; align-items: end; flex-wrap: wrap; gap: .75rem; }
.scenario { display: grid; gap: .25rem; flex: 1 1 14rem; min-width: 0; }
label { font-weight: 700; }
select, button {
  max-width: 100%;
  min-height: 44px;
  padding: .45rem .75rem;
  border: 1px solid #49615c;
  border-radius: .4rem;
  font: inherit;
}
select { background: #fff; color: inherit; }
button { background: #102e2c; color: #fff; cursor: pointer; }
.playback { margin-block: .75rem 0; }
</style>
