import { reactive, readonly, watch } from 'vue'

const storageKey = 'visionaid.accessibility'
const defaults = {
  textSize: 'normal' as 'normal' | 'large' | 'extra-large',
  highContrast: false,
  reduceMotion: false,
  voiceFeedback: false,
}
type Preferences = typeof defaults

function loadPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    return {
      textSize: saved?.textSize === 'large' || saved?.textSize === 'extra-large' ? saved.textSize : 'normal',
      highContrast: saved?.highContrast === true,
      reduceMotion: saved?.reduceMotion === true,
      voiceFeedback: saved?.voiceFeedback === true,
    }
  } catch {
    return { ...defaults }
  }
}

const preferences = reactive(loadPreferences())
export const accessibilityPreferences = readonly(preferences)

export function setAccessibilityPreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
  preferences[key] = value
}

watch(preferences, () => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences))
  } catch {
    // Preferences still apply for the current session.
  }
}, { flush: 'sync' })

export function prefersReducedMotion() {
  return preferences.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
}
