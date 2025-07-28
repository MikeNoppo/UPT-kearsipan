import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { createHash } from 'crypto'

export const UPLOAD_DIR = './public/uploads/letters'
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
]

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }
  } catch (error) {
    console.error('Failed to create upload directory:', error)
    throw new Error('Failed to create upload directory')
  }
}

// Generate secure filename while preserving original name info
export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const hash = createHash('md5').update(originalName + timestamp).digest('hex').substring(0, 8)
  const ext = path.extname(originalName).toLowerCase()
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '_')
  
  return `${timestamp}_${hash}_${baseName}${ext}`
}

// Validate file type
export function validateFileType(mimetype: string): boolean {
  return ALLOWED_FILE_TYPES.includes(mimetype)
}

// Validate file size
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Save uploaded file
export async function saveUploadedFile(file: File): Promise<{
  filename: string
  originalName: string
  size: number
  type: string
  path: string
}> {
  await ensureUploadDir()
  
  // Validate file
  if (!validateFileType(file.type)) {
    throw new Error('File type not allowed. Only PDF, DOC, DOCX, JPG, PNG are supported')
  }
  
  if (!validateFileSize(file.size)) {
    throw new Error('File too large. Maximum size is 10MB')
  }
  
  // Generate secure filename
  const filename = generateSecureFilename(file.name)
  const filepath = path.join(UPLOAD_DIR, filename)
  
  // Save file
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)
  
  return {
    filename,
    originalName: file.name,
    size: file.size,
    type: file.type,
    path: `/uploads/letters/${filename}`
  }
}

// Delete file from filesystem
export async function deleteFile(filename: string): Promise<void> {
  try {
    const filepath = path.join(UPLOAD_DIR, filename)
    if (existsSync(filepath)) {
      await unlink(filepath)
    }
  } catch (error) {
    console.error('Failed to delete file:', error)
    // Don't throw error for file deletion failures in cleanup
  }
}

// Extract filename from path
export function getFilenameFromPath(filePath: string): string {
  return path.basename(filePath)
}
