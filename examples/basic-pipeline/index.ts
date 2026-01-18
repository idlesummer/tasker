import { pipe, type Context } from '@idlesummer/task-runner'

// Define your context type
interface MyContext extends Context {
  message?: string
  count?: number
}

// Create a pipeline with tasks
const pipeline = pipe<MyContext>([
  {
    name: 'Initialize',
    run: async () => {
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { message: 'Hello', count: 0 }
    },
  },
  {
    name: 'Process data',
    run: async (ctx) => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return { count: (ctx.count ?? 0) + 10 }
    },
    onSuccess: (ctx) => `Processed data (count: ${ctx.count})`,
  },
  {
    name: 'Finalize',
    run: async (ctx) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      console.log(`\nFinal result: ${ctx.message} - Count is ${ctx.count}`)
    },
  },
])

// Run the pipeline
pipeline.run({}).then(result => {
  console.log(`\nPipeline completed in ${result.duration}ms`)
}).catch(error => {
  console.error('Pipeline failed:', error.message)
  process.exit(1)
})
