import { pipe } from '@idlesummer/task-runner'
import type { Context } from '@idlesummer/task-runner'

interface BuildContext extends Context {
  configured?: boolean
  compiled?: boolean
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const pipeline = pipe<BuildContext>([
    {
      name: 'Configure project',
      run: async () => {
        await delay(500)
        return { configured: true }
      },
    },
    {
      name: 'Compile TypeScript',
      onError: (error) => `Compilation failed: ${error.message}`,
      run: async () => {
        await delay(800)
        throw new Error('Type error in src/index.ts:42')  // Simulate a compilation error
      },
    },
    {
      name: 'Run tests',
      run: async () => {
        await delay(600)
        return { compiled: true }
      },
    },
  ])

  try {
    const result = await pipeline.run({})
    console.log(`\nBuild completed in ${result.duration}ms`)
  }
  catch {
    // Pipeline already displayed the error with spinner
    process.exit(1)
  }
}

await main()
