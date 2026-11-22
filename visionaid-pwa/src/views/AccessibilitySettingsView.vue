<script setup lang="ts">
import { ref } from 'vue'
import { accessibilityPreferences as preferences, setAccessibilityPreference as setPreference } from '../services/accessibilityPreferences'
import { cancelVoice, speakStatus, supportsVoice } from '../services/voiceFeedback'

const voiceAvailable = supportsVoice()
const voiceMessage = ref('')

function testVoice() {
  voiceMessage.value = ''
  const failed = () => { voiceMessage.value = 'The browser could not play the voice sample. Screen-reader status is still available.' }
  if (speakStatus('This is a VisionAid voice feedback test.', { test: true, onError: failed })) {
    voiceMessage.value = 'Voice test requested.'
  } else {
    failed()
  }
}
</script>

<template>
  <h1>Accessibility Settings</h1>
  <p>Preferences apply across VisionAid and are saved in this browser.</p>

  <fieldset>
    <legend>Text size</legend>
    <label><input type="radio" name="text-size" :checked="preferences.textSize === 'normal'" @change="setPreference('textSize', 'normal')"> Normal text</label>
    <label><input type="radio" name="text-size" :checked="preferences.textSize === 'large'" @change="setPreference('textSize', 'large')"> Large text</label>
    <label><input type="radio" name="text-size" :checked="preferences.textSize === 'extra-large'" @change="setPreference('textSize', 'extra-large')"> Extra-large text</label>
  </fieldset>
  <fieldset>
    <legend>Display and motion</legend>
    <label><input type="checkbox" :checked="preferences.highContrast" @change="setPreference('highContrast', ($event.target as HTMLInputElement).checked)"> High contrast</label>
    <label><input type="checkbox" :checked="preferences.reduceMotion" @change="setPreference('reduceMotion', ($event.target as HTMLInputElement).checked)"> Always reduce motion</label>
    <p>VisionAid follows your system’s reduced-motion setting when this option is off.</p>
  </fieldset>
  <fieldset>
    <legend>Voice feedback</legend>
    <p id="voice-guidance">Optional spoken status updates may overlap with TalkBack or VoiceOver. Leave voice feedback off to use screen-reader announcements alone.</p>
    <label><input type="checkbox" :disabled="!voiceAvailable" :checked="preferences.voiceFeedback" aria-describedby="voice-guidance" @change="setPreference('voiceFeedback', ($event.target as HTMLInputElement).checked)"> Speak important status changes</label>
    <p v-if="!voiceAvailable" id="voice-unavailable">Voice synthesis is unavailable in this browser. Screen-reader announcements and text status are available.</p>
    <div class="actions">
      <button class="accessible-action" type="button" :disabled="!voiceAvailable" @click="testVoice">Test Voice</button>
      <button class="accessible-action" type="button" :disabled="!voiceAvailable" @click="cancelVoice(); voiceMessage = 'Voice feedback stopped.'">Stop Voice</button>
    </div>
    <p role="status">{{ voiceMessage }}</p>
  </fieldset>
</template>

<style scoped>
fieldset { min-inline-size: 0; margin: 1rem 0; padding: .75rem 1rem; border: 1px solid #49615c; border-radius: .5rem; }
legend { font-weight: 700; }
label { display: flex; align-items: center; gap: .55rem; min-height: 44px; }
input { width: 1.25rem; height: 1.25rem; flex: none; }
.actions { display: flex; flex-wrap: wrap; gap: .5rem; }
</style>
