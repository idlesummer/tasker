import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { pipe, type Context, duration, fileList } from '@idlesummer/task-runner'

// Build context with typed properties
interface BuildContext extends Context {
  outputDir?: string
  files?: string[]
  buildTime?: number
}

// Create a build pipeline
const build = pipe<BuildContext>([
  {
    name: 'Clean output directory',
    run: async (ctx) => {
      const outputDir = './dist'
      rmSync(outputDir, { recursive: true, force: true })
      mkdirSync(outputDir, { recursive: true })
      return { outputDir }
    },
  },
  {
    name: 'Compile TypeScript',
    run: async () => {
      // Simulate compilation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create some dummy output files
      mkdirSync('./dist/src', { recursive: true })
      writeFileSync('./dist/index.js', 'export * from "./src/main.js";\n')
      writeFileSync('./dist/src/main.js', 'export function main() { console.log("Hello"); }\n')
      writeFileSync('./dist/src/utils.js', 'export function util() { return 42; }\n')

      return { files: ['index.js', 'src/main.js', 'src/utils.js'] }
    },
    onSuccess: (ctx, taskDuration) => `Compiled ${ctx.files?.length} files in ${duration(taskDuration)}`,
  },
  {
    name: 'Generate type definitions',
    run: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      writeFileSync('./dist/index.d.ts', 'export * from "./src/main";\n')
      writeFileSync('./dist/src/main.d.ts', 'export declare function main(): void;\n')
      writeFileSync('./dist/src/utils.d.ts', 'export declare function util(): number;\n')
    },
  },
  {
    name: 'Bundle and minify',
    run: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Create a minified bundle
      writeFileSync('./dist/bundle.min.js', 'export function main(){console.log("Hello")}export function util(){return 42}')
    },
    onSuccess: () => 'Created production bundle',
  },
])

// Run the build
console.log('Starting build...\n')

build.run({}).then(result => {
  console.log('\nBuild output:')
  console.log(fileList('./dist'))
  console.log(`\nBuild completed in ${duration(result.duration)}`)
}).catch(error => {
  console.error('\nBuild failed:', error.message)
  process.exit(1)
})
