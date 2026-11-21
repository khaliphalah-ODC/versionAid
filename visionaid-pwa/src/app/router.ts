import { createRouter, createWebHistory } from 'vue-router'
import TelemetryView from '../views/TelemetryView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import StarterView from '../views/StarterView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: WelcomeView },
    { path: '/gps', component: () => import('../views/GpsTrackingView.vue') },
    {
      path: '/dashboard', component: TelemetryView,
      props: { heading: 'Dashboard', description: 'Review the current readings from the front, left, and right sensors.' },
    },
    {
      path: '/monitor', component: TelemetryView,
      props: { heading: 'Monitoring', description: 'Watch simulated samples arrive each second during playback.' },
    },
    {
      path: '/device', component: StarterView,
      props: { heading: 'Device connection', description: 'Bluetooth hardware integration is pending a verified device and protocol.' },
    },
    {
      path: '/settings', component: StarterView,
      props: { heading: 'Accessibility settings', description: 'Larger text, high contrast, and a voice test are planned for a later build.' },
    },
  ],
})
