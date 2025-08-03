"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { Letter, LetterStats, CreateLetterData, FileUploadResponse } from "@/types/letter"

import { CorrespondenceStatsCards } from "./correspondence-stats-cards"
import { CorrespondenceFilter } from "./correspondence-filter"
import { CorrespondenceTable } from "./correspondence-table"
import { AddLetterDialog } from "./add-letter-dialog"
import { EditLetterDialog } from "./edit-letter-dialog"

interface CorrespondenceClientProps {
  initialLetters: Letter[]
  initialStats: LetterStats | null
  initialPagination: {
    currentPage: number
    totalPages: number
  }
}

export function CorrespondenceClient({ 
  initialLetters, 
  initialStats, 
  initialPagination 
}: CorrespondenceClientProps) {
  const { data: session, status } = useSession()
  const [letters, setLetters] = useState<Letter[]>(initialLetters)
  const [letterStats, setLetterStats] = useState<LetterStats | null>(initialStats)
  const [loading, setLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage)
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages)
  
  const router = useRouter()
  const { toast } = useToast()

  // Data form untuk surat baru
  const [newLetter, setNewLetter] = useState<CreateLetterData>({
    number: "",
    date: new Date().toISOString().split('T')[0],
    subject: "",
    type: "INCOMING",
    from: "",
    to: "",
    description: "",
    documentPath: undefined,
    documentName: undefined,
    documentSize: undefined,
    documentType: undefined,
  })

  // Mengambil data surat dengan filter dan pagination
  const fetchLetters = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && typeFilter !== "all" && { type: typeFilter }),
      })

      const response = await fetch(`/api/letters?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch letters")
      }
      const data = await response.json()
      setLetters(data.letters)
      setTotalPages(data.pagination.pages)
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch letters",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, typeFilter, toast])

  // Mengambil statistik surat (jumlah masuk/keluar per periode)
  const fetchLetterStats = useCallback(async () => {
    try {
      const response = await fetch("/api/letters/stats?period=month")
      if (!response.ok) {
        throw new Error("Failed to fetch letter statistics")
      }
      const data = await response.json()
      setLetterStats(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch letter statistics",
        variant: "destructive",
      })
    }
  }, [toast])

  // Load data saat komponen mount dan cek authentication
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Selalu fetch data ketika component mount dengan session
    fetchLetters()
    fetchLetterStats()
  }, [session, status, router, fetchLetters, fetchLetterStats])

  // Menambah surat baru
  const handleAddLetter = async () => {
    if (!newLetter.number || !newLetter.subject || !newLetter.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newLetter,
          date: new Date(newLetter.date).toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create letter")
      }

      const createdLetter = await response.json()
      setLetters([createdLetter, ...letters])
      
      // Reset form
      setNewLetter({
        number: "",
        date: new Date().toISOString().split('T')[0],
        subject: "",
        type: "INCOMING",
        from: "",
        to: "",
        description: "",
        documentPath: undefined,
        documentName: undefined,
        documentSize: undefined,
        documentType: undefined,
      })
      setIsAddDialogOpen(false)
      await fetchLetterStats()
      
      toast({
        title: "Success",
        description: "Letter created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create letter",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditLetter = async () => {
    if (!editingLetter) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/letters/${editingLetter.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: editingLetter.number,
          date: new Date(editingLetter.date).toISOString(),
          subject: editingLetter.subject,
          type: editingLetter.type,
          from: editingLetter.from,
          to: editingLetter.to,
          description: editingLetter.description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update letter")
      }

      const updatedLetter = await response.json()
      setLetters(letters.map((letter) => 
        letter.id === updatedLetter.id ? updatedLetter : letter
      ))
      setEditingLetter(null)
      await fetchLetterStats()
      
      toast({
        title: "Success",
        description: "Letter updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update letter",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLetter = async (id: string) => {
    if (!confirm("Are you sure you want to delete this letter?")) {
      return
    }

    try {
      const response = await fetch(`/api/letters/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete letter")
      }

      setLetters(letters.filter((letter) => letter.id !== id))
      await fetchLetterStats()
      
      toast({
        title: "Success",
        description: "Letter deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete letter",
        variant: "destructive",
      })
    }
  }

  // File upload handlers
  const handleFileUpload = (fileData: FileUploadResponse) => {
    setNewLetter({
      ...newLetter,
      hasDocument: true,
      documentPath: fileData.path,
      documentName: fileData.originalName,
      documentSize: fileData.size,
      documentType: fileData.type,
    })
  }

  const handleFileRemove = () => {
    setNewLetter({
      ...newLetter,
      hasDocument: false,
      documentPath: undefined,
      documentName: undefined,
      documentSize: undefined,
      documentType: undefined,
    })
  }

  // File upload handlers for editing
  const handleEditFileUpload = (fileData: FileUploadResponse) => {
    if (editingLetter) {
      setEditingLetter({
        ...editingLetter,
        hasDocument: true,
        documentPath: fileData.path,
        documentName: fileData.originalName,
        documentSize: fileData.size,
        documentType: fileData.type,
      })
    }
  }

  const handleEditFileRemove = () => {
    if (editingLetter) {
      setEditingLetter({
        ...editingLetter,
        hasDocument: false,
        documentPath: undefined,
        documentName: undefined,
        documentSize: undefined,
        documentType: undefined,
      })
    }
  }

  // View document in new tab
  const handleViewDocument = (letter: Letter) => {
    if (!letter.hasDocument || !letter.documentPath) {
      toast({
        title: "Error",
        description: "Tidak ada dokumen yang tersedia",
        variant: "destructive"
      })
      return
    }

    // Open document in new tab
    const previewUrl = `/api/letters/${letter.id}/preview`
    window.open(previewUrl, '_blank')
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchLetters()
  }

  const resetFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setCurrentPage(1)
  }

  const handleDownloadDocument = async (letter: Letter) => {
    if (!letter.hasDocument || !letter.documentPath) {
      toast({
        title: "Error",
        description: "Tidak ada dokumen yang tersedia",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/letters/${letter.id}/download`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }

      // Get filename from response headers or use document name
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = letter.documentName || 'document'
      
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
        title: "Success",
        description: "File berhasil didownload"
      })

    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Download gagal",
        variant: "destructive"
      })
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Effect untuk fetch ulang data ketika filter berubah (hanya jika ada session)
  useEffect(() => {
    if (session && (searchTerm || typeFilter !== "all" || currentPage > 1)) {
      fetchLetters()
    }
  }, [currentPage, searchTerm, typeFilter, session, fetchLetters])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administrasi Surat-Menyurat</h1>
          <p className="text-muted-foreground">Kelola data surat masuk dan surat keluar</p>
        </div>
        <AddLetterDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          newLetter={newLetter}
          setNewLetter={setNewLetter}
          isSubmitting={isSubmitting}
          onSubmit={handleAddLetter}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
        />
      </div>

      <CorrespondenceStatsCards stats={letterStats} />

      <CorrespondenceFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onSearch={handleSearch}
        onResetFilters={resetFilters}
      />

      <CorrespondenceTable
        letters={letters}
        session={session}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onEditLetter={setEditingLetter}
        onDeleteLetter={handleDeleteLetter}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
      />

      <EditLetterDialog
        isOpen={!!editingLetter}
        onOpenChange={() => setEditingLetter(null)}
        editingLetter={editingLetter}
        setEditingLetter={setEditingLetter}
        isSubmitting={isSubmitting}
        onSubmit={handleEditLetter}
        onFileUpload={handleEditFileUpload}
        onFileRemove={handleEditFileRemove}
      />
    </div>
  )
}
