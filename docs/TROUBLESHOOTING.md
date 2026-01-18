# Troubleshooting

Running into issues? Let's fix them!

> **Note:** This is a learning project, so bugs are expected! If you find something weird, it might be an actual bug rather than you doing something wrong. Don't hesitate to open an issue - we're all figuring this out together.

## Common Problems

### TypeScript Errors

#### "Type 'X' is not assignable to type 'Context'"

You probably forgot to extend `Context` in your interface:

```typescript
// ❌ Wrong
interface MyContext {
  count: number
}

// ✅ Right
import type { Context } from '@idlesummer/tasker'

interface MyContext extends Context {
  count: number
}
```

#### "Property 'xyz' does not exist on type 'Context'"

Your task is trying to access a property that TypeScript doesn't know about. Make sure your context interface includes all properties you're using:

```typescript
interface MyContext extends Context {
  count: number
  files: string[]  // Add all properties you need
}
```

#### "Object is possibly 'undefined'"

This happens when you access optional properties. Use optional chaining or nullish coalescing:

```typescript
// ❌ Might error if count is undefined
run: async (ctx) => ({ count: ctx.count + 1 })

// ✅ Safe - defaults to 0
run: async (ctx) => ({ count: (ctx.count ?? 0) + 1 })

// ✅ Also safe
run: async (ctx) => ({ count: ctx.count! + 1 })  // If you KNOW it exists
```

### Pipeline Issues

#### Tasks aren't running in order

They should run sequentially. If they're not, you might have multiple pipelines running at once?

```typescript
// This runs them in parallel (probably not what you want)
const result1 = pipeline1.run({})
const result2 = pipeline2.run({})
await Promise.all([result1, result2])

// This runs them in sequence
await pipeline1.run({})
await pipeline2.run({})
```

#### Context updates aren't showing up

Remember that `onSuccess` gets the context *before* your task ran:

```typescript
{
  name: 'Task',
  run: async () => ({ count: 42 }),
  onSuccess: (ctx) => {
    console.log(ctx.count)  // This is the OLD value!
    // To see the new value, you need to track it yourself
  }
}
```

If you need the updated value, track it in your run function:

```typescript
{
  name: 'Task',
  run: async () => {
    const newCount = 42
    console.log('New count:', newCount)  // Log here
    return { count: newCount }
  }
}
```

#### Pipeline stops after first error

This is intentional! When a task throws, the pipeline stops. If you want to continue, catch the error in your task:

```typescript
{
  name: 'Task that might fail',
  run: async () => {
    try {
      await riskyOperation()
    } catch (error) {
      console.log('Operation failed, continuing anyway')
      // Don't rethrow - pipeline continues
    }
  }
}
```

### Formatter Issues

#### `fileList()` returns no files

Few things to check:

1. **Path is correct?**
   ```typescript
   // Make sure the directory exists
   fileList('./dist')  // ✅
   fileList('dist')    // ✅
   fileList('/dist')   // ❌ This looks in root!
   ```

2. **Pattern is right?**
   ```typescript
   fileList('./dist', '*.js')       // Only .js in root of dist
   fileList('./dist', '**/*.js')    // All .js files recursively
   fileList('./dist', '**/*')       // All files (default)
   ```

3. **Files actually exist?**
   ```bash
   ls ./dist  # Check if files are there
   ```

#### Glob patterns not working on Windows

Make sure you're using forward slashes in patterns, even on Windows:

```typescript
// ✅ Right - works everywhere
fileList('./dist', 'src/**/*.ts')

// ❌ Wrong - won't work
fileList('./dist', 'src\\**\\*.ts')
```

We normalize paths internally, so always use `/` in patterns.

#### Colors not showing in terminal

Some terminals don't support colors. Try:
- Use a different terminal (Windows Terminal, iTerm2, etc.)
- Check if colors are disabled (`NO_COLOR` environment variable)

### Installation Issues

#### "Cannot find module '@idlesummer/tasker'"

Did you install it?

```bash
npm install @idlesummer/tasker
```

#### Version conflicts

If you're getting weird errors, try cleaning and reinstalling:

```bash
rm -rf node_modules package-lock.json
npm install
```

#### ESM/CommonJS issues

This library supports both! Make sure your package.json is set up right:

**For ESM (recommended):**
```json
{
  "type": "module"
}
```

**For CommonJS:**
```json
{
  "type": "commonjs"
}
```

Or just use the right import/require syntax and it'll work:

