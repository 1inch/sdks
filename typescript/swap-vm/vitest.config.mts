import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reportsDirectory: '../../coverage/typescript/swap-vm',
      include: ['src'],
      exclude: ['**/index.ts', '**/constants.ts', '**/types.ts'],
      // Set just below the levels measured when these were introduced, so a
      // regression fails CI without the suite being brittle.
      thresholds: {
        statements: 90,
        branches: 96,
        functions: 80,
        lines: 90,
      },
    },
  },
})
