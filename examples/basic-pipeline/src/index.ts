import { pipe } from '@idlesummer/tasker'
import type { Context } from '@idlesummer/tasker'

// Define your context type
interface MyContext extends Context {
  message?: string
  count?: number
}

// Helper for simulating execution delays
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  // Create a pipeline with tasks
  const pipeline = pipe<MyContext>([
    {
      name: 'Initialize',
      run: async () => {
        // Simulate async work
        await delay(1000)
        return { message: 'Hello', count: 0 }
      },
    },
    {
      name: 'Process data',
      onSuccess: (ctx) => `Processed data (count: ${ctx.count!})`,
      run: async (ctx) => {
        await delay(1500)
        return { count: (ctx.count ?? 0) + 10 }
      },
    },
    {
      name: 'Finalize',
      run: async (ctx) => {
        await delay(800)
        console.log(`\nFinal result: ${ctx.message!} - Count is ${ctx.count!}`)
      },
    },
  ])

  try {
    const initialContext: MyContext = { }
    const result = await pipeline.run(initialContext)
    console.log(`\nPipeline completed in ${result.duration}ms`)
  }
  catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Pipeline failed:', err)
    process.exit(1)
  }
}

await main()