```typescript
// ESM
import { pipe } from '@idlesummer/tasker'

// CommonJS
const { pipe } = require('@idlesummer/tasker')
```

### Runtime Errors

#### "Task failed" errors

The error message should tell you which task failed and why:

```
Task "Compile TypeScript" failed: tsc exited with code 1
```

Look at the task name and the error message. Usually it's an issue with what the task is doing, not the pipeline itself.

#### Promises not resolving

Make sure you're awaiting the pipeline:

```typescript
// ❌ This won't work
pipeline.run({})
console.log('Done')  // This runs immediately!

// ✅ This works
await pipeline.run({})
console.log('Done')  // This runs after pipeline finishes
```

#### Memory issues with large files

If you're processing huge files, you might run out of memory. Try processing them in chunks:

```typescript
{
  name: 'Process large file',
  run: async () => {
    // Instead of loading the whole file
    const content = await readFile('huge.txt', 'utf-8')  // ❌ Might crash

    // Use streams
    const stream = createReadStream('huge.txt')  // ✅ Better
    // Process in chunks
  }
}
```

### Testing Issues

#### Spinners messing up test output

Mock ora in your tests:

```typescript
import { vi } from 'vitest'

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  }))
}))
```

#### Tests timing out

Increase the timeout or make your tasks faster:

```typescript
it('should run pipeline', async () => {
  await pipeline.run({})
}, 10000)  // 10 second timeout
```

### Performance Issues

#### Pipeline is slow

Some things to check:

1. **Are tasks actually async?**
   ```typescript
   // If the work is sync, don't make it async unnecessarily
   run: async () => {
     return heavyComputation()  // If this is sync, remove async
   }
   ```

2. **Can tasks run in parallel?**

   This library runs tasks sequentially. If your tasks are independent, you might want to run them in parallel manually:

   ```typescript
   {
     name: 'Process files',
     run: async () => {
       // ❌ Slow - processes one by one
       for (const file of files) {
         await processFile(file)
       }

       // ✅ Fast - processes in parallel
       await Promise.all(files.map(file => processFile(file)))
     }
   }
   ```

3. **Are you doing unnecessary work?**

   Profile your tasks to see which ones are slow, then optimize those.

## Getting Help

Still stuck? Here's what to do:

### 1. Check the Docs

- [API.md](./API.md) - API reference
- [EXAMPLES.md](./EXAMPLES.md) - More examples
- [ARCHITECTURE.md](./ARCHITECTURE.md) - How it works internally

### 2. Search Existing Issues

Someone might have had the same problem:
https://github.com/idlesummer/tasker/issues

### 3. Ask for Help

Open a new issue with:
- What you're trying to do
- What you expected
- What actually happened
- Minimal code to reproduce
- Your environment (Node version, OS, etc.)

### 4. Debug It Yourself

Add some console.logs to see what's happening:

```typescript
{
  name: 'Debug task',
  run: async (ctx) => {
    console.log('Context:', ctx)
    const result = await doSomething()
    console.log('Result:', result)
    return { result }
  }
}
```

## Known Limitations

Some things this library doesn't do (by design):

- **Parallel task execution** - Tasks run sequentially. If you need parallel, use Promise.all inside a task
- **Task dependencies** - No DAG/dependency graph. Just runs in order
- **Retries** - No built-in retry logic. Add it yourself in tasks if needed
- **Progress bars** - Just spinners. For long tasks, you could add progress manually
- **Conditional tasks** - No built-in way to skip tasks. Just throw an error to stop the pipeline

These might be added later, but for now, you can work around them pretty easily.

## Version-Specific Issues

### v1.x

Current stable version. If you find issues, please report them!

## Debugging Tips

### Enable verbose logging

```typescript
process.env.DEBUG = '*'  // Or use a proper debug library
```

### Check what's in your context

```typescript
{
  name: 'Debug',
  run: async (ctx) => {
    console.log('Current context:', JSON.stringify(ctx, null, 2))
  }
}
```

### Time individual tasks

```typescript
{
  name: 'Slow task',
  run: async () => {
    const start = Date.now()
    await doWork()
    console.log(`Took ${Date.now() - start}ms`)
  }
}
```

### Isolate the problem

Comment out tasks until you find which one is causing issues:

```typescript
const pipeline = pipe([
  task1,
  // task2,  // Comment out
  // task3,  // Comment out
  task4,
])
```

---

Still having issues? Don't hesitate to open an issue on GitHub. We're here to help!
