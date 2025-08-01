export interface Letter {
  id: string
  number: string
  date: string
  subject: string
  type: "INCOMING" | "OUTGOING"
  from?: string
  to?: string
  description?: string
  hasDocument: boolean
  documentPath?: string
  documentName?: string    // Nama file asli
  documentSize?: number    // Size dalam bytes
  documentType?: string    // MIME type
  uploadedAt?: string      // Kapan file diupload
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    username: string
  }
}

export interface LetterStats {
  totalLetters: number
  incomingLetters: number
  outgoingLetters: number
  lettersWithDocuments: number
  recentLetters: number
  departmentStats: Array<{
    department: string
    count: number
  }>
  monthlyData: Array<{
    month: string
    type: string
    count: number
  }>
  period: string
}

export interface CreateLetterData {
  number: string
  date: string
  subject: string
  type: "INCOMING" | "OUTGOING"
  from?: string
  to?: string
  description?: string
  hasDocument?: boolean
  documentPath?: string
  documentName?: string
  documentSize?: number
  documentType?: string
}

export interface UpdateLetterData {
  number?: string
  date?: string
  subject?: string
  type?: "INCOMING" | "OUTGOING"
  from?: string
  to?: string
  description?: string
  hasDocument?: boolean
  documentPath?: string
  documentName?: string
  documentSize?: number
  documentType?: string
}

// Interface untuk response upload file
export interface FileUploadResponse {
  filename: string
  originalName: string
  size: number
  type: string
  path: string
}

export interface LetterFilters {
  search?: string
  type?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface LetterResponse {
  letters: Letter[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
