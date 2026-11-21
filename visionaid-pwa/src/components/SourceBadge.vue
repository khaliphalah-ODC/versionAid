<script setup lang="ts">
defineProps<{ source: 'simulator' | 'verified-device' }>()
</script>

<template>
  <p class="source-badge">{{ source === 'simulator' ? 'DEMO — SIMULATED DATA' : 'LIVE DEVICE' }}</p>
</template>

<style scoped>
.source-badge {
  display: inline-block;
  padding: .45rem .75rem;
  border-radius: .35rem;
  background: #f4dfac;
  color: #452c06;
  font-weight: 700;
  font-size: .875rem;
}
</style>
