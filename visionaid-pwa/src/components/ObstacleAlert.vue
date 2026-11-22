<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { speakTransition } from '../services/voiceFeedback'
import type { Evaluation } from '../domain/evaluateObstacle'

const props = defineProps<{ evaluation: Evaluation }>()

const unknownMessages = {
  incomplete: 'Sensor reading unavailable. Status unknown.',
  stale: 'Data not updating. Status unknown.',
  unavailable: 'Source unavailable. Status unknown.',
}

const message = computed(() => {
  const result = props.evaluation
  if (result.status === 'unknown') return unknownMessages[result.reason]
  if (result.status === 'none-detected') return 'No obstacle detected in current readings.'
  const locations = result.obstacles.map(({ direction, distanceCm }) => `${direction}, ${distanceCm} cm`)
  return `Obstacle detected: ${locations.join('; ')}.`
})

const announcement = ref('')
const announcementDelayMs = 750

// Coalesce quick scenario changes. Identical messages do not retrigger this watcher.
const transition = computed(() => {
  const result = props.evaluation
  if (result.status === 'obstacle') return result.obstacles.map(({ direction }) => direction).join(',')
  if (result.status === 'unknown') return result.reason
  return result.status
})
watch(transition, (_next, _previous, onCleanup) => {
  const timer = setTimeout(() => {
    announcement.value = message.value
    speakTransition('sensor', 'Simulated data. ' + message.value)
  }, announcementDelayMs)
  onCleanup(() => clearTimeout(timer))
})
</script>

<template>
  <p class="summary" :data-state="evaluation.status">{{ message }}</p>
  <p class="visually-hidden" role="status" aria-atomic="true">{{ announcement }}</p>
</template>

<style scoped>
.summary {
  border: 1px solid #497067;
  border-inline-start-width: .35rem;
  border-radius: .4rem;
  padding: .75rem 1rem;
  background: #e5f2ed;
  font-weight: 700;
}
.summary[data-state='obstacle'] {
  background: #fee9e3;
  border-color: #a53520;
  color: #651e12;
}
.summary[data-state='unknown'] {
  background: #fff0c9;
  border-color: #8b6111;
  color: #4c3308;
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
