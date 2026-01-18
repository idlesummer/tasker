import ora from 'ora'

/** Base context type - extend this to add your own properties */
export type Context = Record<string, unknown>

/**
 * A task that runs in a pipeline
 * @template TContext - The context type for this task
 */
export interface Task<TContext extends Context> {
  /** Task name shown in spinner */
  name: string

  /** Task implementation - return updates to merge into context */
  run: (ctx: TContext) => Promise<Partial<TContext> | void>

  /** Optional success message (default: task name) */
  onSuccess?: (ctx: TContext, duration: number) => string

  /** Optional error message (default: task name) */
  onError?: (error: Error) => string
}

/**
 * Result after running a pipeline
 * @template TContext - The context type
 */
export type PipeResult<TContext extends Context> = {
  /** Final context after all tasks */
  context: TContext

  /** Total duration in milliseconds */
  duration: number
}

/**
 * Creates a task pipeline that runs tasks sequentially with spinners
 * @template TContext - The context type for the pipeline
 */
export function pipe<TContext extends Context>(tasks: Task<TContext>[]) {
  return {
    run: async (initialContext: TContext) => {
      const startTime = Date.now()
      let context = initialContext

      for (const task of tasks) {
        const taskStart = Date.now()
        const spinner = ora(task.name).start()

        try {
          const updates = await task.run(context) ?? {}
          const duration = Date.now() - taskStart
          const message = task.onSuccess?.(context, duration) ?? task.name
          spinner.succeed(message)
          context = { ...context, ...updates }
        }
        catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          const message = task.onError?.(err) ?? task.name
          spinner.fail(message)
          throw new Error(`Task "${task.name}" failed: ${err.message}`, { cause: err })
        }
      }

      const duration = Date.now() - startTime
      return { context, duration } as PipeResult<TContext>
    },
  }
}
