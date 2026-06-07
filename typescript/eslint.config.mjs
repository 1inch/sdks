import oneInchEslintConfig from '@1inch/eslint-config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default [
  ...oneInchEslintConfig,
  {
    settings: {
      'import-x/resolver': {
        typescript: {
          project: [
            path.join(__dirname, 'tsconfig.json'),
            path.join(__dirname, '*/tsconfig.json'),
          ],
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.mts', '.json'],
        },
      },
    },
    rules: {
      'import-x/no-unresolved': [
        'error',
        { ignore: ['^@contracts/'] },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]
