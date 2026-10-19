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
  {
    files: ['./src/**', './tests/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['assert', 'assert/strict', 'node:assert', 'node:assert/strict'].map((name) => ({
            name,
            message:
              "Node's assert module is not available in every runtime the SDK targets. Use `assert` from src/utils/assert instead.",
          })),
        },
      ],
    },
  },
]
