<script setup lang="ts">
import { nextTick, ref, watch, watchEffect } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { accessibilityPreferences as preferences } from './services/accessibilityPreferences'
import { cancelVoice, voiceActive } from './services/voiceFeedback'
import AppAvailability from './components/AppAvailability.vue'

const route = useRoute()
const main = ref<HTMLElement>()

watchEffect(() => {
  const root = document.documentElement
  root.dataset.textSize = preferences.textSize
  root.dataset.contrast = preferences.highContrast ? 'high' : 'standard'
  root.dataset.motion = preferences.reduceMotion ? 'reduce' : 'system'
})

watch(() => route.path, async (_path, previousPath) => {
  document.title = route.meta.title ? `${route.meta.title} | VisionAid` : 'VisionAid'
  cancelVoice()
  if (!previousPath) return
  await nextTick()
  main.value?.focus()
}, { immediate: true })
</script>

<template>
  <a class="skip" href="#main-content" @click.prevent="main?.focus()">Skip to content</a>
  <header>
    <strong class="wordmark">VisionAid</strong>
    <nav aria-label="Primary navigation">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/dashboard">Dashboard</RouterLink>
      <RouterLink to="/monitor">Monitoring</RouterLink>
      <RouterLink to="/gps"><span class="location-icon" aria-hidden="true"></span>GPS Tracking</RouterLink>
      <RouterLink to="/device">Device</RouterLink>
      <RouterLink to="/settings">Accessibility Settings</RouterLink>
    </nav>
  </header>
  <main id="main-content" ref="main" tabindex="-1">
    <AppAvailability />
    <button v-if="voiceActive" class="accessible-action" type="button" @click="cancelVoice(); main?.focus()">Stop voice feedback</button>
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
h1, h2, button, summary { overflow-wrap: anywhere; }
h1 { margin-block: 0 .5rem; line-height: 1.2; }
:focus-visible { outline: .2rem solid #b45f00; outline-offset: .2rem; }
.skip { z-index: 2; position: absolute; inset: .5rem auto auto .5rem; background: #fff; color: #102e2c; padding: .5rem; }
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
  #app { display: grid; grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr); min-height: 100dvh; }
  header { padding: 1.5rem 1rem; }
  nav { flex-direction: column; }
  main { box-sizing: border-box; width: 100%; margin: 0 auto; min-width: 0; }
}

.accessible-action {
  min-height: 44px;
  max-width: 100%;
  padding: .45rem .8rem;
  border: 1px solid #49615c;
  border-radius: .4rem;
  background: #102e2c;
  color: #fff;
  font: inherit;
  cursor: pointer;
}
.accessible-action:disabled { background: #e6eeeb; color: #42524f; cursor: default; }
:root[data-text-size="large"] { font-size: 125%; }
:root[data-text-size="extra-large"] { font-size: 150%; }

:root[data-contrast="high"] {
  background: #000;
  color: #fff;
}
[data-contrast="high"] :is(header, fieldset, dl > div, main article, .hero, .concept, .preview, .preview dl div, .controls, .status, .summary, .source-badge, aside p, aside .update) {
  background: #000 !important;
  color: #fff !important;
  border-color: #fff !important;
}
[data-contrast="high"] :is(main p, main dt, main figcaption, .hero h1 span) { color: #fff !important; }
[data-contrast="high"] :is(a, .hero .action) { color: #fff266; }
[data-contrast="high"] :is(nav a[aria-current="page"], .hero .action, button, select, summary):not(.location-map *) {
  background: #000 !important;
  color: #fff266 !important;
  border: 1px solid #fff266;
}
[data-contrast="high"] button:disabled:not(.location-map *) { color: #ddd !important; border-color: #aaa; }
[data-contrast="high"] .skip { background: #000; }
[data-contrast="high"] :focus-visible { outline-color: #fff266; }

[data-motion="reduce"] :is(*, *::before, *::after):not(.location-map *) {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
  scroll-behavior: auto !important;
}
@media (prefers-reduced-motion: reduce) {
  :is(*, *::before, *::after):not(.location-map *) {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
    scroll-behavior: auto !important;
  }
}
</style>
