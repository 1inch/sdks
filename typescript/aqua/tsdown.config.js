import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'neutral',
  exports: {
    customExports(exports, _ctx) {
      for (const [exp, map] of Object.entries(exports)) {
        if (map instanceof Object) {
          const types = map.require.replace(/\.js$/, '.d.ts')
          exports[exp] = { types, ...map }
        }
      }

      return exports
    },
  },
  unbundle: false,
  dts: {
    build: true,
  },
  outDir: './dist',
  format: ['cjs', 'esm'],
})
