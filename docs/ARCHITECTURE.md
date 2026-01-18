# Architecture

So you want to understand how this thing actually works under the hood? Cool! Let me break it down for you.

## Overview

Tasker is pretty simple honestly - it's basically three main parts:

1. **Pipeline system** - Runs tasks in order with spinners
2. **Formatters** - Makes numbers look pretty
3. **TypeScript types** - Keeps everything type-safe

That's it. No crazy abstractions or over-engineering here.

## Project Structure

```
tasker/
├── src/
│   ├── index.ts          # Main exports
│   ├── pipeline.ts       # Pipeline implementation
│   ├── format.ts         # Formatting utilities
│   └── __tests__/        # Tests
│       ├── pipeline.test.ts
│       └── format.test.ts
├── dist/                 # Built files (CJS + ESM)
├── docs/                 # Documentation (you are here!)
└── examples/             # Example projects
```

Nothing fancy - just clean separation of concerns.

## Core Concepts

### 1. Task Pipeline (`pipeline.ts`)

The pipeline is the heart of everything. Here's what happens when you call `pipe()`:

```typescript
export function pipe<TContext extends Context>(tasks: Task<TContext>[]) {
  return {
    run: async (initialContext: TContext) => {
      // Start timing
      const startTime = Date.now()
      let context = initialContext

      // Run each task
      for (const task of tasks) {
        // ... run task with spinner ...
        // ... merge results into context ...
      }

      // Return final context + duration
      return { context, duration }
    }
  }
}
```

Simple, right? It's just a loop that:
1. Starts a spinner
2. Runs the task
3. Merges the result
4. Stops the spinner
5. Moves to next task

#### Context Flow

The context flows through like this:

```
Initial Context
      ↓
   Task 1 (returns updates)
      ↓
   Merged Context
      ↓
   Task 2 (returns updates)
      ↓
   Merged Context
      ↓
   Task 3 (returns updates)
      ↓
   Final Context
```

Each task gets the current context and can add/modify properties. We use shallow merging with spread operator:

```typescript
context = { ...context, ...updates }
```

So if two tasks set the same property, the later one wins.

#### Error Handling

