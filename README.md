# @idlesummer/task-runner

A simple, lightweight task pipeline runner with CLI spinners and formatters for Node.js build tools.

## Features

- **Task Pipeline**: Run tasks sequentially with context sharing
- **CLI Spinners**: Beautiful terminal spinners powered by ora
- **Formatters**: Utilities for formatting bytes, durations, and file lists
- **TypeScript**: Full type safety with generics

## Installation

```bash
npm install @idlesummer/task-runner
```

## Quick Start

```typescript
import { pipe, type Context } from '@idlesummer/task-runner'

interface MyContext extends Context {
  count?: number
}

const pipeline = pipe<MyContext>([
  {
    name: 'Initialize',
    run: async () => ({ count: 0 }),
  },
  {
    name: 'Process',
    run: async (ctx) => ({ count: (ctx.count ?? 0) + 10 }),
    onSuccess: (ctx) => `Processed (count: ${ctx.count})`,
  },
])

const result = await pipeline.run({})
console.log(`Done in ${result.duration}ms`)
```

## Examples

Check out the [`examples`](./examples) directory for more examples:

- **[basic-pipeline.ts](./examples/basic-pipeline.ts)** - Simple pipeline with multiple tasks
- **[build-tool.ts](./examples/build-tool.ts)** - Realistic build tool example with file operations
- **[formatters.ts](./examples/formatters.ts)** - Using the formatting utilities

### Running Examples

The examples use relative imports from the local source files:

```bash
# Clone the repository
git clone https://github.com/idlesummer/task-runner.git
cd task-runner

# Install dependencies
npm install

# Run examples with tsx (no build needed)
npx tsx examples/basic-pipeline.ts
npx tsx examples/build-tool.ts
npx tsx examples/formatters.ts
```

## API Reference

### Pipeline

#### `pipe<TContext>(tasks: Task<TContext>[])`

Creates a task pipeline that runs tasks sequentially with CLI spinners.

```typescript
interface Task<TContext extends Context> {
  name: string
  run: (ctx: TContext) => Promise<Partial<TContext> | void>
  onSuccess?: (ctx: TContext, duration: number) => string
  onError?: (error: Error) => string
}
```

**Returns:** An object with a `run` method that executes the pipeline.

**Example:**

```typescript
const pipeline = pipe([
  {
    name: 'Task 1',
    run: async () => {
      // Task implementation
      return { key: 'value' }
    },
    onSuccess: (ctx, duration) => `Task 1 completed in ${duration}ms`,
    onError: (error) => `Task 1 failed: ${error.message}`,
  },
])

const result = await pipeline.run({})
// result.context contains the final context
// result.duration is the total time in milliseconds
```

### Formatters

#### `bytes(size: number): string`

Formats byte sizes into human-readable strings.

```typescript
import { bytes } from '@idlesummer/task-runner'

console.log(bytes(1234))        // "1.23 kB"
console.log(bytes(1234567))     // "1.23 MB"
console.log(bytes(1234567890))  // "1.23 GB"
```

#### `duration(ms: number): string`

Formats milliseconds into human-readable durations.

```typescript
import { duration } from '@idlesummer/task-runner'

console.log(duration(42))       // "42ms"
console.log(duration(1234))     // "1.2s"
console.log(duration(12345))    // "12.3s"
console.log(duration(123456))   // "2m 3.5s"
```

#### `fileList(baseDir: string, pattern?: string): string`

Displays a formatted list of files in a directory with their sizes.

```typescript
import { fileList } from '@idlesummer/task-runner'

// List all files
console.log(fileList('./dist'))

// List files matching a pattern
console.log(fileList('./dist', '**/*.js'))
console.log(fileList('./dist', '*.json'))
```

**Output format:**
```
  path/to/file1.js                              1.23 kB
  path/to/file2.js                              4.56 kB
  3 files, total:                               5.79 kB
```
