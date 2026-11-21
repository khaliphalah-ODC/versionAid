<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const online = ref(navigator.onLine)
const offlineReady = ref(false)
const applyingUpdate = ref(false)
const updateError = ref(false)
const { needRefresh, updateServiceWorker } = useRegisterSW()

function syncNetworkStatus() {
  online.value = navigator.onLine
}

async function applyUpdate() {
  applyingUpdate.value = true
  updateError.value = false
  try {
    await updateServiceWorker()
  } catch {
    updateError.value = true
    applyingUpdate.value = false
  }
}

onMounted(() => {
  window.addEventListener('online', syncNetworkStatus)
  window.addEventListener('offline', syncNetworkStatus)
  syncNetworkStatus()
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    void navigator.serviceWorker.ready.then(() => { offlineReady.value = true })
  }
})
onUnmounted(() => {
  window.removeEventListener('online', syncNetworkStatus)
  window.removeEventListener('offline', syncNetworkStatus)
})
</script>

<template>
  <aside aria-label="App availability">
    <div role="status">
      <p v-if="!online">Offline. The simulator runs on this device.</p>
      <p v-else-if="offlineReady && !needRefresh">VisionAid is ready to open offline.</p>
    </div>

    <div :class="{ update: needRefresh }">
      <div role="status">
        <p v-if="needRefresh">A VisionAid update is ready. Applying it reloads the app and restarts the simulator.</p>
      </div>
      <template v-if="needRefresh">
        <button type="button" :disabled="applyingUpdate" @click="applyUpdate">
          {{ applyingUpdate ? 'Applying update…' : 'Update and reload' }}
        </button>
        <button type="button" :disabled="applyingUpdate" @click="needRefresh = false">Later</button>
        <p v-if="updateError" role="alert">The update could not be applied. Try again when you are ready.</p>
      </template>
    </div>
  </aside>
</template>

<style scoped>
p, .update { margin-block: 0 1rem; }
aside > [role='status'] > p, .update {
  border: 1px solid #aab9b5;
  border-radius: .4rem;
  padding: .75rem 1rem;
  background: white;
}
button {
  min-height: 44px;
  margin: 0 .5rem .5rem 0;
  padding: .45rem .75rem;
  border: 1px solid #49615c;
  border-radius: .4rem;
  background: #102e2c;
  color: #fff;
  font: inherit;
  cursor: pointer;
}
</style>
