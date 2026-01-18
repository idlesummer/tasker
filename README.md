# @idlesummer/tasker

A simple, lightweight task pipeline runner with CLI spinners and formatters for Node.js build tools.

> **⚠️ Learning Project Notice**
> Hey! Just so you know, this is a learning project I built to understand task pipelines and build tools better. It works and I use it for my own stuff, but there might be bugs or rough edges. Feel free to use it, but maybe don't bet your production deploy on it just yet. Contributions and bug reports are super welcome though!

## What's This?

Basically, it's a simple way to run tasks in sequence with nice terminal spinners. The standard imperative way of writing build scripts seemed unelegant and I wanted something more functional/declarative, so I made this. Think of it like a mini task runner - simpler and lighter than Listr2 but more structured than a bash script.

## Features

- **Task Pipeline** - Run tasks one after another, each task gets the results from the previous ones
- **CLI Spinners** - Those satisfying loading spinners powered by ora
- **Formatters** - Helper functions to make bytes, durations, and file lists look nice
- **TypeScript** - Full type safety so you don't shoot yourself in the foot

## Installation

```bash
npm install @idlesummer/tasker
```

## Quick Start

Here's the simplest example:

```typescript
import { pipe, type Context } from '@idlesummer/tasker'

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

That's it! You get:
- Spinners while tasks run ✨
- Type-safe context passing between tasks
- Timing info automatically

## Why Would I Use This?

Use this if you:
- Want to build a simple CLI tool or build script
- Like seeing spinners while stuff happens
- Need tasks to share data between each other
- Want something lighter than Gulp but more structured than raw scripts

Don't use this if you:
- Need parallel task execution (tasks run sequentially here)
- Want a mature, battle-tested solution (this is a learning project!)
- Need a full-featured task runner (look at Gulp, Grunt, etc.)

## Documentation

- **[API Reference](./docs/API.md)** - All the functions and types explained
- **[Examples](./docs/EXAMPLES.md)** - Real code you can copy-paste
- **[Architecture](./docs/ARCHITECTURE.md)** - How it works under the hood
- **[Contributing](./docs/CONTRIBUTING.md)** - Want to help? Start here
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and fixes

## Example Projects

The `examples/` folder has working projects you can run:

- **[basic-pipeline](./examples/basic-pipeline)** - Super simple example to get started
- **[build-tool](./examples/build-tool)** - More realistic build tool with file operations
- **[formatters](./examples/formatters)** - Shows off all the formatting utilities

Each example is a standalone npm package. To run one:

```bash
# Clone and setup
git clone https://github.com/idlesummer/tasker.git
cd tasker
npm install
npm run build

# Try an example
cd examples/basic-pipeline
npm install
npm run build
npm start
```

See the [examples README](./examples/README.md) for more info.

## Quick API Overview

### Pipeline

Create a pipeline with tasks:

```typescript
const pipeline = pipe([
  {
    name: 'Task name',
    onSuccess: (ctx, duration) => 'Custom success message',
    onError: (error) => 'Custom error message',
    run: async (ctx) => {
      // Do stuff
      return { key: 'value' }  // Updates context
    },
  }
])

const result = await pipeline.run({})
// result.context has your final context
// result.duration is total time in ms
```

### Formatters

Make numbers pretty:

```typescript
import { bytes, duration, fileList } from '@idlesummer/tasker'

console.log(bytes(1234567))        // "1.23 MB"
console.log(duration(12345))       // "12.3s"
console.log(fileList('./dist'))    // Formatted file list with sizes
```

Check [API.md](./docs/API.md) for the full reference.

## A More Real Example

Here's what a build script might look like:

```typescript
import { pipe, fileList, duration } from '@idlesummer/tasker'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const build = pipe([
  {
    name: 'Clean dist folder',
    run: async () => {
      await execAsync('rm -rf dist')
    }
  },
  {
    name: 'Compile TypeScript',
    onSuccess: () => 'TypeScript compiled successfully',
    run: async () => {
      await execAsync('tsc')
    },
  },
  {
    name: 'Show output',
    run: async () => {
      console.log('\nBuild output:')
      console.log(fileList('./dist'))
    }
  }
])

console.log('🏗️  Building...\n')
const result = await build.run({})
console.log(`\n✅ Done in ${duration(result.duration)}`)
```

You get nice spinners for each step, and a clean output at the end.

## Known Issues / Limitations

Since this is a learning project:
- Tasks run sequentially only (no parallel execution yet)
- No built-in retry logic
- Error handling is basic (task fails = pipeline stops)
- Haven't tested with huge codebases

These might get fixed eventually, or they might not. PRs welcome if you want to add features!

## Contributing

Found a bug? Want to add a feature? Awesome!

1. Check [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines
2. Open an issue or PR
3. Be nice (we're all learning here)

Even if you're new to open source, feel free to contribute. I'm learning too!

## License

MIT - See [LICENSE](LICENSE) file

## Questions?

- Check the [docs](./docs/)
- Look at the [examples](./examples/)
- Open an issue
- Read the [troubleshooting guide](./docs/TROUBLESHOOTING.md)

---

Made with ☕ and procrastination by [@idlesummer](https://github.com/idlesummer)

If this helps you, cool! If you find bugs, let me know. If you want to improve it, send a PR. Let's learn together!
