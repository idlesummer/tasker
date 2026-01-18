# Examples

Alright, so you've read the API docs but want to see some real examples? Let's go through some common use cases.

## Table of Contents

- [Basic Pipeline](#basic-pipeline)
- [Build Tool](#build-tool)
- [File Processing](#file-processing)
- [Data Pipeline](#data-pipeline)
- [Custom Error Handling](#custom-error-handling)
- [Using Formatters](#using-formatters)
- [Conditional Logic](#conditional-logic)
- [Real World Example](#real-world-example)

## Basic Pipeline

Let's start simple - a pipeline that counts to 3:

```typescript
import { pipe, type Context } from '@idlesummer/tasker'

interface MyContext extends Context {
  count: number
}

const pipeline = pipe<MyContext>([
  {
    name: 'Initialize',
    run: async () => ({ count: 0 })
  },
  {
    name: 'Increment',
    run: async (ctx) => ({ count: ctx.count + 1 })
  },
  {
    name: 'Increment again',
    run: async (ctx) => ({ count: ctx.count + 1 })
  },
  {
    name: 'Increment once more',
    run: async (ctx) => ({ count: ctx.count + 1 })
  }
])

const result = await pipeline.run({ count: 0 })
console.log(`Final count: ${result.context.count}`) // 3
console.log(`Took ${result.duration}ms`)
```

Pretty straightforward - each task adds 1 to the count.

## Build Tool

Here's a more realistic example - building a TypeScript project:

```typescript
import { pipe, fileList, duration, type Context } from '@idlesummer/tasker'
import { exec } from 'child_process'
import { promisify } from 'util'
import { rm } from 'fs/promises'

const execAsync = promisify(exec)

interface BuildContext extends Context {
  startTime: number
  errors?: string[]
}

const buildPipeline = pipe<BuildContext>([
  {
    name: 'Clean dist folder',
    run: async () => {
      await rm('./dist', { recursive: true, force: true })
    }
  },
  {
    name: 'Compile TypeScript',
    run: async () => {
      const { stdout, stderr } = await execAsync('tsc')
      if (stderr) return { errors: [stderr] }
    },
    onSuccess: () => 'TypeScript compiled successfully',
    onError: (err) => `TypeScript compilation failed: ${err.message}`
  },
  {
    name: 'Show build output',
    run: async () => {
      console.log('\nBuild output:')
      console.log(fileList('./dist', '**/*.js'))
    }
  }
])

// Run it
const result = await buildPipeline.run({ startTime: Date.now() })
console.log(`\nBuild completed in ${duration(result.duration)}`)
```

This actually cleans, compiles, and shows you what got built. Nice!

## File Processing

Processing a bunch of files? Here's how:

```typescript
import { pipe, bytes, type Context } from '@idlesummer/tasker'
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

interface ProcessContext extends Context {
  files: string[]
  processed: number
  totalSize: number
}

const processFiles = pipe<ProcessContext>([
  {
    name: 'Find files',
    run: async () => {
      const files = await readdir('./input')
      return {
        files: files.filter(f => f.endsWith('.txt')),
        processed: 0,
        totalSize: 0
      }
    },
    onSuccess: (ctx) => `Found ${ctx.files?.length || 0} files to process`
  },
  {
    name: 'Process files',
    run: async (ctx) => {
      let totalSize = 0

      for (const file of ctx.files) {
        const content = await readFile(join('./input', file), 'utf-8')
        const processed = content.toUpperCase() // Some processing
        await writeFile(join('./output', file), processed)
        totalSize += Buffer.byteLength(processed)
      }

      return {
        processed: ctx.files.length,
        totalSize
      }
    },
    onSuccess: (ctx, duration) =>
      `Processed ${ctx.processed} files (${bytes(ctx.totalSize!)}) in ${duration}ms`
  }
])

await processFiles.run({ files: [], processed: 0, totalSize: 0 })
```

## Data Pipeline

Working with APIs or databases? Pipeline is perfect for that:

```typescript
import { pipe, type Context } from '@idlesummer/tasker'

interface DataContext extends Context {
  users?: User[]
  enriched?: EnrichedUser[]
  saved?: number
}

const dataPipeline = pipe<DataContext>([
  {
    name: 'Fetch users from API',
    run: async () => {
      const response = await fetch('https://api.example.com/users')
      const users = await response.json()
      return { users }
    },
    onSuccess: (ctx) => `Fetched ${ctx.users?.length} users`
  },
  {
    name: 'Enrich user data',
    run: async (ctx) => {
      const enriched = await Promise.all(
        ctx.users!.map(async (user) => {
          const details = await fetch(`https://api.example.com/users/${user.id}/details`)
          const detailsData = await details.json()
          return { ...user, ...detailsData }
        })
      )
      return { enriched }
    },
    onSuccess: (ctx) => `Enriched ${ctx.enriched?.length} users with additional data`
  },
  {
    name: 'Save to database',
    run: async (ctx) => {
      let saved = 0
      for (const user of ctx.enriched!) {
        await db.users.create(user)
        saved++
      }
      return { saved }
    },
    onSuccess: (ctx) => `Saved ${ctx.saved} users to database`
  }
])

await dataPipeline.run({})
```

Each step depends on the previous one - perfect for pipelines!

## Custom Error Handling

Want to handle errors gracefully? Add custom messages:

```typescript
import { pipe, type Context } from '@idlesummer/tasker'

interface ApiContext extends Context {
  data?: any
  retries?: number
}

const apiPipeline = pipe<ApiContext>([
  {
    name: 'Fetch data',
    run: async (ctx) => {
      try {
        const response = await fetch('https://api.example.com/data')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        return { data }
      } catch (error) {
        // You could add retry logic here
        throw error
      }
    },
    onError: (error) => {
      if (error.message.includes('HTTP 429')) {
        return 'Rate limited! Try again later'
      }
      if (error.message.includes('HTTP 404')) {
        return 'API endpoint not found'
      }
      return `API request failed: ${error.message}`
    }
  }
])

try {
  await apiPipeline.run({})
} catch (error) {
  console.error('Pipeline failed:', error.message)
  // Handle the error however you want
}
```

## Using Formatters

The formatter functions are super handy for showing progress:

```typescript
import { pipe, fileList, bytes, duration, type Context } from '@idlesummer/tasker'

interface StatsContext extends Context {
  buildSize?: number
  buildTime?: number
}

const statsPipeline = pipe<StatsContext>([
  {
    name: 'Build project',
    run: async () => {
      const start = Date.now()
      // ... do build ...
      const buildTime = Date.now() - start
      return { buildTime }
    },
    onSuccess: (ctx, dur) => `Built in ${duration(dur)}`
  },
  {
    name: 'Calculate bundle size',
    run: async () => {
      const stats = await getBundleStats()
      return { buildSize: stats.totalSize }
    },
    onSuccess: (ctx) => `Bundle size: ${bytes(ctx.buildSize!)}`
  },
  {
    name: 'Show files',
    run: async () => {
      console.log('\nOutput:')
      console.log(fileList('./dist'))
    }
  }
])

await statsPipeline.run({})
```

Makes your output look professional!

## Conditional Logic

Want to skip tasks based on conditions? Just throw early:

```typescript
import { pipe, type Context } from '@idlesummer/tasker'

interface DeployContext extends Context {
  branch?: string
  canDeploy?: boolean
}

const deployPipeline = pipe<DeployContext>([
  {
    name: 'Check branch',
    run: async () => {
      const { stdout } = await execAsync('git branch --show-current')
      const branch = stdout.trim()
      const canDeploy = branch === 'main'

      if (!canDeploy) {
        throw new Error('Can only deploy from main branch')
      }

      return { branch, canDeploy }
    },
    onError: (error) => error.message // Nice error message
  },
  {
    name: 'Run tests',
    run: async () => {
      await execAsync('npm test')
    }
  },
  {
    name: 'Deploy',
    run: async () => {
      await execAsync('npm run deploy')
    },
    onSuccess: () => 'Deployed successfully! 🚀'
  }
])

try {
  await deployPipeline.run({})
} catch (error) {
  console.log('Deployment stopped:', error.message)
}
```

If the branch check fails, the pipeline stops and later tasks don't run.

## Real World Example

Let's put it all together - a complete build tool for a web app:

```typescript
import { pipe, fileList, bytes, duration, type Context } from '@idlesummer/tasker'
import { exec } from 'child_process'
import { promisify } from 'util'
import { rm, mkdir, copyFile, readdir } from 'fs/promises'
import { join } from 'path'

const execAsync = promisify(exec)

interface BuildContext extends Context {
  startTime: number
  fileCount: number
  totalSize: number
  version: string
}

const webAppBuild = pipe<BuildContext>([
  {
    name: 'Clean output directory',
    run: async () => {
      await rm('./dist', { recursive: true, force: true })
      await mkdir('./dist', { recursive: true })
    }
  },
  {
    name: 'Read package version',
    run: async () => {
      const pkg = await import('./package.json')
      return { version: pkg.version }
    },
    onSuccess: (ctx) => `Building v${ctx.version}`
  },
  {
    name: 'Compile TypeScript',
    run: async () => {
      await execAsync('tsc --project tsconfig.build.json')
    },
    onSuccess: () => 'TypeScript compiled'
  },
  {
    name: 'Bundle with esbuild',
    run: async () => {
      await execAsync('esbuild src/index.ts --bundle --outfile=dist/bundle.js --minify')
    },
    onSuccess: () => 'Bundled and minified'
  },
  {
    name: 'Copy static assets',
    run: async () => {
      const files = await readdir('./public')
      let fileCount = 0

      for (const file of files) {
        await copyFile(
          join('./public', file),
          join('./dist', file)
        )
        fileCount++
      }

      return { fileCount }
    },
    onSuccess: (ctx) => `Copied ${ctx.fileCount} static files`
  },
  {
    name: 'Calculate build size',
    run: async () => {
      const files = await readdir('./dist')
      let totalSize = 0

      for (const file of files) {
        const stats = await stat(join('./dist', file))
        totalSize += stats.size
      }

      return { totalSize }
    },
    onSuccess: (ctx) => `Total build size: ${bytes(ctx.totalSize!)}`
  },
  {
    name: 'Show build output',
    run: async () => {
      console.log('\nBuild contents:')
      console.log(fileList('./dist'))
    }
  }
])

// Run the build
console.log('🏗️  Starting build...\n')

try {
  const result = await webAppBuild.run({
    startTime: Date.now(),
    fileCount: 0,
    totalSize: 0,
    version: '0.0.0'
  })

  console.log(`\n✅ Build complete in ${duration(result.duration)}`)
  console.log(`📦 Version: ${result.context.version}`)
  console.log(`💾 Size: ${bytes(result.context.totalSize)}`)
} catch (error) {
  console.error('\n❌ Build failed:', error.message)
  process.exit(1)
}
```

This gives you a nice build pipeline with:
- Progress spinners for each step
- Detailed success messages
- File listing at the end
- Summary with version and size
- Proper error handling

## More Examples

Want to see runnable examples? Check out the `examples/` folder in the repo:

- `basic-pipeline/` - Simple example to get started
- `build-tool/` - Realistic build tool
- `formatters/` - All the formatting functions

Each one is a complete project you can run and modify.

---

Got more questions? Check out [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open an issue!
