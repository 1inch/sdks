import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  root: __dirname,
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reportsDirectory: '../../coverage/typescript/aqua',
      // lcov is what Codecov ingests; text keeps the console summary.
      reporter: ['text', 'html', 'lcov'],
      include: ['src'],
      exclude: ['**/index.ts', '**/constants.ts', '**/types.ts'],
      // Set just below the levels measured when these were introduced, so a
      // regression fails CI without the suite being brittle.
      thresholds: {
        statements: 97,
        branches: 99,
        functions: 80,
        lines: 97,
      },
    },
  },
})
