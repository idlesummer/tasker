# API Reference

Hey! So you want to know what's actually available in this library? Cool, let me walk you through it.

## Table of Contents

- [Pipeline API](#pipeline-api)
- [Formatters](#formatters)
- [TypeScript Types](#typescript-types)

## Pipeline API

### `pipe(tasks)`

This is basically the main thing - it creates a pipeline that runs your tasks one after another. Think of it like a conveyor belt where each task does something and passes the context to the next one.

**Parameters:**
- `tasks`: Array of task objects (see below)

**Returns:** A pipeline object with a `run()` method

**Example:**
```typescript
import { pipe } from '@idlesummer/tasker'

const pipeline = pipe([
  { name: 'First task', run: async () => ({ count: 0 }) },
  { name: 'Second task', run: async (ctx) => ({ count: ctx.count + 1 }) }
])

const result = await pipeline.run({})
console.log(result.context.count) // 1
```

### Task Object

Each task in your pipeline looks like this:

```typescript
interface Task<TContext> {
  name: string                              // What shows up in the spinner
  run: (ctx) => Promise<updates | void>     // The actual work
  onSuccess?: (ctx, duration) => string     // Custom success message (optional)
  onError?: (error) => string               // Custom error message (optional)
}
```

**Properties breakdown:**

#### `name` (required)
Just a string that describes what the task does. This shows up in the terminal spinner.

```typescript
{ name: 'Building TypeScript' }
```

#### `run` (required)
This is where you actually do stuff. It gets the current context and can return updates to merge into the context.

```typescript
run: async (ctx) => {
  // Do your thing here
  const result = await someWork()

  // Return what you want to add/update in the context
  return { result }
}
```

You can also return nothing if you're just doing side effects:
```typescript
run: async (ctx) => {
  await fs.writeFile('output.txt', ctx.data)
  // No return needed
}
```

#### `onSuccess` (optional)
Want a custom message when the task finishes? Add this. Otherwise it just shows the task name.

```typescript
onSuccess: (ctx, duration) => `Processed ${ctx.count} files in ${duration}ms`
```

**Important:** The context you get here is the state *before* your task ran, not after. So if you want to show what your task produced, you'll need to track it yourself.

#### `onError` (optional)
Same deal but for when things go wrong.

```typescript
onError: (error) => `Whoops, failed: ${error.message}`
```

### `pipeline.run(initialContext)`

Once you've got your pipeline, you call `run()` to actually execute it.

**Parameters:**
- `initialContext`: Starting context object (can be empty `{}`)

**Returns:** Promise that resolves to:
```typescript
{
  context: TContext,  // Final context with all updates
  duration: number    // Total time in milliseconds
}
```

**Example:**
```typescript
const result = await pipeline.run({ startTime: Date.now() })
console.log(`Done! Took ${result.duration}ms`)
console.log(result.context)
```

## Formatters

These are just helper functions to make numbers look nice. Pretty straightforward.

### `bytes(size)`

Turns bytes into human-readable sizes. You know, like "1.23 MB" instead of "1234567".

```typescript
import { bytes } from '@idlesummer/tasker'

bytes(1000)          // "1 kB"
bytes(1234)          // "1.23 kB"
bytes(1234567)       // "1.23 MB"
bytes(1234567890)    // "1.23 GB"
```

### `duration(ms)`

Same thing but for time. Converts milliseconds to readable durations.

```typescript
import { duration } from '@idlesummer/tasker'

duration(42)         // "42ms"
duration(1234)       // "1.2s"
duration(12345)      // "12.3s"
duration(123456)     // "2m 3.5s"
duration(12345678)   // "3h 25m 45.7s"
```

### `fileList(baseDir, pattern?, width?)`

Shows a nice formatted list of files with their sizes. Super useful for showing build output.

**Parameters:**
- `baseDir`: Directory to search in
- `pattern`: Glob pattern (default: `'**/*'` - all files)
- `width`: Column width for file paths (default: `45`)

**Returns:** Formatted string you can print

```typescript
import { fileList } from '@idlesummer/tasker'

// List everything
console.log(fileList('./dist'))

// Just JavaScript files
console.log(fileList('./dist', '**/*.js'))

// TypeScript files with custom width
console.log(fileList('./src', '**/*.ts', 60))
```

**Output looks like:**
```
  dist/index.js                                  1.23 kB
  dist/utils.js                                  456 B
  dist/types.d.ts                                2.34 kB
  3 files, total:                                4.02 kB
```

**Pattern examples:**
- `'**/*'` - All files (default)
- `'*.js'` - JS files in root only
- `'**/*.ts'` - All TypeScript files recursively
- `'src/**/*.{ts,js}'` - TS and JS files in src/

## TypeScript Types

If you're using TypeScript (which you probably should), here are the types you'll need:

### `Context`

Base type for your context. Just extend this:

```typescript
import type { Context } from '@idlesummer/tasker'

interface MyContext extends Context {
  files?: string[]
  count?: number
  result?: SomeType
}
```

It's basically just `Record<string, unknown>` but typed nicely.

### `Task<TContext>`

Type for a single task. Usually you don't need to use this directly since TypeScript infers it:

```typescript
import type { Task, Context } from '@idlesummer/tasker'

interface MyContext extends Context {
  count: number
}

const task: Task<MyContext> = {
  name: 'Count stuff',
  run: async (ctx) => ({ count: ctx.count + 1 })
}
```

### `PipeResult<TContext>`

What you get back from `pipeline.run()`:

```typescript
import type { PipeResult, Context } from '@idlesummer/tasker'

interface MyContext extends Context {
  output: string
}

const result: PipeResult<MyContext> = await pipeline.run({})
// result.context has your final context
// result.duration is the total time
```

## Error Handling

When a task throws an error, the pipeline:
1. Shows a fail spinner with your custom error message (or the task name)
2. Stops execution (later tasks won't run)
3. Throws an error with details

```typescript
try {
  await pipeline.run({})
} catch (error) {
  console.error('Pipeline failed:', error.message)
  // The original error is available as error.cause
}
```

The thrown error looks like:
```
Task "Your Task Name" failed: Original error message
```

And the original error is preserved as `error.cause` if you need it.

## Context Merging

This is important to understand! Each task's return value gets merged into the context:

```typescript
const pipeline = pipe([
  {
    name: 'Task 1',
    run: async () => ({ a: 1, b: 2 })
  },
  {
    name: 'Task 2',
    run: async (ctx) => {
      console.log(ctx) // { a: 1, b: 2 }
      return { b: 3, c: 4 }
    }
  },
  {
    name: 'Task 3',
    run: async (ctx) => {
      console.log(ctx) // { a: 1, b: 3, c: 4 }
      // b got overwritten by Task 2
    }
  }
])
```

So basically:
- Each task gets the current context
- Whatever you return gets merged in (shallow merge)
- Later values overwrite earlier ones
- If you return nothing, context stays the same

## Spinners

The spinners are powered by [ora](https://github.com/sindresorhus/ora) and show up automatically. You get:

- 🔄 Spinning animation while task runs
- ✅ Green checkmark on success
- ❌ Red X on failure

You don't need to do anything special - just run your pipeline and watch it go!

---

That's pretty much it! If something's confusing or you want more examples, check out [EXAMPLES.md](./EXAMPLES.md).
