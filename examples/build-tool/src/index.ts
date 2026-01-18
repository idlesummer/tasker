import { pipe, duration, bytes } from '@idlesummer/task-runner'
import type { Context } from '@idlesummer/task-runner'

// Define context to track build state across tasks
interface BuildContext extends Context {
  outputDir?: string
  filesCompiled?: number
  bundleSize?: number
}

// Helper to simulate async work
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  // Create a pipeline with sequential build tasks
  const build = pipe<BuildContext>([
    {
      name: 'Clean output directory',
      run: async () => {
        await delay(300)
        // Return updates context for next tasks
        return { outputDir: './dist' }
      },
    },
    {
      name: 'Compile TypeScript',
      // Custom success message shows file count and duration
      onSuccess: (ctx, taskDuration) => `Compiled ${ctx.filesCompiled} files in ${duration(taskDuration)}`,
      run: async () => {
        await delay(2000)
        return { filesCompiled: 12 }
      },
    },
    {
      name: 'Generate type definitions',
      run: async () => {
        await delay(1000)
        // No return - just runs the task
      },
    },
    {
      name: 'Bundle and minify',
      // Use bytes() helper to format bundle size
      onSuccess: (ctx) => `Created bundle (${bytes(ctx.bundleSize!)})`,
      run: async () => {
        await delay(1500)
        return { bundleSize: 45600 }
      },
    },
  ])

  try {
    // Run all tasks sequentially
    const result = await build.run({})
    console.log(`\n✓ Build completed in ${duration(result.duration)}`)
  }
  catch {
    // Error already shown by pipeline spinner
    process.exit(1)
  }
}

await main()
