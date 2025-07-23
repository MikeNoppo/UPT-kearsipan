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
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Edit, Trash2, FileText, Download, Upload, Paperclip, Eye, Loader2, Filter, Calendar } from "lucide-react"
import type { Letter, LetterStats, CreateLetterData } from "@/types/letter"

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
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()
  const { toast } = useToast()

  const [newLetter, setNewLetter] = useState<CreateLetterData>({
    number: "",
    date: new Date().toISOString().split('T')[0],
    subject: "",
    type: "INCOMING",
    from: "",
    to: "",
    description: "",
  })

  const fetchLetters = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && typeFilter !== "all" && { type: typeFilter }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
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
  }, [currentPage, searchTerm, typeFilter, statusFilter, toast])

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

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchLetters()
    fetchLetterStats()
  }, [session, status, router, fetchLetters, fetchLetterStats])

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
        method: "PUT",
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
          status: editingLetter.status,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return <Badge variant="secondary">Diterima</Badge>
      case "SENT":
        return <Badge variant="default">Terkirim</Badge>
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>
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
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const handleViewDocument = (letter: Letter) => {
    if (letter.documentPath) {
      // In a real app, this would open the document
      alert(`Membuka dokumen: ${letter.documentPath}`)
    } else {
      alert("Tidak ada dokumen yang tersedia")
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
              <div className="text-2xl font-bold">{letterStats?.totalLetters || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Surat Masuk</CardTitle>
              <Download className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{letterStats?.incomingLetters || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Surat Keluar</CardTitle>
              <Upload className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{letterStats?.outgoingLetters || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ada Dokumen</CardTitle>
              <Paperclip className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{letterStats?.lettersWithDocuments || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{letterStats?.recentLetters || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Surat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    <SelectItem value="RECEIVED">Diterima</SelectItem>
                    <SelectItem value="SENT">Terkirim</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
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
                  <TableHead>Status</TableHead>
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
                    <TableCell>{getStatusBadge(letter.status)}</TableCell>
                    <TableCell>
                      {letter.hasDocument ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(letter)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                  <Label>Status</Label>
                  <Select
                    value={editingLetter.status}
                    onValueChange={(value: "RECEIVED" | "SENT" | "DRAFT") => setEditingLetter({ ...editingLetter, status: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEIVED">Diterima</SelectItem>
                      <SelectItem value="SENT">Terkirim</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Keterangan</Label>
                  <Textarea
                    id="edit-description"
                    value={editingLetter.description || ""}
                    onChange={(e) => setEditingLetter({ ...editingLetter, description: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
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
