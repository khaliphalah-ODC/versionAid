import { ref, watch } from 'vue'
import { accessibilityPreferences } from './accessibilityPreferences'

export const voiceActive = ref(false)
let current: SpeechSynthesisUtterance | undefined
const lastAutomatic = new Map<string, { message: string; time: number }>()

export function supportsVoice() {
  return typeof window.speechSynthesis?.speak === 'function'
    && typeof window.SpeechSynthesisUtterance === 'function'
}

export function cancelVoice() {
  if (current) {
    current = undefined
    window.speechSynthesis.cancel()
  }
  voiceActive.value = false
}

watch(() => accessibilityPreferences.voiceFeedback, (enabled) => {
  if (!enabled) {
    cancelVoice()
    lastAutomatic.clear()
  }
}, { flush: 'sync' })

export function speakStatus(message: string, options: { test?: boolean; onError?: () => void } = {}) {
  if ((!accessibilityPreferences.voiceFeedback && !options.test) || !supportsVoice()) return false
  try {
    cancelVoice()
    const utterance = new window.SpeechSynthesisUtterance(message)
    utterance.lang = document.documentElement.lang || 'en'
    const finish = (failed: boolean) => {
      if (current !== utterance) return
      current = undefined
      voiceActive.value = false
      if (failed) options.onError?.()
    }
    utterance.onend = () => finish(false)
    utterance.onerror = () => finish(true)
    current = utterance
    voiceActive.value = true
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    current = undefined
    voiceActive.value = false
    return false
  }
}

export function speakTransition(channel: string, message: string) {
  const previous = lastAutomatic.get(channel)
  const now = Date.now()
  if (previous && (now - previous.time < 1500 || (previous.message === message && now - previous.time < 10000))) return
  if (speakStatus(message)) lastAutomatic.set(channel, { message, time: now })
}
