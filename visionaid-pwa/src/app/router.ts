import { createRouter, createWebHistory } from 'vue-router'
import TelemetryView from '../views/TelemetryView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import DeviceView from '../views/DeviceView.vue'
import AccessibilitySettingsView from '../views/AccessibilitySettingsView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: WelcomeView, meta: { title: 'Home' } },
    { path: '/gps', meta: { title: 'GPS Tracking' }, component: () => import('../views/GpsTrackingView.vue') },
    {
      path: '/dashboard', component: TelemetryView, meta: { title: 'Dashboard' },
      props: { heading: 'Dashboard', description: 'Review the current readings from the front, left, and right sensors.' },
    },
    {
      path: '/monitor', component: TelemetryView, meta: { title: 'Monitoring' },
      props: { heading: 'Monitoring', description: 'Watch simulated samples arrive each second during playback.' },
    },
    { path: '/device', component: DeviceView, meta: { title: 'Device connection' } },
    { path: '/settings', component: AccessibilitySettingsView, meta: { title: 'Accessibility Settings' } },
  ],
})
