// @vitest-environment jsdom
import { createApp, nextTick, type App } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TelemetryView from '../src/views/TelemetryView.vue'

let app: App
let container: HTMLDivElement

function selectScenario(value: string) {
  const select = container.querySelector<HTMLSelectElement>('select')!
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
  return nextTick()
}

function alertText() {
  return container.querySelector('[data-state]')?.textContent
}

function sampleTimestamp() {
  return container.querySelector('time')?.dateTime
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-21T12:00:00Z'))
  container = document.createElement('div')
  app = createApp(TelemetryView, { heading: 'Monitoring', description: 'Simulated samples.' })
  app.mount(container)
})

afterEach(() => {
  app.unmount()
  vi.useRealTimers()
})

describe('simulated telemetry', () => {
  it('renders three labeled readings and all five selectable outcomes', async () => {
    expect(container.textContent).toContain('DEMO — SIMULATED DATA')
    expect([...container.querySelectorAll('article')].map((card) => card.getAttribute('aria-label')))
      .toEqual(['Front sensor', 'Left sensor', 'Right sensor'])
    expect(alertText()).toBe('No obstacle detected in current readings.')

    await selectScenario('left-obstruction')
    expect(alertText()).toBe('Obstacle detected: left, 35 cm.')

    await selectScenario('front-obstruction')
    expect(alertText()).toBe('Obstacle detected: front, 25 cm.')

    await selectScenario('sensor-failure')
    expect(alertText()).toBe('Sensor reading unavailable. Status unknown.')
    expect(container.querySelector('[aria-label="Front sensor"]')?.textContent).toContain('Invalid reading')

    await selectScenario('stale')
    expect(alertText()).toBe('Data not updating. Status unknown.')
    const staleTimestamp = sampleTimestamp()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(sampleTimestamp()).toBe(staleTimestamp)
    expect(container.textContent?.match(/Stale reading/g)).toHaveLength(3)

    await selectScenario('normal')
    expect(alertText()).toBe('No obstacle detected in current readings.')
  })

  it('updates timestamps during playback, expires paused data, and refreshes on resume', async () => {
    const initialTimestamp = sampleTimestamp()
    await vi.advanceTimersByTimeAsync(1_000)
    const currentTimestamp = sampleTimestamp()
    expect(currentTimestamp).not.toBe(initialTimestamp)

    const playbackButton = [...container.querySelectorAll('button')].find(button => button.textContent === 'Pause playback')!
    playbackButton.click()
    await vi.advanceTimersByTimeAsync(4_000)
    expect(sampleTimestamp()).toBe(currentTimestamp)
    expect(alertText()).toBe('Data not updating. Status unknown.')

    playbackButton.click()
    await nextTick()
    expect(sampleTimestamp()).not.toBe(currentTimestamp)
    expect(alertText()).toBe('No obstacle detected in current readings.')
  })

  it('reads a labeled summary of simulated readings when requested', async () => {
    await selectScenario('left-obstruction')
    const button = [...container.querySelectorAll('button')].find(item => item.textContent === 'Read Sensor Status')!
    button.click()
    await nextTick()
    await nextTick()
    expect(container.querySelector('.status-result')?.textContent).toContain('Simulated data.')
    expect(container.querySelector('.status-result')?.textContent).toContain('left sensor reports 35 centimeters. Obstacle detected.')
  })

  it('coalesces rapid changes and leaves the announcement alone during repeated samples', async () => {
    const status = container.querySelector('[role="status"]')!
    await selectScenario('left-obstruction')
    expect(status.textContent).toBe('')
    await vi.advanceTimersByTimeAsync(500)
    await selectScenario('front-obstruction')
    await vi.advanceTimersByTimeAsync(750)
    expect(status.textContent).toBe('Obstacle detected: front, 25 cm.')

    const callback = vi.fn()
    const playbackObserver = new MutationObserver(callback)
    playbackObserver.observe(status, { childList: true, characterData: true, subtree: true })
    await vi.advanceTimersByTimeAsync(5_000)
    expect(callback).not.toHaveBeenCalled()
    playbackObserver.disconnect()
  })
})
