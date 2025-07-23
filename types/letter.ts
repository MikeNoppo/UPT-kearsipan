export interface Letter {
  id: string
  number: string
  date: string
  subject: string
  type: "INCOMING" | "OUTGOING"
  from?: string
  to?: string
  description?: string
  status: "RECEIVED" | "SENT" | "DRAFT"
  hasDocument: boolean
  documentPath?: string
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
  statusStats: {
    received?: number
    sent?: number
    draft?: number
  }
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
  status?: "RECEIVED" | "SENT" | "DRAFT"
  hasDocument?: boolean
  documentPath?: string
}

export interface UpdateLetterData {
  number?: string
  date?: string
  subject?: string
  type?: "INCOMING" | "OUTGOING"
  from?: string
  to?: string
  description?: string
  status?: "RECEIVED" | "SENT" | "DRAFT"
  hasDocument?: boolean
  documentPath?: string
}

export interface LetterFilters {
  search?: string
  type?: string
  status?: string
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