When a task throws, we:
1. Catch the error
2. Show a failed spinner
3. Wrap it with context about which task failed
4. Stop the pipeline (don't run remaining tasks)
5. Preserve the original error as `cause`

```typescript
catch (error) {
  const err = error instanceof Error ? error : new Error(String(error))
  spinner.fail(message)
  throw new Error(`Task "${task.name}" failed: ${err.message}`, { cause: err })
}
```

This way you know exactly where things went wrong.

#### Timing

We track time at two levels:
- **Per-task**: Start to finish of individual task
- **Total**: Entire pipeline execution

Both use `Date.now()` for millisecond precision. Nothing fancy but it works.

### 2. Formatters (`format.ts`)

These are just wrapper functions around existing libraries, plus one custom implementation for file lists.

#### `bytes()` and `duration()`

These literally just re-export from `pretty-bytes` and `pretty-ms`. We could've told users to install those directly, but having them bundled makes the API cleaner.

```typescript
export const bytes = prettyBytes
export const duration = prettyMs
```

Yeah, that's it.

#### `fileList()`

This one's more interesting. It uses `fdir` for fast file crawling and `picomatch` for glob matching:

```typescript
export function fileList(baseDir: string, pattern = '**/*', width = 45) {
  // 1. Find files
  const matcher = pm(pattern, { windows: true })
  const files = new fdir()
    .withRelativePaths()
    .filter(path => matcher(path))
    .crawl(baseDir)
    .sync()

  // 2. Get file sizes
  const stats = files.map(path => ({
    path: path.replace(/\\/g, '/'),  // Normalize for display
    size: statSync(fullPath).size
  }))

  // 3. Format output
  const lines = stats.map(({ path, size }) =>
    `  ${cyan(path.padEnd(width))}  ${dim(bytes(size))}`
  )

  // 4. Add footer
  const footer = `  ${files.length} files, total:  ${bytes(total)}`
  return [...lines, footer].join('\n')
}
```

The tricky part was getting glob patterns to work on both Windows and Unix. Windows uses backslashes (`\`) for paths, but glob patterns use forward slashes (`/`). We handle this with picomatch's `windows: true` option, which accepts both separators.

### 3. Type System

TypeScript makes this library way better to use. Here's how the types work:

#### Generic Context

Everything is generic over `TContext`:

```typescript
export type Context = Record<string, unknown>

export interface Task<TContext extends Context> {
  run: (ctx: TContext) => Promise<Partial<TContext> | void>
}
```

This means:
- You define your context shape
- TypeScript knows what properties exist
- You get autocomplete and type checking

#### Type Flow

```typescript
interface MyContext extends Context {
  count: number
}

const pipeline = pipe<MyContext>([...])
//                    ^^^^^^^^^^
//               Type flows here

const result = await pipeline.run({ count: 0 })
//    ^^^^^^
// result.context has type MyContext
```

TypeScript infers everything from that initial generic parameter. Pretty neat!

#### Partial Updates

Tasks return `Partial<TContext>` which means they can update some properties without providing all of them:

```typescript
interface MyContext extends Context {
  a: number
  b: string
  c: boolean
}

// This is fine - only updates 'a'
run: async () => ({ a: 42 })

// This is also fine - updates multiple
run: async () => ({ a: 42, b: "hi" })

// This would be an error - 'd' doesn't exist
run: async () => ({ d: "oops" })
```

## Dependencies

We keep dependencies minimal:

### Runtime Dependencies
- **ora** - Terminal spinners (the pretty animations)
- **fdir** - Fast directory traversal
- **picomatch** - Glob pattern matching
- **picocolors** - Terminal colors (used by formatters)
- **pretty-bytes** - Byte formatting
- **pretty-ms** - Duration formatting
- **tsx** - TypeScript execution (peer dependency basically)

### Dev Dependencies
- **vitest** - Testing framework
- **typescript** - Type checking
- **eslint** - Linting
- **tsdown** - Build tool (uses rolldown internally)

We specifically chose:
- `fdir` over `glob` - way faster
- `picomatch` over `minimatch` - smaller and faster
- `picocolors` over `chalk` - much smaller bundle
- `ora` because it's the best spinner library out there

## Build System

We use `tsdown` which is built on top of `rolldown`. It generates:

```
dist/
├── index.mjs         # ESM bundle
├── index.mjs.map     # ESM source map
├── index.d.mts       # ESM types
├── index.cjs         # CommonJS bundle
├── index.cjs.map     # CJS source map
└── index.d.cts       # CJS types
```

This supports both modern ESM and legacy CommonJS. The `package.json` exports field handles the mapping:

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

## Testing Strategy

We test everything with Vitest. The tests cover:

### Pipeline Tests (`pipeline.test.ts`)
- Basic functionality (single task, multiple tasks, empty pipeline)
- Context management (merging, preserving, overriding)
- Success messages (default and custom)
- Error handling (catching, wrapping, stopping)
- Duration tracking
- Async operations

### Format Tests (`format.test.ts`)
- File listing
- Glob patterns (including cross-platform path handling)
- Size calculations
- Output formatting

We mock `ora` in tests to avoid spinner output messing up the test output:

```typescript
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  }))
}))
```

## Cross-Platform Considerations

The main challenge is handling file paths on Windows vs Unix:

### The Problem
- Unix: `src/index.ts`
- Windows: `src\index.ts`
- Glob patterns: Always use `/`

### The Solution
We use `picomatch` with `windows: true` option:

```typescript
const matcher = pm(pattern, { windows: true })
```

This makes picomatch accept both `/` and `\` as path separators, so patterns work everywhere.

We also normalize display paths to always use `/`:

```typescript
const displayPath = path.replace(/\\/g, '/')
```

Because nobody wants to see `src\utils\index.ts` in their terminal output.

## Performance

Everything's designed to be fast:

- **fdir** is crazy fast for file operations (way faster than glob)
- **picomatch** compiles patterns once and reuses them
- We use sync operations where it makes sense (file crawling)
- No unnecessary async overhead

The pipeline itself has minimal overhead - it's basically just a for loop with some timing code.

## Future Considerations

Things we might add later (but haven't because YAGNI):

- Parallel task execution (currently sequential only)
- Task dependencies/DAG
- Retry logic
- Progress bars for long tasks
- Conditional tasks
- Task groups/namespaces

For now, keeping it simple is the goal. If you need those features, you can probably build them on top of the current API.

## Design Principles

1. **Simple over clever** - No fancy patterns, just straightforward code
2. **Type-safe by default** - TypeScript makes everything better
3. **Minimal dependencies** - Only include what we actually need
4. **Good DX** - Make it easy and pleasant to use
5. **Cross-platform** - Works on Windows, Mac, Linux

That's the architecture! Pretty simple right? That's the point.
