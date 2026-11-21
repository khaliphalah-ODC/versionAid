<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AppAvailability from './components/AppAvailability.vue'

const route = useRoute()
const main = ref<HTMLElement>()

watch(() => route.path, async (_path, previousPath) => {
  if (!previousPath) return
  await nextTick()
  main.value?.focus()
})
</script>

<template>
  <a class="skip" href="#main-content">Skip to content</a>
  <header>
    <strong class="wordmark">VisionAid</strong>
    <nav aria-label="Primary navigation">
      <RouterLink to="/">Welcome</RouterLink>
      <RouterLink to="/dashboard">Dashboard</RouterLink>
      <RouterLink to="/monitor">Monitoring</RouterLink>
      <RouterLink to="/gps"><span class="location-icon" aria-hidden="true"></span>GPS Tracking</RouterLink>
      <RouterLink to="/device">Device</RouterLink>
      <RouterLink to="/settings">Settings</RouterLink>
    </nav>
  </header>
  <main id="main-content" ref="main" tabindex="-1">
    <AppAvailability />
    <RouterView />
  </main>
</template>

<style>
:root {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  color: #152a28;
  background: #f2f6f4;
}
body { margin: 0; }
header { background: #102e2c; color: #fff; padding: 1rem clamp(1rem, 5vw, 3rem); }
.wordmark { font-size: 1.5rem; }
nav { display: flex; flex-wrap: wrap; gap: .25rem .5rem; margin-top: .5rem; }
nav a { color: inherit; display: inline-flex; align-items: center; min-height: 44px; padding-inline: .65rem; }
nav a[aria-current="page"] { background: #d1ebe1; color: #102e2c; border-radius: .4rem; font-weight: 700; }
main { max-width: 60rem; margin: auto; padding: 1.5rem clamp(1rem, 5vw, 3rem); }
h1 { margin-block: 0 .5rem; line-height: 1.2; }
:focus-visible { outline: .2rem solid #b45f00; outline-offset: .2rem; }
.skip { position: absolute; inset: .5rem auto auto .5rem; background: #fff; color: #102e2c; padding: .5rem; }
.skip:not(:focus) { clip-path: inset(50%); }
.location-icon {
  width: .7rem;
  height: .7rem;
  border: .15rem solid currentColor;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  margin-inline-end: .45rem;
}
@media (min-width: 62rem) {
  #app { display: grid; grid-template-columns: 13rem minmax(0, 1fr); min-height: 100dvh; }
  header { padding: 1.5rem 1rem; }
  nav { flex-direction: column; }
  main { box-sizing: border-box; width: 100%; margin: 0 auto; min-width: 0; }
}
</style>
