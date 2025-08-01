"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Edit, Trash2, FileText, Download, Upload, Paperclip, Eye, Loader2, Filter, Calendar } from "lucide-react"
import type { Letter, LetterStats, CreateLetterData, FileUploadResponse } from "@/types/letter"

/**
 * Correspondence Page - Halaman manajemen surat menyurat
 * 
 * Fungsi utama:
 * - Mengelola surat masuk dan surat keluar UPT
 * - Tracking nomor surat, tanggal, dan subjek surat
 * - Mencatat pengirim/penerima surat
 * - Monitoring dan arsip dokumen surat
 * 
 * Jenis surat yang dikelola:
 * - INCOMING: Surat masuk dari pihak eksternal
 * - OUTGOING: Surat keluar yang diterbitkan UPT
 * 
 * Fitur yang tersedia:
 * - CRUD operations untuk data surat
 * - Filter berdasarkan jenis surat
 * - Search berdasarkan nomor, subjek, atau pengirim
 * - Statistik surat masuk/keluar per periode
 * - Pagination untuk handling volume surat besar
 * - Upload dan attach dokumen surat
 * 
 * Data yang dicatat:
 * - Nomor surat dan tanggal
 * - Subjek/perihal surat
 * - Pengirim dan penerima
 * - Deskripsi singkat isi surat
 */

export default function CorrespondencePage() {
  const { data: session, status } = useSession()
  const [letters, setLetters] = useState<Letter[]>([])
  const [letterStats, setLetterStats] = useState<LetterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
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
    } catch (error) {
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
    } catch (error) {
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

    fetchLetters()
    fetchLetterStats()
  }, [session, status, router])

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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INCOMING":
        return (
          <Badge variant="default">
            <Download className="mr-1 h-3 w-3" />
            Masuk
          </Badge>
        )
      case "OUTGOING":
        return (
          <Badge variant="secondary">
            <Upload className="mr-1 h-3 w-3" />
            Keluar
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
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

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administrasi Surat-Menyurat</h1>
            <p className="text-muted-foreground">Kelola data surat masuk dan surat keluar</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Surat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Surat Baru</DialogTitle>
                <DialogDescription>
                  Masukkan informasi surat yang akan dicatat
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="number">Nomor Surat *</Label>
                    <Input
                      id="number"
                      value={newLetter.number}
                      onChange={(e) => setNewLetter({ ...newLetter, number: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Tanggal *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newLetter.date}
                      onChange={(e) => setNewLetter({ ...newLetter, date: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Perihal *</Label>
                  <Input
                    id="subject"
                    value={newLetter.subject}
                    onChange={(e) => setNewLetter({ ...newLetter, subject: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Jenis Surat *</Label>
                  <Select
                    value={newLetter.type}
                    onValueChange={(value: "INCOMING" | "OUTGOING") => setNewLetter({ ...newLetter, type: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOMING">Surat Masuk</SelectItem>
                      <SelectItem value="OUTGOING">Surat Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newLetter.type === "INCOMING" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="from">Asal Surat</Label>
                    <Input
                      id="from"
                      value={newLetter.from || ""}
                      onChange={(e) => setNewLetter({ ...newLetter, from: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="to">Tujuan Surat</Label>
                    <Input
                      id="to"
                      value={newLetter.to || ""}
                      onChange={(e) => setNewLetter({ ...newLetter, to: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="description">Keterangan</Label>
                  <Textarea
                    id="description"
                    value={newLetter.description || ""}
                    onChange={(e) => setNewLetter({ ...newLetter, description: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="Keterangan tambahan tentang surat"
                  />
                </div>
                <FileUpload
                  onUploadComplete={handleFileUpload}
                  onRemove={handleFileRemove}
                  currentFile={newLetter.documentName ? {
                    name: newLetter.documentName,
                    size: newLetter.documentSize,
                    path: newLetter.documentPath
                  } : undefined}
                  disabled={isSubmitting}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleAddLetter} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Tambah Surat"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Surat</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{letterStats?.totalLetters || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Surat Masuk</CardTitle>
              <Download className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{letterStats?.incomingLetters || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Surat Keluar</CardTitle>
              <Upload className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{letterStats?.outgoingLetters || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ada Dokumen</CardTitle>
              <Paperclip className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{letterStats?.lettersWithDocuments || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{letterStats?.recentLetters || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Surat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Pencarian</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Cari nomor, perihal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline" size="icon" onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Jenis Surat</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua jenis</SelectItem>
                    <SelectItem value="INCOMING">Surat Masuk</SelectItem>
                    <SelectItem value="OUTGOING">Surat Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={resetFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Letters Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Surat</CardTitle>
            <CardDescription>Kelola semua catatan surat masuk dan keluar</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Surat</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Perihal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Asal/Tujuan</TableHead>
                  <TableHead>Dokumen</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {letters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell className="font-medium">{letter.number}</TableCell>
                    <TableCell>{new Date(letter.date).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{letter.subject}</TableCell>
                    <TableCell>{getTypeBadge(letter.type)}</TableCell>
                    <TableCell>{letter.from || letter.to || "-"}</TableCell>
                    <TableCell>
                      {letter.hasDocument ? (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(letter)}
                            className="h-8 px-2"
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(letter)}
                            className="h-8 px-2"
                            title={`Download: ${letter.documentName || 'document'}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{letter.createdBy.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingLetter({ ...letter })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(session?.user.role === "ADMINISTRATOR" || letter.createdBy.id === session?.user.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLetter(letter.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingLetter} onOpenChange={() => setEditingLetter(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Surat</DialogTitle>
              <DialogDescription>Ubah informasi surat</DialogDescription>
            </DialogHeader>
            {editingLetter && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-number">Nomor Surat</Label>
                    <Input
                      id="edit-number"
                      value={editingLetter.number}
                      onChange={(e) => setEditingLetter({ ...editingLetter, number: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-date">Tanggal</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editingLetter.date.split('T')[0]}
                      onChange={(e) => setEditingLetter({ ...editingLetter, date: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-subject">Perihal</Label>
                  <Input
                    id="edit-subject"
                    value={editingLetter.subject}
                    onChange={(e) => setEditingLetter({ ...editingLetter, subject: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Jenis Surat</Label>
                  <Select
                    value={editingLetter.type}
                    onValueChange={(value: "INCOMING" | "OUTGOING") => setEditingLetter({ ...editingLetter, type: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOMING">Surat Masuk</SelectItem>
                      <SelectItem value="OUTGOING">Surat Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingLetter.type === "INCOMING" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-from">Asal Surat</Label>
                    <Input
                      id="edit-from"
                      value={editingLetter.from || ""}
                      onChange={(e) => setEditingLetter({ ...editingLetter, from: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-to">Tujuan Surat</Label>
                    <Input
                      id="edit-to"
                      value={editingLetter.to || ""}
                      onChange={(e) => setEditingLetter({ ...editingLetter, to: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Keterangan</Label>
                  <Textarea
                    id="edit-description"
                    value={editingLetter.description || ""}
                    onChange={(e) => setEditingLetter({ ...editingLetter, description: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <FileUpload
                  onUploadComplete={handleEditFileUpload}
                  onRemove={handleEditFileRemove}
                  currentFile={editingLetter.documentName ? {
                    name: editingLetter.documentName,
                    size: editingLetter.documentSize,
                    path: editingLetter.documentPath
                  } : undefined}
                  letterId={editingLetter.id}
                  disabled={isSubmitting}
                />
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditLetter} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
