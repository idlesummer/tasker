# Examples

This directory contains standalone example projects demonstrating how to use `@idlesummer/tasker`.

## Available Examples

### 1. Basic Pipeline ([`basic-pipeline/`](./basic-pipeline))

A simple pipeline example showing:
- Custom context types
- Sequential task execution
- Context sharing between tasks
- Custom success messages

### 2. Build Tool ([`build-tool/`](./build-tool))

A realistic build tool example demonstrating:
- File operations (clean, compile, bundle)
- Using the `duration` formatter in success messages
- Using the `fileList` formatter to display output
- Complex build pipeline with multiple steps

### 3. Conditional Tasks ([`conditional-tasks/`](./conditional-tasks))

Demonstrates conditional task execution using boolean expressions:
- Conditionally include/exclude tasks based on configuration flags
- Using `condition && task` pattern for conditional execution
- Building different pipelines for development vs production
- Command-line flag-based task control

**Example usage:**
```bash
# Development build
npm start

# Production build with minification
npm start -- --prod

# Production build with bundle analysis
npm start -- --prod --analyze

# Production build with deployment
npm start -- --prod --deploy

# Skip tests
npm start -- --skip-tests
```

### 4. Formatters ([`formatters/`](./formatters))

Examples of all the formatting utilities:
- `bytes()` - Format file sizes
- `duration()` - Format time durations
- `fileList()` - Display directory contents with glob patterns

## Running the Examples

Each example is a standalone npm package. To run an example:

```bash
# Navigate to an example directory
cd examples/basic-pipeline

# Install dependencies (links to parent package via workspace)
npm install

# Build the TypeScript
npm run build

# Run the example
npm start
```

## Project Structure

Each example contains:
- `index.ts` - The example code
- `package.json` - Package configuration with workspace dependency
- `tsconfig.json` - TypeScript configuration

The examples use `workspace:*` to reference the parent `@idlesummer/tasker` package, which means they import from the actual built package rather than source files. This demonstrates realistic usage.
