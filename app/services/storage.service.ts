import type { AppSupabaseClient } from './candidates.service'
import { validateFile } from '~/utils/file-validation'

export interface StorageFileItem {
  id?: string
  name: string
  path: string
  url: string
  size: number
  createdAt: string
  isPdf: boolean
}

export class StorageService {
  private bucket = 'resumes'

  constructor(private supabase: AppSupabaseClient) {}

  /**
   * Uploads a candidate resume or document to the 'resumes' bucket.
   */
  async uploadResume(
    candidateId: string,
    file: File,
  ): Promise<{ url: string; path: string; name: string; size: number; isPdf: boolean }> {
    const validation = validateFile({ name: file.name, size: file.size })
    if (!validation.valid) {
      throw new Error(validation.error || 'Ошибка валидации файла')
    }

    // Clean filename and add timestamp to avoid collisions
    const sanitizedName = file.name.replace(/[^\w\d._-]/g, '_')
    const timestamp = Date.now()
    const filePath = `${candidateId}/${timestamp}_${sanitizedName}`

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath)

    const url = publicUrlData.publicUrl
    const isPdf = file.name.toLowerCase().endsWith('.pdf')

    return {
      url,
      path: filePath,
      name: file.name,
      size: file.size,
      isPdf,
    }
  }

  /**
   * Lists all files uploaded for the given candidate.
   */
  async listResumes(candidateId: string): Promise<StorageFileItem[]> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list(candidateId, {
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      return []
    }

    return (data || [])
      .filter(item => item.name && !item.name.startsWith('.'))
      .map(item => {
        const filePath = `${candidateId}/${item.name}`
        const { data: urlData } = this.supabase.storage
          .from(this.bucket)
          .getPublicUrl(filePath)

        const isPdf = item.name.toLowerCase().endsWith('.pdf')
        const rawSize = (item.metadata as { size?: number })?.size || 0

        return {
          id: item.id,
          name: item.name.replace(/^\d+_/, ''),
          path: filePath,
          url: urlData.publicUrl,
          size: rawSize,
          createdAt: item.created_at || new Date().toISOString(),
          isPdf,
        }
      })
  }

  /**
   * Deletes a file from resumes bucket.
   */
  async deleteResume(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([path])

    if (error) throw error
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path)
    return data.publicUrl
  }
}
