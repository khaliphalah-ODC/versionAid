// @vitest-environment jsdom
import { createApp, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppShell from '../src/App.vue'
import DeviceView from '../src/views/DeviceView.vue'
import AccessibilitySettingsView from '../src/views/AccessibilitySettingsView.vue'
import { prefersReducedMotion, setAccessibilityPreference } from '../src/services/accessibilityPreferences'
import { cancelVoice, speakTransition, voiceActive } from '../src/services/voiceFeedback'

let app: App | undefined
let host: HTMLElement
const storageKey = 'visionaid.accessibility'

function button(label: string) {
  return [...host.querySelectorAll('button')].find(item => item.textContent?.trim() === label)!
}

beforeEach(() => {
  host = document.createElement('div')
  document.body.append(host)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  setAccessibilityPreference('textSize', 'normal')
  setAccessibilityPreference('highContrast', false)
  setAccessibilityPreference('reduceMotion', false)
  setAccessibilityPreference('voiceFeedback', false)
  localStorage.removeItem(storageKey)
  Reflect.deleteProperty(navigator, 'bluetooth')
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('VisionAid accessibility', () => {
  it('applies and persists text size, contrast, and motion preferences and manages route focus', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<h1>Home</h1>' }, meta: { title: 'Home' } },
        { path: '/settings', component: AccessibilitySettingsView, meta: { title: 'Accessibility Settings' } },
        ...['/dashboard', '/monitor', '/gps', '/device'].map(path => ({ path, component: DeviceView })),
      ],
    })
    await router.push('/')
    app = createApp(AppShell).use(router)
    app.mount(host)
    host.querySelector<HTMLAnchorElement>('.skip')?.click()
    expect(document.activeElement?.id).toBe('main-content')
    await router.push('/settings')
    await nextTick()
    expect(document.title).toBe('Accessibility Settings | VisionAid')
    expect(document.activeElement?.id).toBe('main-content')
    expect(host.querySelector('a[aria-current="page"]')?.textContent).toContain('Accessibility Settings')

    host.querySelectorAll<HTMLInputElement>('input[type="radio"]')[2].click()
    const [contrast, motion] = host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    contrast.click()
    motion.click()
    await nextTick()
    expect(document.documentElement.dataset.textSize).toBe('extra-large')
    expect(document.documentElement.dataset.contrast).toBe('high')
    expect(document.documentElement.dataset.motion).toBe('reduce')
    expect(prefersReducedMotion()).toBe(true)
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
      textSize: 'extra-large', highContrast: true, reduceMotion: true, voiceFeedback: false,
    })
  })

  it('exposes the system reduced-motion preference', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    expect(prefersReducedMotion()).toBe(true)
  })

  it('explains when speech synthesis is unavailable', () => {
    app = createApp(AccessibilitySettingsView)
    app.mount(host)
    expect(button('Test Voice').disabled).toBe(true)
    expect(host.textContent).toContain('Voice synthesis is unavailable')
  })

  it('tests, stops, and rate-limits optional spoken status', async () => {
    vi.useFakeTimers()
    const speak = vi.fn()
    const cancel = vi.fn()
    vi.stubGlobal('speechSynthesis', { speak, cancel })
    vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} })
    app = createApp(AccessibilitySettingsView)
    app.mount(host)
    button('Test Voice').click()
    await nextTick()
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'This is a VisionAid voice feedback test.' }))
    expect(voiceActive.value).toBe(true)
    button('Stop Voice').click()
    expect(cancel).toHaveBeenCalledOnce()
    expect(voiceActive.value).toBe(false)

    speakTransition('sensor', 'Obstacle on left.')
    expect(speak).toHaveBeenCalledTimes(1)
    setAccessibilityPreference('voiceFeedback', true)
    speakTransition('sensor', 'Obstacle on left.')
    speakTransition('sensor', 'Obstacle on right.')
    expect(speak).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(2_000)
    speakTransition('sensor', 'Obstacle on left.')
    expect(speak).toHaveBeenCalledTimes(2)
    speakTransition('sensor', 'Obstacle on right.')
    expect(speak).toHaveBeenCalledTimes(3)
    setAccessibilityPreference('voiceFeedback', false)
    expect(voiceActive.value).toBe(false)
    cancelVoice()
  })

  it.each(['unsupported', 'error'])('explains %s Bluetooth and blocks unverified pairing', async (scenario) => {
    if (scenario === 'error') {
      Object.defineProperty(navigator, 'bluetooth', {
        configurable: true, value: { getAvailability: vi.fn().mockRejectedValue(new Error('Bluetooth check failed')) },
      })
    }
    app = createApp(DeviceView)
    app.mount(host)
    await Promise.resolve()
    await nextTick()
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      scenario === 'error' ? 'Bluetooth error' : 'Bluetooth is unavailable',
    )
    expect(button('Connect Cane').disabled).toBe(true)
    button('Read Device Status').click()
    await nextTick()
    await nextTick()
    expect(host.querySelector('.status-result')?.textContent).toContain('Cane pairing is unavailable')
  })
})
