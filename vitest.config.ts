import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@backend': new URL('./backend/src', import.meta.url).pathname,
      '@client': new URL('./frontend-client/src', import.meta.url).pathname,
      '@admin': new URL('./frontend-admin/src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'backend/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/domain/**/*.ts', 'src/lib/validation/**/*.ts'],
    },
  },
})
