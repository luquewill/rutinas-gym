/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /\/media\/ejercicios\/.*\.(mp4|jpg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-ejercicios',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 90 },
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200, 206] },
            },
          },
        ],
      },
      manifest: {
        name: 'Rutinas Gym',
        short_name: 'Rutinas',
        description: 'Armá tu semana de entrenamiento y seguí tus series.',
        lang: 'es-AR',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
