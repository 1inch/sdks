import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reportsDirectory: '../../coverage/typescript/shared',
      // lcov is what Codecov ingests; text keeps the console summary.
      reporter: ['text', 'html', 'lcov'],
      // Matches the aqua and swap-vm configs, which already scope coverage to
      // src and drop barrels/constants. `*.abi.ts` holds generated ABI arrays
      // with no logic to exercise.
      include: ['src'],
      exclude: ['**/index.ts', '**/constants.ts', '**/types.ts', '**/*.abi.ts'],
      // Set just below the levels measured when these were introduced, so a
      // regression fails CI without the suite being brittle. Statements/lines
      // are held down by src/test-utils (a published entry point) sitting at 0%.
      thresholds: {
        statements: 43,
        branches: 94,
        functions: 81,
        lines: 43,
      },
    },
  },
})
