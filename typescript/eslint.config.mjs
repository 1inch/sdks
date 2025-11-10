import oneInchEslintConfig from '@1inch/eslint-config'

export default [
  ...oneInchEslintConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]
