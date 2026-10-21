import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Za GitHub Pages: VITE_BASE=/ime-repozitorija/ (workflow ga postavlja automatski).
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'BabyBite',
        short_name: 'BabyBite',
        description: 'Praćenje bebine hrane i obroka',
        lang: 'bs',
        theme_color: '#FFF8EE',
        background_color: '#FFF8EE',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Samo shell aplikacije se kešira. Supabase zahtjevi se NIKAD ne kešira­ju.
      workbox: { navigateFallback: 'index.html', globPatterns: ['**/*.{js,css,html,png,svg}'] },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
})
