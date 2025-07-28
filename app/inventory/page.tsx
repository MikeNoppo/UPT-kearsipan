"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Trash2, Edit } from "lucide-react"

/**
 * Inventory Management Page - Halaman manajemen inventaris barang
 * 
 * Fungsi utama:
 * - Mengelola daftar barang inventaris UPT
 * - Menambah barang baru ke inventaris dengan informasi lengkap
 * - Memantau stok barang dan status ketersediaan (normal/low/critical)
 * - Melakukan transaksi stok (barang masuk/keluar)
 * - Filter dan pencarian barang berdasarkan nama dan kategori
 * 
 * Fitur yang tersedia:
 * - CRUD operasi untuk item inventaris
 * - Kategorisasi barang (Alat Tulis, Elektronik, Furniture, Konsumsi)
 * - Sistem alert untuk stok minimum
 * - Transaksi stok dengan keterangan
 * - Pencarian dan filter real-time
 * 
 * Data yang dikelola:
 * - Nama barang, kategori, satuan
 * - Jumlah stok aktual dan minimum
 * - Status ketersediaan otomatis
 * - Riwayat transaksi stok
 */

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
  status: "normal" | "low" | "critical"
  createdAt?: string
  updatedAt?: string
  stockTransactions?: StockTransaction[]
}

interface StockTransaction {
  id: string
  itemId: string
  type: "in" | "out"
  quantity: number
  date: string
  description: string
}

export default function InventoryPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // Memuat daftar inventaris saat komponen dimount
  useEffect(() => {
    fetchItems()
  }, [])

  // Mengambil data inventaris dari API
  const fetchItems = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      } else {
        console.error('Failed to fetch items')
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  // Data form untuk item baru
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    unit: "",
    stock: 0,
    minStock: 0,
  })

  const categories = ["Alat Tulis", "Elektronik", "Furniture", "Konsumsi"]

  // Filter inventaris berdasarkan pencarian dan kategori
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Fungsi untuk menentukan badge status stok
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">Kritis</Badge>
      case "low":
        return <Badge variant="secondary">Rendah</Badge>
      default:
        return <Badge variant="default">Normal</Badge>
    }
  }

  // Menambah item baru ke inventaris
  const handleAddItem = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      })

      if (response.ok) {
        await fetchItems() // Refresh items list
        setNewItem({ name: "", category: "", unit: "", stock: 0, minStock: 0 })
        setIsAddDialogOpen(false)
      } else {
        console.error('Failed to add item')
      }
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  // Menghapus item dari inventaris
  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchItems() // Refresh items list
      } else {
        console.error('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  // Mengedit item inventaris
  const handleEditItem = async () => {
    if (!editingItem) return

    try {
      const response = await fetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingItem.name,
          category: editingItem.category,
          unit: editingItem.unit,
          stock: editingItem.stock,
          minStock: editingItem.minStock,
        }),
      })

      if (response.ok) {
        await fetchItems() // Refresh items list
        setEditingItem(null)
        setIsEditDialogOpen(false)
      } else {
        console.error('Failed to update item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Inventaris</h1>
            <p className="text-muted-foreground">Kelola data barang dan stok inventaris</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Barang
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Barang Baru</DialogTitle>
                <DialogDescription>Masukkan informasi barang yang akan ditambahkan ke inventaris</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Barang</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
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
                  <Label htmlFor="unit">Satuan</Label>
                  <Input
                    id="unit"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="Unit, Rim, Kg, dll"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stok Awal</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minStock">Stok Minimum</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem({ ...newItem, minStock: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddItem}>Tambah Barang</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari barang..."
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Inventaris</CardTitle>
            <CardDescription>Total {filteredItems.length} barang dalam inventaris</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem({...item})
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)}>
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

        {/* Edit Item Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kelola Barang {editingItem?.name}</DialogTitle>
              <DialogDescription>Edit informasi barang inventaris</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nama Barang</Label>
                <Input
                  id="edit-name"
                  value={editingItem?.name || ""}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Kategori Barang</Label>
                <Select 
                  value={editingItem?.category || ""} 
                  onValueChange={(value) => editingItem && setEditingItem({ ...editingItem, category: value })}
                >
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
                <Label htmlFor="edit-unit">Satuan</Label>
                <Input
                  id="edit-unit"
                  value={editingItem?.unit || ""}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, unit: e.target.value })}
                  placeholder="Unit, Rim, Kg, dll"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">Stok Saat Ini</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={editingItem?.stock || 0}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, stock: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-minStock">Stok Minimum</Label>
                <Input
                  id="edit-minStock"
                  type="number"
                  value={editingItem?.minStock || 0}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, minStock: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEditItem}>Simpan Perubahan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
