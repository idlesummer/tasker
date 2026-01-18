import { defineConfig } from 'vitest/config'

const vitestConfig = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'examples/',
        '*.config.*',
        '**/*.d.ts',
      ],
    },
  },
})

export default vitestConfig
