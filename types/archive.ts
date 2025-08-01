export interface Archive {
  id: string
  code: string
  title: string
  category: string
  creationDate: string
  retentionPeriod: number
  location: string
  description?: string
  notes?: string
  destructionDate?: string
  createdAt: string
  updatedAt: string
  archivedBy: {
    id: string
    name: string
    username: string
  }
  // Computed properties untuk status arsip
  isActive?: boolean        // Masih dalam masa retensi
  isExpired?: boolean       // Lewat masa retensi
  daysTillExpiry?: number   // Hari tersisa sebelum kadaluarsa
  isDestroyed?: boolean     // Sudah dimusnahkan
}

export interface ArchiveStats {
  totalArchives: number
  activeArchives: number      // Arsip yang masih dalam masa retensi
  expiredArchives: number     // Arsip yang lewat masa retensi
  destroyedArchives: number   // Arsip yang sudah dimusnahkan
  recentArchives: number
  categoriesStats: Array<{
    category: string
    count: number
  }>
  monthlyData: Array<{
    month: string
    count: number
  }>
  period: string
}

export interface CreateArchiveData {
  code: string
  title: string
  category: string
  creationDate: string
  retentionPeriod: number
  location: string
  description?: string
  notes?: string
  destructionDate?: string  // Hanya diisi jika arsip sudah dimusnahkan
}

export interface UpdateArchiveData {
  code?: string
  title?: string
  category?: string
  creationDate?: string
  retentionPeriod?: number
  status?: "UNDER_REVIEW" | "PERMANENT" | "SCHEDULED_DESTRUCTION"
  location?: string
  description?: string
  notes?: string
  destructionDate?: string
}

export interface ArchiveFilters {
  search?: string
  category?: string
  status?: string
  page?: number
  limit?: number
}

export interface ArchiveResponse {
  archives: Archive[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
