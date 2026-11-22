<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import ReadStatus from '../components/ReadStatus.vue'
import { speakTransition } from '../services/voiceFeedback'

const status = ref('Disconnected. No cane is connected.')
const bluetooth = (navigator as Navigator & {
  bluetooth?: { getAvailability?: () => Promise<boolean> }
}).bluetooth

onMounted(async () => {
  if (!bluetooth) {
    status.value = 'Bluetooth is unavailable. Use a secure, compatible browser to check Bluetooth support.'
    return
  }
  try {
    if (bluetooth.getAvailability && !await bluetooth.getAvailability()) {
      status.value = 'Disconnected. Bluetooth is unavailable or off. Check your device settings.'
    }
  } catch {
    status.value = 'Bluetooth error. The browser could not check availability. Check your settings and reload to try again.'
  }
})
watch(status, (message) => speakTransition('device', message))
</script>

<template>
  <h1>Device connection</h1>
  <p role="status" aria-atomic="true">{{ status }}</p>
  <button class="accessible-action" type="button" disabled aria-describedby="pairing-status">Connect Cane</button>
  <p id="pairing-status">Pairing is unavailable until the cane’s Bluetooth protocol is verified. Use Monitoring for simulated sensor readings.</p>
  <ReadStatus label="Read Device Status" :message="status + ' Cane pairing is unavailable.'" />
</template>
