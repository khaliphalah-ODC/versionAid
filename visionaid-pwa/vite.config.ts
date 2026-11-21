import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'cane-concept.jpg'],
      manifest: {
        id: '/',
        name: 'VisionAid — Seeing Beyond Sight',
        short_name: 'VisionAid',
        description: 'VisionAid smart-cane companion demonstration prototype',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#102e2c',
        background_color: '#f2f6f4',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^\/(?:dashboard|monitor|device|settings|gps)?\/?$/],
      },
    }),
  ],
})
