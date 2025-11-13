import oneInchEslintConfig from '@1inch/eslint-config'

export default [
  ...oneInchEslintConfig,
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: ['typescript/tsconfig.json', 'typescript/*/tsconfig.json'],
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.mts', '.json'],
        },
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]
