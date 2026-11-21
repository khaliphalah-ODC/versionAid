<script setup lang="ts">
import { computed } from 'vue'
import { isValidDistance, type SensorReading } from '../domain/device'

const props = defineProps<{
  reading: SensorReading
  freshness: 'fresh' | 'stale' | 'unavailable'
}>()
const heading = computed(() => props.reading.direction[0].toUpperCase() + props.reading.direction.slice(1))
const status = computed(() => {
  if (props.freshness === 'unavailable') return 'Reading unavailable'
  if (props.freshness === 'stale' || props.reading.status === 'stale') return 'Stale reading'
  if (props.reading.status !== 'valid' || !isValidDistance(props.reading.distanceCm)) {
    return 'Invalid reading'
  }
  return 'Current reading'
})
</script>

<template>
  <article class="sensor" :aria-label="heading + ' sensor'">
    <h2>{{ heading }}</h2>
    <p v-if="status === 'Current reading'" class="distance">{{ reading.distanceCm }} cm</p>
    <p v-else class="distance" aria-hidden="true">—</p>
    <p>{{ status }}</p>
  </article>
</template>

<style scoped>
.sensor {
  padding: 1.25rem;
  background: white;
  border: 1px solid #aab9b5;
  border-radius: .75rem;
}
.sensor h2, .sensor p { margin: 0; }
.distance { font-size: 2rem; font-weight: 700; }
</style>
