<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { speakStatus } from '../services/voiceFeedback'

const props = defineProps<{ label: string; message: string }>()
const summary = ref('')

async function readStatus() {
  const message = props.message
  summary.value = ''
  speakStatus(message)
  await nextTick()
  summary.value = 'Status when requested. ' + message
}
</script>

<template>
  <button class="accessible-action" type="button" @click="readStatus">{{ label }}</button>
  <p class="status-result" role="status" aria-atomic="true">{{ summary }}</p>
</template>

<style scoped>
.status-result:empty { margin: 0; }
</style>
