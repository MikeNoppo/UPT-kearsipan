"use client"

import type React from "react"

import { useState } from "react"
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
import { Plus, Search, Edit, Trash2, FileText, Download, Upload, Paperclip, Eye } from "lucide-react"

interface Letter {
  id: string
  number: string
  date: string
  subject: string
  type: "incoming" | "outgoing"
  from?: string
  to?: string
  description: string
  status: "received" | "processed" | "sent" | "archived"
  hasDocument: boolean
  documentName?: string
  documentUrl?: string
}

export default function CorrespondencePage() {
  const [letters, setLetters] = useState<Letter[]>([
    {
      id: "1",
      number: "SM/001/2024",
      date: "2024-01-15",
      subject: "Permohonan Data Arsip",
      type: "incoming",
      from: "Fakultas Teknik",
      description: "Permohonan data arsip mahasiswa untuk keperluan akreditasi",
      status: "received",
      hasDocument: true,
      documentName: "surat_permohonan_data.pdf",
      documentUrl: "/documents/surat_permohonan_data.pdf",
    },
    {
      id: "2",
      number: "SK/002/2024",
      date: "2024-01-14",
      subject: "Laporan Kegiatan Bulanan",
      type: "outgoing",
      to: "Rektorat",
      description: "Laporan kegiatan UPT Kearsipan bulan Desember 2023",
      status: "sent",
      hasDocument: false,
    },
    {
      id: "3",
      number: "SM/003/2024",
      date: "2024-01-13",
      subject: "Undangan Rapat Koordinasi",
      type: "incoming",
      from: "Bagian Umum",
      description: "Undangan rapat koordinasi bulanan",
      status: "received",
      hasDocument: false,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [newLetter, setNewLetter] = useState({
    number: "",
    date: "",
    subject: "",
    type: "incoming" as "incoming" | "outgoing",
    from: "",
    to: "",
    description: "",
  })

  const filteredLetters = letters.filter((letter) => {
    const matchesSearch =
      letter.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (letter.from && letter.from.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (letter.to && letter.to.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = selectedType === "all" || letter.type === selectedType
    return matchesSearch && matchesType
  })

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "incoming":
        return (
          <Badge variant="default">
            <Download className="mr-1 h-3 w-3" />
            Masuk
          </Badge>
        )
      case "outgoing":
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
      case "received":
        return <Badge variant="secondary">Diterima</Badge>
      case "processed":
        return <Badge variant="default">Diproses</Badge>
      case "sent":
        return <Badge variant="default">Terkirim</Badge>
      case "archived":
        return <Badge variant="outline">Diarsipkan</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleAddLetter = () => {
    const letter: Letter = {
      id: Date.now().toString(),
      ...newLetter,
      status: newLetter.type === "incoming" ? "received" : "sent",
      hasDocument: !!selectedFile,
      documentName: selectedFile?.name,
      documentUrl: selectedFile ? `/documents/${selectedFile.name}` : undefined,
    }

    setLetters([...letters, letter])
    setNewLetter({
      number: "",
      date: "",
      subject: "",
      type: "incoming",
      from: "",
      to: "",
      description: "",
    })
    setSelectedFile(null)
    setIsAddDialogOpen(false)
  }

  const handleEditLetter = () => {
    if (!editingLetter) return

    setLetters(letters.map((letter) => (letter.id === editingLetter.id ? editingLetter : letter)))
    setEditingLetter(null)
  }

  const handleDeleteLetter = (id: string) => {
    setLetters(letters.filter((letter) => letter.id !== id))
  }

  const openEditDialog = (letter: Letter) => {
    setEditingLetter({ ...letter })
  }

  const handleViewDocument = (letter: Letter) => {
    if (letter.documentUrl) {
      // In a real app, this would open the document
      alert(`Membuka dokumen: ${letter.documentName}`)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administrasi Surat-Menyurat</h1>
            <p className="text-muted-foreground">Kelola data surat masuk dan surat keluar dengan upload dokumen</p>
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
                  Masukkan informasi surat yang akan dicatat dan upload dokumen jika ada.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="number">Nomor Surat</Label>
                    <Input
                      id="number"
                      value={newLetter.number}
                      onChange={(e) => setNewLetter({ ...newLetter, number: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newLetter.date}
                      onChange={(e) => setNewLetter({ ...newLetter, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Perihal</Label>
                  <Input
                    id="subject"
                    value={newLetter.subject}
                    onChange={(e) => setNewLetter({ ...newLetter, subject: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Jenis Surat</Label>
                  <Select
                    value={newLetter.type}
                    onValueChange={(value: "incoming" | "outgoing") => setNewLetter({ ...newLetter, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incoming">Surat Masuk</SelectItem>
                      <SelectItem value="outgoing">Surat Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newLetter.type === "incoming" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="from">Asal Surat</Label>
                    <Input
                      id="from"
                      value={newLetter.from}
                      onChange={(e) => setNewLetter({ ...newLetter, from: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="to">Tujuan Surat</Label>
                    <Input
                      id="to"
                      value={newLetter.to}
                      onChange={(e) => setNewLetter({ ...newLetter, to: e.target.value })}
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="description">Keterangan</Label>
                  <Textarea
                    id="description"
                    value={newLetter.description}
                    onChange={(e) => setNewLetter({ ...newLetter, description: e.target.value })}
                    placeholder="Keterangan tambahan tentang surat"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="document">Upload Dokumen (Wajib)</Label>
                  <Input id="document" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.png" />
                  {selectedFile && <p className="text-sm text-muted-foreground">File dipilih: {selectedFile.name}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddLetter} disabled={!selectedFile}>
                  Tambah Surat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Surat</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{letters.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Surat Masuk</CardTitle>
              <Download className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{letters.filter((l) => l.type === "incoming").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Surat Keluar</CardTitle>
              <Upload className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{letters.filter((l) => l.type === "outgoing").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ada Dokumen</CardTitle>
              <Paperclip className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{letters.filter((l) => l.hasDocument).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {letters.filter((l) => new Date(l.date).getMonth() === new Date().getMonth()).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari surat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="incoming">Surat Masuk</SelectItem>
              <SelectItem value="outgoing">Surat Keluar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Surat</CardTitle>
            <CardDescription>Total {filteredLetters.length} surat dalam database</CardDescription>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLetters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell className="font-medium">{letter.number}</TableCell>
                    <TableCell>{new Date(letter.date).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{letter.subject}</TableCell>
                    <TableCell>{getTypeBadge(letter.type)}</TableCell>
                    <TableCell>{letter.from || letter.to}</TableCell>
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
                    <TableCell>{getStatusBadge(letter.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(letter)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteLetter(letter.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-date">Tanggal</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editingLetter.date}
                      onChange={(e) => setEditingLetter({ ...editingLetter, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-subject">Perihal</Label>
                  <Input
                    id="edit-subject"
                    value={editingLetter.subject}
                    onChange={(e) => setEditingLetter({ ...editingLetter, subject: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Keterangan</Label>
                  <Textarea
                    id="edit-description"
                    value={editingLetter.description}
                    onChange={(e) => setEditingLetter({ ...editingLetter, description: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditLetter}>Simpan Perubahan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
