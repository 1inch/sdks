// @ts-expect-error no types
import licenseHeader from 'eslint-plugin-license-header'
import config from '../eslint.config.mjs'

export default [
  ...config,
  {
    files: ['./src/**'],
    plugins: {
      'license-header': licenseHeader,
    },
    rules: {
      'license-header/header': ['error', './license-header.txt'],
    },
  },
]
