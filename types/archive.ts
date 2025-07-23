export interface Archive {
  id: string
  code: string
  title: string
  category: string
  creationDate: string
  retentionPeriod: number
  status: "UNDER_REVIEW" | "PERMANENT" | "SCHEDULED_DESTRUCTION"
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
}

export interface ArchiveStats {
  totalArchives: number
  permanentArchives: number
  scheduledForDestruction: number
  underReview: number
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
  status?: "UNDER_REVIEW" | "PERMANENT" | "SCHEDULED_DESTRUCTION"
  location: string
  description?: string
  notes?: string
  destructionDate?: string
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
