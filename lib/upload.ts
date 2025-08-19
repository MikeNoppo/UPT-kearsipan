import path from 'path'
import { createHash } from 'crypto'
import { supabase, LETTERS_BUCKET } from './supabase'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
]

// Generate secure filename while preserving original name info
export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now()
  const hash = createHash('md5').update(originalName + timestamp).digest('hex').substring(0, 10)
  const ext = path.extname(originalName).toLowerCase()
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '_')
  return `${timestamp}_${hash}_${baseName}${ext}`
}

export function validateFileType(mimetype: string): boolean {
  return ALLOWED_FILE_TYPES.includes(mimetype)
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE
}

// Upload file to Supabase storage bucket
export async function saveUploadedFile(file: File): Promise<{
  filename: string
  originalName: string
  size: number
  type: string
  path: string // Public URL or path relative to bucket
}> {
  if (!validateFileType(file.type)) {
    throw new Error('File type not allowed. Only PDF, DOC, DOCX, JPG, PNG are supported')
  }
  if (!validateFileSize(file.size)) {
    throw new Error('File too large. Maximum size is 10MB')
  }

  const filename = generateSecureFilename(file.name)

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from(LETTERS_BUCKET)
    .upload(`letters/${filename}`, arrayBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

  if (error) {
    console.error('Supabase upload error', error)
    throw new Error(`Upload to storage failed: ${error.message}`)
  }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from(LETTERS_BUCKET)
    .getPublicUrl(`letters/${filename}`)

  return {
    filename,
    originalName: file.name,
    size: file.size,
    type: file.type,
    path: publicData.publicUrl // store full public URL
  }
}

// Delete file from Supabase storage (expects stored path maybe URL)
export async function deleteFile(filePathOrUrl: string): Promise<void> {
  try {
    // Accept either full public URL or relative path after bucket
    let relativePath = filePathOrUrl
    const urlParts = filePathOrUrl.split('/storage/v1/object/public/')
    if (urlParts.length === 2) {
      // After this part we have bucket/path
      const afterPublic = urlParts[1]
      // remove bucket name prefix
      const bucketAndPath = afterPublic.split('/')
      bucketAndPath.shift() // remove bucket
      relativePath = bucketAndPath.join('/')
    }
    // Ensure starts with letters/
    if (!relativePath.startsWith('letters/')) return
    await supabase.storage.from(LETTERS_BUCKET).remove([relativePath])
  } catch (e) {
    console.warn('Failed to delete file from storage', e)
  }
}

export function getFilenameFromPath(filePath: string): string {
  return path.basename(filePath)
}
