import { pipe } from '@idlesummer/tasker'
import type { Context } from '@idlesummer/tasker'

// Define your context type
interface BuildContext extends Context {
  appName?: string
  buildMode?: 'development' | 'production'
  minified?: boolean
  analyzed?: boolean
  deployed?: boolean
  testsPassed?: boolean
}

// Helper for simulating execution delays
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  // Configuration flags
  const isProduction = process.argv.includes('--prod')
  const enableAnalyze = process.argv.includes('--analyze')
  const enableDeploy = process.argv.includes('--deploy')
  const skipTests = process.argv.includes('--skip-tests')

  console.log('Build Configuration:')
  console.log(`  Production: ${isProduction}`)
  console.log(`  Analyze: ${enableAnalyze}`)
  console.log(`  Deploy: ${enableDeploy}`)
  console.log(`  Skip Tests: ${skipTests}\n`)

  // Create a pipeline with conditional tasks
  const pipeline = pipe<BuildContext>([
    {
      name: 'Initialize build',
      run: async () => {
        await delay(500)
        return {
          appName: 'My App',
          buildMode: isProduction ? 'production' : 'development',
        }
      },
    },
    {
      name: 'Compile TypeScript',
      onSuccess: (ctx) => `Compiled for ${ctx.buildMode}`,
      run: async () => {
        await delay(1000)
        return {}
      },
    },
    // Conditionally minify only in production
    isProduction && {
      name: 'Minify assets',
      run: async () => {
        await delay(800)
        return { minified: true }
      },
    },
    // Conditionally run bundle analyzer
    enableAnalyze && {
      name: 'Analyze bundle',
      run: async () => {
        await delay(600)
        return { analyzed: true }
      },
    },
    // Conditionally run tests
    !skipTests && {
      name: 'Run tests',
      run: async () => {
        await delay(1200)
        return { testsPassed: true }
      },
    },
    {
      name: 'Build artifacts',
      run: async (ctx) => {
        await delay(700)
        console.log(`  Built ${ctx.appName} in ${ctx.buildMode} mode`)
        if (ctx.minified) console.log('  Assets minified')
        if (ctx.analyzed) console.log('  Bundle analyzed')
        if (ctx.testsPassed) console.log('  Tests passed')
        return {}
      },
    },
    // Conditionally deploy (only in production and if enabled)
    isProduction && enableDeploy && {
      name: 'Deploy to production',
      run: async () => {
        await delay(1500)
        return { deployed: true }
      },
    },
  ])

  try {
    const initialContext: BuildContext = {}
    const result = await pipeline.run(initialContext)
    console.log(`\nPipeline completed in ${result.duration}ms`)

    // Show final results
    console.log('\nFinal Status:')
    console.log(`  Mode: ${result.context.buildMode}`)
    console.log(`  Minified: ${result.context.minified ?? false}`)
    console.log(`  Analyzed: ${result.context.analyzed ?? false}`)
    console.log(`  Tests Passed: ${result.context.testsPassed ?? false}`)
    console.log(`  Deployed: ${result.context.deployed ?? false}`)
  }
  catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Pipeline failed:', err)
    process.exit(1)
  }
}

await main()
