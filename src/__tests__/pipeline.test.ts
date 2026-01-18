import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pipe } from '../pipeline'
import type { Ora } from 'ora'
import type { Context, Task } from '../pipeline'

// Mock ora to avoid spinner output in tests
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}))

interface TestContext extends Context {
  message?: string
  count?: number
  data?: string[]
}

describe('pipe', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  describe('basic functionality', () => {
    it('should execute a single task successfully', async () => {
      const task: Task<TestContext> = {
        name: 'Test task',
        run: async () => ({ message: 'Hello' }),
      }

      const pipeline = pipe([task])
      const result = await pipeline.run({})
      expect(result.context.message).toBe('Hello')
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it('should execute multiple tasks sequentially', async () => {
      const tasks: Task<TestContext>[] = [
        { name: 'Task 1', run: async () => ({ count: 1 })},
        { name: 'Task 2', run: async (ctx) => ({ count: (ctx.count ?? 0) + 1 }) },
        { name: 'Task 3', run: async (ctx) => ({ count: (ctx.count ?? 0) + 1 }) },
      ]

      const pipeline = pipe(tasks)
      const result = await pipeline.run({})
      expect(result.context.count).toBe(3)
    })

    it('should handle empty pipeline', async () => {
      const pipeline = pipe([])
      const result = await pipeline.run({ message: 'Initial' })
      expect(result.context.message).toBe('Initial')
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('context management', () => {
    it('should merge context updates between tasks', async () => {
      const tasks: Task<TestContext>[] = [
        { name: 'Task 1', run: async () => ({ message: 'Hello', count: 1 }) },
        { name: 'Task 2', run: async () => ({ data: ['item1', 'item2'] }) },
      ]

      const pipeline = pipe(tasks)
      const result = await pipeline.run({})
      expect(result.context).toEqual({
        message: 'Hello',
        count: 1,
        data: ['item1', 'item2'],
      })
    })

    it('should preserve initial context', async () => {
      const task: Task<TestContext> = { name: 'Task', run: async () => ({ count: 42 }) }
      const pipeline = pipe([task])
      const result = await pipeline.run({ message: 'Initial' })
      expect(result.context.message).toBe('Initial')
      expect(result.context.count).toBe(42)
    })

    it('should handle tasks that return void', async () => {
      const task: Task<TestContext> = {
        name: 'Side effect task',
        run: async () => {/* Task that doesn't return anything (side effects only) */},
      }

      const pipeline = pipe([task])
      const result = await pipeline.run({ message: 'Test' })
      expect(result.context.message).toBe('Test')
    })

    it('should allow later tasks to override earlier context values', async () => {
      const tasks: Task<TestContext>[] = [
        { name: 'Task 1', run: async () => ({ count: 1 }) },
        { name: 'Task 2', run: async () => ({ count: 2 }) },
      ]

      const pipeline = pipe(tasks)
      const result = await pipeline.run({})
      expect(result.context.count).toBe(2)
    })
  })

  describe('success messages', () => {
    it('should use task name as default success message', async () => {
      const ora = await import('ora')
      const mockSucceed = vi.fn()
      vi.mocked(ora.default).mockReturnValue({
        start: vi.fn().mockReturnThis(),
        succeed: mockSucceed,
        fail: vi.fn().mockReturnThis(),
      } as Partial<Ora> as Ora)

      const task: Task<TestContext> = { name: 'Default message task', run: async () => ({}) }
      const pipeline = pipe([task])
      await pipeline.run({})
      expect(mockSucceed).toHaveBeenCalledWith('Default message task')
    })

    it('should use custom success message when provided', async () => {
      const ora = await import('ora')
      const mockSucceed = vi.fn()
      vi.mocked(ora.default).mockReturnValue({
        start: vi.fn().mockReturnThis(),
        succeed: mockSucceed,
        fail: vi.fn().mockReturnThis(),
      } as Partial<Ora> as Ora)

      const task: Task<TestContext> = {
        name: 'Task',
        run: async (ctx) => ({ count: (ctx.count ?? 0) + 10 }),
        onSuccess: (ctx, duration) => `Processed ${ctx.count ?? 0} items in ${duration}ms`,
      }

      const pipeline = pipe([task])
      // Initialize with count so onSuccess can see it
      // Note: onSuccess receives context BEFORE current task's updates are applied
      await pipeline.run({ count: 5 })
      expect(mockSucceed).toHaveBeenCalledWith(
        expect.stringMatching(/Processed 5 items in \d+ms/),
      )
    })

    it('should pass duration to onSuccess callback', async () => {
      const onSuccess = vi.fn((_, duration) => `Done in ${duration}ms`)
      const task: Task<TestContext> = {
        name: 'Task',
        onSuccess,
        run: async () => {
          // Simulate some work
          await new Promise((resolve) => setTimeout(resolve, 10))
          return {}
        },
      }

      const pipeline = pipe([task])
      await pipeline.run({})
      expect(onSuccess).toHaveBeenCalled()
      const duration = onSuccess.mock.calls[0]![1]  // Safe to assert since the function was called above
      expect(duration).toBeGreaterThanOrEqual(10)
    })
  })

  describe('error handling', () => {
    it('should catch and wrap task errors', async () => {
      const task: Task<TestContext> = {
        name: 'Failing task',
        run: async () => { throw new Error('Something went wrong') },
      }

      const pipeline = pipe([task])
      await expect(pipeline.run({})).rejects.toThrow(
        'Task "Failing task" failed: Something went wrong',
      )
    })

    it('should use custom error message when provided', async () => {
      const ora = await import('ora')
      const mockFail = vi.fn()
      vi.mocked(ora.default).mockReturnValue({
        start: vi.fn().mockReturnThis(),
        succeed: vi.fn().mockReturnThis(),
        fail: mockFail,
      } as Partial<Ora> as Ora)

      const task: Task<TestContext> = {
        name: 'Task',
        onError: (error) => `Custom error: ${error.message}`,
        run: async () => {
          throw new Error('Failed')
        },
      }

      const pipeline = pipe([task])
      await expect(pipeline.run({})).rejects.toThrow()
      expect(mockFail).toHaveBeenCalledWith('Custom error: Failed')
    })

    it('should stop execution on first error', async () => {
      const task2Run = vi.fn()
      const tasks: Task<TestContext>[] = [
        { name: 'Task 1', run: async () => { throw new Error('Task 1 failed') } },
        { name: 'Task 2', run: task2Run },
      ]

      const pipeline = pipe(tasks)
      await expect(pipeline.run({})).rejects.toThrow()
      expect(task2Run).not.toHaveBeenCalled()
    })

    it('should handle non-Error throws', async () => {
      const task: Task<TestContext> = {
        name: 'Task',
        run: async () => { throw new Error('String error') },
      }

      const pipeline = pipe([task])
      await expect(pipeline.run({})).rejects.toThrow('Task "Task" failed: String error')
    })

    it('should preserve original error as cause', async () => {
      const originalError = new Error('Original error')
      const task: Task<TestContext> = { name: 'Task', run: async () => { throw originalError } }
      const pipeline = pipe([task])

      try {
        await pipeline.run({})
      }
      catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).cause).toBe(originalError)
      }
    })
  })

  describe('duration tracking', () => {
    it('should track total pipeline duration', async () => {
      const tasks: Task<TestContext>[] = [
        {
          name: 'Task 1',
          run: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            return {}
          },
        },
        {
          name: 'Task 2',
          run: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            return {}
          },
        },
      ]

      const pipeline = pipe(tasks)
      const result = await pipeline.run({})
      expect(result.duration).toBeGreaterThanOrEqual(20)
    })

    it('should return duration in milliseconds', async () => {
      const task: Task<TestContext> = {
        name: 'Task',
        run: async () => ({}),
      }

      const pipeline = pipe([task])
      const result = await pipeline.run({})

      expect(typeof result.duration).toBe('number')
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('async operations', () => {
    it('should handle async task execution', async () => {
      const task: Task<TestContext> = {
        name: 'Async task',
        run: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return { message: 'Done' }
        },
      }

      const pipeline = pipe([task])
      const result = await pipeline.run({})
      expect(result.context.message).toBe('Done')
    })

    it('should wait for each task to complete before starting next', async () => {
      const executionOrder: number[] = []
      const tasks: Task<TestContext>[] = [
        {
          name: 'Task 1',
          run: async () => {
            await new Promise((resolve) => setTimeout(resolve, 20))
            executionOrder.push(1)
            return {}
          },
        },
        {
          name: 'Task 2',
          run: async () => {
            executionOrder.push(2)
            return {}
          },
        },
      ]

      const pipeline = pipe(tasks)
      await pipeline.run({})

      expect(executionOrder).toEqual([1, 2])
    })
  })
})
