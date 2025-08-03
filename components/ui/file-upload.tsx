"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Upload, File, X, Download, RefreshCw, Eye } from 'lucide-react'
import type { FileUploadResponse } from '@/types/letter'

interface FileUploadProps {
  onUploadComplete: (fileData: FileUploadResponse) => void
  onRemove: () => void
  currentFile?: {
    name: string
    size?: number
    path?: string
  }
  letterId?: string  // For download functionality
  disabled?: boolean
}

export function FileUpload({ 
  onUploadComplete, 
  onRemove, 
  currentFile, 
  letterId,
  disabled 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input value to allow selecting the same file again
    event.target.value = ''

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]

    if (file.size > maxSize) {
      toast({
        title: 'Error',
        description: 'File terlalu besar. Maksimal 10MB',
        variant: 'destructive'
      })
      return
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error', 
        description: 'Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG',
        variant: 'destructive'
      })
      return
    }

    // Upload file
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch('/api/letters/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      setUploadProgress(100)
      onUploadComplete(result)
      
      toast({
        title: 'Success',
        description: 'File berhasil diupload'
      })

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Upload gagal',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDownload = async () => {
    if (!letterId) {
      toast({
        title: 'Error',
        description: 'Tidak dapat download: ID surat tidak ditemukan',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/letters/${letterId}/download`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }

      // Get filename from response headers or use current file name
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = currentFile?.name || 'document'
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'File berhasil didownload'
      })

    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Download gagal',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-2">
      <Label>Dokumen Surat</Label>
      
      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        disabled={uploading || disabled}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      
      {currentFile ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
            <File className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <div className="text-sm font-medium">{currentFile.name}</div>
              {currentFile.size && (
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(currentFile.size)}
                </div>
              )}
            </div>
            <div className="flex space-x-1">
              {letterId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  disabled={disabled}
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                title="Ganti file"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                disabled={disabled}
                title="Hapus file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="w-full"
          >
            {uploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Pilih File
              </>
            )}
          </Button>
          
          {uploading && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Format: PDF, DOC, DOCX, JPG, PNG. Maksimal 10MB
          </p>
        </div>
      )}
    </div>
  )
}
