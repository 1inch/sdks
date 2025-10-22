import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'neutral',
  exports: {
    customExports(pkg, _) {
      for (const [exp, map] of Object.entries(pkg)) {
        if (map instanceof Object) {
          const types = map.require.replace(/\.js$/, '.d.ts')
          pkg[exp] = { types, ...map }
        }
      }

      return pkg
    },
  },
  unbundle: true,
  dts: { build: true },
  outDir: './dist',
  format: ['cjs', 'esm'],
})
