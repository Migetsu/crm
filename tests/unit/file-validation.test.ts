import { describe, it, expect } from 'vitest'
import { validateFile, formatFileSize } from '../../app/utils/file-validation'

describe('file-validation', () => {
  it('accepts valid PDF within size limit', () => {
    const file = {
      name: 'resume.pdf',
      size: 2 * 1024 * 1024,
      type: 'application/pdf',
    }
    const result = validateFile(file)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('accepts docx and doc files', () => {
    const docx = {
      name: 'cv.docx',
      size: 1024 * 100,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    expect(validateFile(docx).valid).toBe(true)

    const doc = {
      name: 'cv.doc',
      size: 1024 * 200,
      type: 'application/msword',
    }
    expect(validateFile(doc).valid).toBe(true)
  })

  it('rejects files larger than max size', () => {
    const largeFile = {
      name: 'large_archive.pdf',
      size: 15 * 1024 * 1024, // 15MB > 10MB limit
      type: 'application/pdf',
    }
    const result = validateFile(largeFile)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('10 МБ')
  })

  it('rejects unsupported extensions', () => {
    const exe = {
      name: 'virus.exe',
      size: 1024,
      type: 'application/x-msdownload',
    }
    const result = validateFile(exe)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Недопустимый формат')
  })

  it('formats file sizes into human readable strings', () => {
    expect(formatFileSize(500)).toBe('500 Б')
    expect(formatFileSize(1024)).toBe('1.0 КБ')
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 МБ')
  })
})
