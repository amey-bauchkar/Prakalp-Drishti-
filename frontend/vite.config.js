import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'PRAKALP-DRISHTI — MoSPI Central Sector Mega-Projects Decision Intelligence',
        short_name: 'PRAKALP-DRISHTI',
        description: 'MoSPI Central Sector Mega-Projects Decision Intelligence System for Cabinet Secretariat, PMO, and MoSPI.',
        theme_color: '#1E2A45',
        background_color: '#F7F8FA',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-map-tiles',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@amey': path.resolve(__dirname, './amey'),
      '@tanmay': path.resolve(__dirname, './tanmay'),
      '@parth': path.resolve(__dirname, './parth'),
      '@janhavi': path.resolve(__dirname, './janhavi'),
      '@soham': path.resolve(__dirname, './soham'),
      '@aditya': path.resolve(__dirname, './aditya'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/satellite-imagery': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
