import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const eslintConfig = [
  // Ignores
  { ignores: ['**/node_modules', '**/dist', 'docs', 'examples', '**/*.js'] },

  // Pre-packaged configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Base config
  {
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
        },
      ],

      // Personal style
      'comma-dangle': ['warn', 'always-multiline'],
      'eol-last': ['warn', 'always'],
      'object-curly-spacing': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'never'],
    },
  },

  // Type-aware config for src/ TS files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: { '@typescript-eslint/only-throw-error': 'error' },
  },
]

export default eslintConfig
