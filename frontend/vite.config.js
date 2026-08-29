import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      'preprod.dsp5-archi-o24a-g2.fr',
      'preprod.dsp5-archi-o24a-g2.com',
      'furious-duck-dev-live-frontend-1',
      'furious-duck-dev-live-frontend-2',
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setupTests.jsx',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/test/**',
        'src/**/*.test.{js,jsx}',
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
})
