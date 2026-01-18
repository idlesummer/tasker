import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fileList } from '../format'

describe('fileList', () => {
    const testDir = join(process.cwd(), 'test-temp-dir')

    beforeEach(() => {
      // Clean up if exists from previous test
      try {
        rmSync(testDir, { recursive: true, force: true })
      }
      catch { /* Ignore errors */ }

      // Create test directory structure
      mkdirSync(testDir, { recursive: true })
      mkdirSync(join(testDir, 'subdir'), { recursive: true })
    })

    afterEach(() => {
      // Clean up test directory
      try {
        rmSync(testDir, { recursive: true, force: true })
      }
      catch { /* Ignore errors */ }
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
