"use client"

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
import { Plus, Search, Edit, Trash2, Archive, Calendar, AlertTriangle } from "lucide-react"

interface ArchiveItem {
  id: string
  code: string
  title: string
  category: string
  creationDate: string
  retentionPeriod: number // in years
  status: "permanent" | "scheduled_destruction" | "under_review"
  location: string
  description: string
  destructionDate?: string
  notes: string
}

export default function ArchiveInventoryPage() {
  const [archives, setArchives] = useState<ArchiveItem[]>([
    {
      id: "1",
      code: "ARS/2020/001",
      title: "Dokumen Akreditasi Program Studi",
      category: "Akademik",
      creationDate: "2020-01-15",
      retentionPeriod: 10,
      status: "permanent",
      location: "Rak A-1-001",
      description: "Dokumen akreditasi semua program studi tahun 2020",
      notes: "Dokumen penting untuk referensi akreditasi",
    },
    {
      id: "2",
      code: "ARS/2019/045",
      title: "Laporan Keuangan Tahunan",
      category: "Keuangan",
      creationDate: "2019-12-31",
      retentionPeriod: 5,
      status: "scheduled_destruction",
      location: "Rak B-2-015",
      description: "Laporan keuangan lengkap tahun 2019",
      destructionDate: "2024-12-31",
      notes: "Masa retensi habis, dijadwalkan musnah",
    },
    {
      id: "3",
      code: "ARS/2021/078",
      title: "Surat Keputusan Rektor",
      category: "Administrasi",
      creationDate: "2021-06-10",
      retentionPeriod: 25,
      status: "permanent",
      location: "Rak C-1-005",
      description: "Kumpulan SK Rektor tahun 2021",
      notes: "Dokumen permanen sesuai peraturan",
    },
    {
      id: "4",
      code: "ARS/2018/123",
      title: "Data Mahasiswa Lulus",
      category: "Akademik",
      creationDate: "2018-07-20",
      retentionPeriod: 7,
      status: "under_review",
      location: "Rak A-3-012",
      description: "Data kelulusan mahasiswa semester genap 2018",
      notes: "Sedang direview untuk penentuan status",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingArchive, setEditingArchive] = useState<ArchiveItem | null>(null)

  const [newArchive, setNewArchive] = useState({
    code: "",
    title: "",
    category: "",
    creationDate: "",
    retentionPeriod: 0,
    status: "under_review" as "permanent" | "scheduled_destruction" | "under_review",
    location: "",
    description: "",
    notes: "",
  })

  const categories = ["Akademik", "Keuangan", "Administrasi", "Kepegawaian", "Kemahasiswaan"]

  const filteredArchives = archives.filter((archive) => {
    const matchesSearch =
      archive.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || archive.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || archive.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "permanent":
        return (
          <Badge variant="default">
            <Archive className="mr-1 h-3 w-3" />
            Permanen
          </Badge>
        )
      case "scheduled_destruction":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Dijadwalkan Musnah
          </Badge>
        )
      case "under_review":
        return (
          <Badge variant="secondary">
            <Calendar className="mr-1 h-3 w-3" />
            Dalam Review
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const calculateDestructionDate = (creationDate: string, retentionPeriod: number) => {
    const creation = new Date(creationDate)
    creation.setFullYear(creation.getFullYear() + retentionPeriod)
    return creation.toISOString().split("T")[0]
  }

  const handleAddArchive = () => {
    const archive: ArchiveItem = {
      id: Date.now().toString(),
      ...newArchive,
      destructionDate:
        newArchive.status === "scheduled_destruction"
          ? calculateDestructionDate(newArchive.creationDate, newArchive.retentionPeriod)
          : undefined,
    }

    setArchives([...archives, archive])
    setNewArchive({
      code: "",
      title: "",
      category: "",
      creationDate: "",
      retentionPeriod: 0,
      status: "under_review",
      location: "",
      description: "",
      notes: "",
    })
    setIsAddDialogOpen(false)
  }

  const handleEditArchive = () => {
    if (!editingArchive) return

    const updatedArchive = {
      ...editingArchive,
      destructionDate:
        editingArchive.status === "scheduled_destruction"
          ? calculateDestructionDate(editingArchive.creationDate, editingArchive.retentionPeriod)
          : undefined,
    }

    setArchives(archives.map((archive) => (archive.id === editingArchive.id ? updatedArchive : archive)))
    setEditingArchive(null)
  }

  const handleDeleteArchive = (id: string) => {
    setArchives(archives.filter((archive) => archive.id !== id))
  }

  const openEditDialog = (archive: ArchiveItem) => {
    setEditingArchive({ ...archive })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventaris Arsip</h1>
            <p className="text-muted-foreground">Kelola inventaris arsip dengan status permanen atau musnah</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Arsip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Arsip Baru</DialogTitle>
                <DialogDescription>Masukkan informasi arsip yang akan dikelola</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Kode Arsip</Label>
                    <Input
                      id="code"
                      value={newArchive.code}
                      onChange={(e) => setNewArchive({ ...newArchive, code: e.target.value })}
                      placeholder="ARS/2024/001"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="creationDate">Tanggal Dibuat</Label>
                    <Input
                      id="creationDate"
                      type="date"
                      value={newArchive.creationDate}
                      onChange={(e) => setNewArchive({ ...newArchive, creationDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Judul Arsip</Label>
                  <Input
                    id="title"
                    value={newArchive.title}
                    onChange={(e) => setNewArchive({ ...newArchive, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Kategori</Label>
                    <Select onValueChange={(value) => setNewArchive({ ...newArchive, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="retentionPeriod">Masa Retensi (Tahun)</Label>
                    <Input
                      id="retentionPeriod"
                      type="number"
                      value={newArchive.retentionPeriod}
                      onChange={(e) =>
                        setNewArchive({
                          ...newArchive,
                          retentionPeriod: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Status Arsip</Label>
                    <Select
                      value={newArchive.status}
                      onValueChange={(value: "permanent" | "scheduled_destruction" | "under_review") =>
                        setNewArchive({ ...newArchive, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_review">Dalam Review</SelectItem>
                        <SelectItem value="permanent">Permanen</SelectItem>
                        <SelectItem value="scheduled_destruction">Dijadwalkan Musnah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Lokasi Penyimpanan</Label>
                    <Input
                      id="location"
                      value={newArchive.location}
                      onChange={(e) => setNewArchive({ ...newArchive, location: e.target.value })}
                      placeholder="Rak A-1-001"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={newArchive.description}
                    onChange={(e) => setNewArchive({ ...newArchive, description: e.target.value })}
                    placeholder="Deskripsi detail arsip"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={newArchive.notes}
                    onChange={(e) => setNewArchive({ ...newArchive, notes: e.target.value })}
                    placeholder="Catatan tambahan"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddArchive}>Tambah Arsip</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Arsip</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{archives.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permanen</CardTitle>
              <Archive className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{archives.filter((a) => a.status === "permanent").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dijadwalkan Musnah</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {archives.filter((a) => a.status === "scheduled_destruction").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dalam Review</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{archives.filter((a) => a.status === "under_review").length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari arsip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="permanent">Permanen</SelectItem>
              <SelectItem value="scheduled_destruction">Dijadwalkan Musnah</SelectItem>
              <SelectItem value="under_review">Dalam Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Inventaris Arsip</CardTitle>
            <CardDescription>Total {filteredArchives.length} arsip dalam inventaris</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Arsip</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Masa Retensi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArchives.map((archive) => (
                  <TableRow key={archive.id}>
                    <TableCell className="font-medium">{archive.code}</TableCell>
                    <TableCell>{archive.title}</TableCell>
                    <TableCell>{archive.category}</TableCell>
                    <TableCell>{archive.location}</TableCell>
                    <TableCell>{archive.retentionPeriod} tahun</TableCell>
                    <TableCell>{getStatusBadge(archive.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(archive)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteArchive(archive.id)}>
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
        <Dialog open={!!editingArchive} onOpenChange={() => setEditingArchive(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Arsip</DialogTitle>
              <DialogDescription>Ubah informasi arsip</DialogDescription>
            </DialogHeader>
            {editingArchive && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-code">Kode Arsip</Label>
                    <Input
                      id="edit-code"
                      value={editingArchive.code}
                      onChange={(e) => setEditingArchive({ ...editingArchive, code: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-location">Lokasi</Label>
                    <Input
                      id="edit-location"
                      value={editingArchive.location}
                      onChange={(e) => setEditingArchive({ ...editingArchive, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Judul Arsip</Label>
                  <Input
                    id="edit-title"
                    value={editingArchive.title}
                    onChange={(e) => setEditingArchive({ ...editingArchive, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status Arsip</Label>
                  <Select
                    value={editingArchive.status}
                    onValueChange={(value: "permanent" | "scheduled_destruction" | "under_review") =>
                      setEditingArchive({ ...editingArchive, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_review">Dalam Review</SelectItem>
                      <SelectItem value="permanent">Permanen</SelectItem>
                      <SelectItem value="scheduled_destruction">Dijadwalkan Musnah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Catatan</Label>
                  <Textarea
                    id="edit-notes"
                    value={editingArchive.notes}
                    onChange={(e) => setEditingArchive({ ...editingArchive, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditArchive}>Simpan Perubahan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
