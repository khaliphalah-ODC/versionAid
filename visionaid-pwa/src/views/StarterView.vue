<script setup lang="ts">
defineProps<{ heading: string; description: string }>()
</script>

<template>
  <h1>{{ heading }}</h1>
  <p>{{ description }}</p>
</template>
