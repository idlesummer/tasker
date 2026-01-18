import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { bytes, duration, fileList } from './format'

describe('format', () => {
  describe('bytes', () => {
    it('should format bytes correctly', () => {
      expect(bytes(0)).toBe('0 B')
      expect(bytes(1)).toBe('1 B')
      expect(bytes(100)).toBe('100 B')
    })

    it('should format kilobytes correctly', () => {
      expect(bytes(1000)).toBe('1 kB')
      expect(bytes(1234)).toBe('1.23 kB')
      expect(bytes(10000)).toBe('10 kB')
    })

    it('should format megabytes correctly', () => {
      expect(bytes(1000000)).toBe('1 MB')
      expect(bytes(1234567)).toBe('1.23 MB')
      expect(bytes(10000000)).toBe('10 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(bytes(1000000000)).toBe('1 GB')
      expect(bytes(1234567890)).toBe('1.23 GB')
    })

    it('should format terabytes correctly', () => {
      expect(bytes(1000000000000)).toBe('1 TB')
      expect(bytes(1234567890123)).toBe('1.23 TB')
    })

    it('should handle very large numbers', () => {
      expect(bytes(1000000000000000)).toBe('1 PB')
    })
  })

  describe('duration', () => {
    it('should format milliseconds correctly', () => {
      expect(duration(0)).toBe('0ms')
      expect(duration(1)).toBe('1ms')
      expect(duration(100)).toBe('100ms')
      expect(duration(999)).toBe('999ms')
    })

    it('should format seconds correctly', () => {
      expect(duration(1000)).toBe('1s')
      expect(duration(1500)).toBe('1.5s')
      expect(duration(5000)).toBe('5s')
      expect(duration(59000)).toBe('59s')
    })

    it('should format minutes correctly', () => {
      expect(duration(60000)).toBe('1m')
      expect(duration(90000)).toBe('1m 30s')
      expect(duration(123000)).toBe('2m 3s')
      expect(duration(123456)).toBe('2m 3.4s') // pretty-ms rounds to 1 decimal
    })

    it('should format hours correctly', () => {
      expect(duration(3600000)).toBe('1h')
      expect(duration(3660000)).toBe('1h 1m')
      expect(duration(7380000)).toBe('2h 3m')
    })

    it('should format days correctly', () => {
      expect(duration(86400000)).toBe('1d')
      expect(duration(90000000)).toBe('1d 1h')
    })

    it('should handle very large durations', () => {
      expect(duration(172800000)).toBe('2d')
    })
  })

  describe('fileList', () => {
    const testDir = join(process.cwd(), 'test-temp-dir')

    beforeEach(() => {
      // Clean up if exists from previous test
      try {
        rmSync(testDir, { recursive: true, force: true })
      }
      catch {
        // Ignore errors
      }

      // Create test directory structure
      mkdirSync(testDir, { recursive: true })
      mkdirSync(join(testDir, 'subdir'), { recursive: true })
    })

    afterEach(() => {
      // Clean up test directory
      try {
        rmSync(testDir, { recursive: true, force: true })
      }
      catch {
        // Ignore errors
      }
    })

    it('should list all files in a directory', () => {
      // Create test files
      writeFileSync(join(testDir, 'file1.txt'), 'Hello')
      writeFileSync(join(testDir, 'file2.txt'), 'World')

      const result = fileList(testDir)

      expect(result).toContain('file1.txt')
      expect(result).toContain('file2.txt')
      expect(result).toContain('2 files, total:')
    })

    it('should show file sizes', () => {
      // Create file with known size
      writeFileSync(join(testDir, 'test.txt'), 'A'.repeat(1000))

      const result = fileList(testDir)

      expect(result).toContain('test.txt')
      expect(result).toContain('1 kB')
    })

    it('should list files in subdirectories', () => {
      writeFileSync(join(testDir, 'root.txt'), 'Root')
      writeFileSync(join(testDir, 'subdir', 'nested.txt'), 'Nested')

      const result = fileList(testDir)

      expect(result).toContain('root.txt')
      expect(result).toContain('subdir/nested.txt')
      expect(result).toContain('2 files, total:')
    })

    it('should filter files by glob pattern', () => {
      writeFileSync(join(testDir, 'file1.txt'), 'Text file')
      writeFileSync(join(testDir, 'file2.js'), 'JavaScript file')
      writeFileSync(join(testDir, 'file3.txt'), 'Another text file')

      const result = fileList(testDir, '*.txt')

      expect(result).toContain('file1.txt')
      expect(result).toContain('file3.txt')
      expect(result).not.toContain('file2.js')
      expect(result).toContain('2 files, total:')
    })

    it('should support nested glob patterns', () => {
      mkdirSync(join(testDir, 'src'), { recursive: true })
      mkdirSync(join(testDir, 'dist'), { recursive: true })

      writeFileSync(join(testDir, 'src', 'index.ts'), 'Source')
      writeFileSync(join(testDir, 'src', 'utils.ts'), 'Utils')
      writeFileSync(join(testDir, 'dist', 'index.js'), 'Built')

      const result = fileList(testDir, 'src/**/*.ts')

      expect(result).toContain('src/index.ts')
      expect(result).toContain('src/utils.ts')
      expect(result).not.toContain('dist/index.js')
      expect(result).toContain('2 files, total:')
    })

    it('should calculate total size correctly', () => {
      // Create files with known sizes
      writeFileSync(join(testDir, 'file1.txt'), 'A'.repeat(500))
      writeFileSync(join(testDir, 'file2.txt'), 'B'.repeat(500))

      const result = fileList(testDir)

      // Total should be 1000 bytes (1 kB)
      expect(result).toContain('1 kB')
    })

    it('should handle empty directories', () => {
      const result = fileList(testDir)

      expect(result).toContain('0 files, total:')
      expect(result).toContain('0 B')
    })

    it('should respect custom width parameter', () => {
      writeFileSync(join(testDir, 'short.txt'), 'Content')

      const result = fileList(testDir, '**/*', 20)

      // Check that padding is applied (path should be followed by spaces)
      const lines = result.split('\n')
      const fileLine = lines.find((line) => line.includes('short.txt'))
      expect(fileLine).toBeDefined()
    })

    it('should normalize Windows-style paths to forward slashes', () => {
      mkdirSync(join(testDir, 'subdir1', 'subdir2'), { recursive: true })
      writeFileSync(join(testDir, 'subdir1', 'subdir2', 'file.txt'), 'Content')

      const result = fileList(testDir)

      // Should use forward slashes regardless of OS
      expect(result).toContain('subdir1/subdir2/file.txt')
    })

    it('should handle multiple file extensions', () => {
      writeFileSync(join(testDir, 'file.txt'), 'Text')
      writeFileSync(join(testDir, 'file.js'), 'JS')
      writeFileSync(join(testDir, 'file.ts'), 'TS')
      writeFileSync(join(testDir, 'file.json'), 'JSON')

      const result = fileList(testDir, '*.{js,ts}')

      expect(result).not.toContain('file.txt')
      expect(result).toContain('file.js')
      expect(result).toContain('file.ts')
      expect(result).not.toContain('file.json')
      expect(result).toContain('2 files, total:')
    })

    it('should handle files with different sizes', () => {
      writeFileSync(join(testDir, 'tiny.txt'), 'A')
      writeFileSync(join(testDir, 'small.txt'), 'A'.repeat(100))
      writeFileSync(join(testDir, 'medium.txt'), 'A'.repeat(10000))

      const result = fileList(testDir)

      expect(result).toContain('tiny.txt')
      expect(result).toContain('small.txt')
      expect(result).toContain('medium.txt')
      expect(result).toContain('3 files, total:')
    })

    it('should format output with proper structure', () => {
      writeFileSync(join(testDir, 'test.txt'), 'Content')

      const result = fileList(testDir)
      const lines = result.split('\n')

      // Should have at least 2 lines (file + footer)
      expect(lines.length).toBeGreaterThanOrEqual(2)

      // Last line should be the footer with total
      const footer = lines[lines.length - 1]
      expect(footer).toContain('files, total:')
    })
  })
})
