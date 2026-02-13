import ora from 'ora'

/** Base context type - extend this to add your own properties */
export type Context = Record<string, unknown>

/**
 * A task that runs in a pipeline
 * @template TContext - The context type for this task
 * @property name - Task name shown in spinner
 * @property run - Task implementation - return updates to merge into context
 * @property onSuccess - Optional success message (default: task name)
 * @property onError - Optional error message (default: task name)
 */
export interface Task<TContext extends Context> {
  name: string
  run: (ctx: TContext) => Promise<Partial<TContext> | void>
  onSuccess?: (ctx: TContext, duration: number) => string
  onError?: (error: Error) => string
}

/**
 * Result after running a pipeline
 * @template TContext - The context type
 * @property context - Final context after all tasks
 * @property duration - Total duration in milliseconds
 */
export type PipeResult<TContext extends Context> = {
  context: TContext
  duration: number
}

/**
 * Creates a task pipeline that runs tasks sequentially with spinners
 * @template TContext - The context type for the pipeline
 * @param tasks - Array of tasks (supports conditional spreading with falsy values)
 */
export function pipe<TContext extends Context>(
  tasks: (Task<TContext> | false | null | undefined)[]
) {
  return {
    run: async (initialContext: TContext) => {
      const startTime = Date.now()
      let context = initialContext

      for (const task of tasks) {
        // Skip falsy values (supports conditional spreading)
        if (!task) continue
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
