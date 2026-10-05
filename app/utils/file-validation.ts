export interface SimpleFileInfo {
  name: string
  size: number
  type?: string
}

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export const MAX_RESUME_SIZE = 10 * 1024 * 1024 // 10 MB

export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']

export const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
]

/**
 * Validates file size and extension for resume and attachment uploads.
 */
export const validateFile = (
  file: SimpleFileInfo,
  maxSize = MAX_RESUME_SIZE,
  allowedExtensions = ALLOWED_RESUME_EXTENSIONS,
): FileValidationResult => {
  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024))
    return {
      valid: false,
      error: `Файл слишком большой. Максимальный размер: ${maxMb} МБ`,
    }
  }

  const name = file.name.toLowerCase()
  const hasValidExt = allowedExtensions.some(ext => name.endsWith(ext))

  if (!hasValidExt) {
    return {
      valid: false,
      error: `Недопустимый формат файла. Разрешены: ${allowedExtensions.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Formats bytes to human-readable size in Russian.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}
