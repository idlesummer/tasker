import { statSync } from 'fs'
import { join } from 'path'
import { fdir } from 'fdir'
import pc from 'picocolors'
import pm from 'picomatch'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

/**
 * Formats byte sizes into human-readable strings
 * @param size - The size in bytes
 * @returns Formatted string (e.g., "1.23 kB", "4.56 MB")
 * @example
 * ```ts
 * bytes(1234)        // "1.23 kB"
 * bytes(1234567)     // "1.23 MB"
 * bytes(1234567890)  // "1.23 GB"
 * ```
 */
export const bytes = prettyBytes

/**
 * Formats milliseconds into human-readable durations
 * @param ms - The duration in milliseconds
 * @returns Formatted string (e.g., "42ms", "1.2s", "2m 3.5s")
 * @example
 * ```ts
 * duration(42)       // "42ms"
 * duration(1234)     // "1.2s"
 * duration(12345)    // "12.3s"
 * duration(123456)   // "2m 3.5s"
 * ```
 */
export const duration = prettyMs

/**
 * Display a formatted list of files in a directory with their sizes
 * @param baseDir - The base directory to search
 * @param pattern - Glob pattern to match files (default: "**/*")
 * @returns Formatted file list with sizes and total
 * @example
 * ```ts
 * // List all files
 * console.log(fileList('./dist'))
 *
 * // List files matching a pattern
 * console.log(fileList('./dist', '**\/*.js'))
 * console.log(fileList('./dist', '*.json'))
 * ```
 *
 * Output format:
 * ```
 *   path/to/file1.js                              1.23 kB
 *   path/to/file2.js                              4.56 kB
 *   3 files, total:                               5.79 kB
 * ```
 */
export function fileList(baseDir: string, pattern = '**/*') {
  const WIDTH = 45

  // Find all files matching the pattern
  const files = new fdir()
    .withRelativePaths()
    .withGlobFunction(pm)  // ← Add this line
    .glob(pattern)
    .crawl(baseDir)
    .sync()

  const stats = files.map(path => {
    const fullPath = join(baseDir, path)
    const displayPath = path.replace(/\\/g, '/')
    return {
      path: displayPath,
      size: statSync(fullPath).size,
    }
  })

  const total = stats.reduce((sum, item) => sum + item.size, 0)
  const lines = stats.map(({ path, size }) => {
    const paddedPath = pc.cyan(path.padEnd(WIDTH))
    const formattedSize = pc.dim(bytes(size))
    return `  ${paddedPath}  ${formattedSize}`
  })

  const footerLabel = `${files.length} files, total:`.padEnd(WIDTH)
  const footer = `  ${pc.dim(footerLabel)}  ${pc.dim(bytes(total))}`
  return [...lines, footer].join('\n')
}
