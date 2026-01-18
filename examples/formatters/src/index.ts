import { bytes, duration, fileList } from '@idlesummer/task-runner'

// Example 1: Format bytes
console.log('=== Bytes Formatter ===')
console.log(`Small file: ${bytes(1234)}`)
console.log(`Medium file: ${bytes(123456)}`)
console.log(`Large file: ${bytes(123456789)}`)
console.log(`Huge file: ${bytes(12345678901)}`)

// Example 2: Format duration
console.log('\n=== Duration Formatter ===')
console.log(`Quick task: ${duration(42)}`)
console.log(`Normal task: ${duration(1234)}`)
console.log(`Long task: ${duration(12345)}`)
console.log(`Very long task: ${duration(123456)}`)

// Example 3: File list formatter
console.log('\n=== File List Formatter ===')
console.log('Files in current directory:')

// List all TypeScript files
try {
  console.log(fileList('./src', '**/*.ts'))
} catch (error) {
  console.log('No src directory found - run this from the project root')
}

// Example 4: File list with specific pattern
console.log('\n=== Filtered File List ===')
console.log('Only .json files:')

try {
  console.log(fileList('.', '*.json'))
} catch (error) {
  console.log('No files found')
}
