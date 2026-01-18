import { pipe, duration, bytes } from '@idlesummer/task-runner'
import type { Context } from '@idlesummer/task-runner'

interface BuildContext extends Context {
  outputDir?: string
  filesCompiled?: number
  bundleSize?: number
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const build = pipe<BuildContext>([
    {
      name: 'Clean output directory',
      run: async () => {
        await delay(300)
        return { outputDir: './dist' }
      },
    },
    {
      name: 'Compile TypeScript',
      run: async () => {
        await delay(2000)
        return { filesCompiled: 12 }
      },
      onSuccess: (ctx, taskDuration) => `Compiled ${ctx.filesCompiled} files in ${duration(taskDuration)}`,
    },
    {
      name: 'Generate type definitions',
      run: async () => {
        await delay(1000)
      },
    },
    {
      name: 'Bundle and minify',
      run: async () => {
        await delay(1500)
        return { bundleSize: 45600 }
      },
      onSuccess: (ctx) => `Created bundle (${bytes(ctx.bundleSize!)})`,
    },
  ])

  try {
    const result = await build.run({})
    console.log(`\n✓ Build completed in ${duration(result.duration)}`)
  } catch {
    process.exit(1)
  }
}

await main()

