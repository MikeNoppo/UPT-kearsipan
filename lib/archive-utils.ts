import type { Archive } from "@/types/archive"

/**
 * Archive Status Utilities
 * 
 * Fungsi helper untuk menentukan status arsip berdasarkan:
 * - creationDate: Tanggal pembuatan arsip
 * - retentionPeriod: Masa retensi dalam tahun
 * - destructionDate: Tanggal pemusnahan aktual (jika ada)
 */

/**
 * Menghitung tanggal kadaluarsa arsip
 */
export function getExpiryDate(creationDate: string, retentionPeriod: number): Date {
  const creation = new Date(creationDate)
  const expiry = new Date(creation)
  expiry.setFullYear(creation.getFullYear() + retentionPeriod)
  return expiry
}

/**
 * Mengecek apakah arsip masih aktif (dalam masa retensi)
 */
export function isArchiveActive(archive: Archive): boolean {
  if (archive.destructionDate) return false // Sudah dimusnahkan
  
  const expiryDate = getExpiryDate(archive.creationDate, archive.retentionPeriod)
  const now = new Date()
  return now < expiryDate
}

/**
 * Mengecek apakah arsip sudah kadaluarsa (lewat masa retensi)
 */
export function isArchiveExpired(archive: Archive): boolean {
  if (archive.destructionDate) return false // Sudah dimusnahkan
  
  const expiryDate = getExpiryDate(archive.creationDate, archive.retentionPeriod)
  const now = new Date()
  return now >= expiryDate
}

/**
 * Mengecek apakah arsip sudah dimusnahkan
 */
export function isArchiveDestroyed(archive: Archive): boolean {
  return !!archive.destructionDate
}

/**
 * Menghitung sisa hari sebelum arsip kadaluarsa
 */
export function getDaysTillExpiry(archive: Archive): number {
  if (archive.destructionDate) return 0 // Sudah dimusnahkan
  
  const expiryDate = getExpiryDate(archive.creationDate, archive.retentionPeriod)
  const now = new Date()
  const diffTime = expiryDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * Mendapatkan status arsip dalam bentuk string
 */
export function getArchiveStatus(archive: Archive): {
  status: 'ACTIVE' | 'EXPIRED' | 'DESTROYED'
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  if (isArchiveDestroyed(archive)) {
    return {
      status: 'DESTROYED',
      label: 'Dimusnahkan',
      variant: 'destructive'
    }
  }
  
  if (isArchiveExpired(archive)) {
    return {
      status: 'EXPIRED', 
      label: 'Kadaluarsa',
      variant: 'secondary'
    }
  }
  
  return {
    status: 'ACTIVE',
    label: 'Aktif',
    variant: 'default'
  }
}

/**
 * Mengecek apakah arsip mendekati masa kadaluarsa (dalam 30 hari)
 */
export function isArchiveNearExpiry(archive: Archive, warningDays: number = 30): boolean {
  if (archive.destructionDate) return false
  
  const daysTillExpiry = getDaysTillExpiry(archive)
  return daysTillExpiry > 0 && daysTillExpiry <= warningDays
}

/**
 * Menambahkan computed properties ke objek archive
 */
export function enrichArchiveWithStatus(archive: Archive): Archive {
  return {
    ...archive,
    isActive: isArchiveActive(archive),
    isExpired: isArchiveExpired(archive),
    daysTillExpiry: getDaysTillExpiry(archive),
    isDestroyed: isArchiveDestroyed(archive)
  }
}
