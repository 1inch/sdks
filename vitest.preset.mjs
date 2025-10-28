import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/*.config.{js,ts,mjs,mts}',
        '**/index.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/tsdown.config.js',
      ],
    },
  },
})
