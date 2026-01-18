// Build configuration (tsdown)
// - Controls what gets built, bundled, and emitted
// - Uses tsconfig.json for TypeScript resolution and declaration rules
// - Owns entry points, output format, sourcemaps, declarations, and externals

import { defineConfig } from 'tsdown'

const tsdownConfig = defineConfig({
  // TypeScript config
  tsconfig: './tsconfig.json',

  // Entry points
  entry: ['src/index.ts'],  // library api

  // Output format
  format: ['cjs', 'esm'],

  // Output options
  dts: true,        // emit .d.ts type declarations
  clean: true,      // clean dist/ before build
  minify: false,    // for smaller builds
  sourcemap: true,  // source maps for debugging
})

export default tsdownConfig
