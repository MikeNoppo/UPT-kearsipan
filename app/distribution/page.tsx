"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Search, 
  FileText, 
  Package,
  Filter,
  Calendar
} from "lucide-react"

/**
 * Distribution Page - Halaman distribusi/pengeluaran barang
 * 
 * Fungsi utama:
 * - Mengelola pengeluaran barang dari inventaris ke staff/department
 * - Mencatat siapa yang menerima barang dan untuk keperluan apa
 * - Generate nomor nota distribusi otomatis
 * - Update stok inventaris secara real-time saat distribusi
 * 
 * Fitur yang tersedia:
 * - Form distribusi dengan validasi stok
 * - Tracking penerima, department, dan tujuan penggunaan
 * - Sistem nomor nota otomatis untuk audit trail
 * - Filter berdasarkan department dan tanggal
 * - Statistik distribusi per department dan item
 * - Pagination untuk handling data besar
 * 
 * Data yang dicatat:
 * - Nomor nota distribusi
 * - Nama staff penerima dan department
 * - Barang yang didistribusikan dan jumlahnya
 * - Tanggal distribusi dan tujuan penggunaan
 * - Catatan tambahan jika diperlukan
 * 
 * Kontrol yang tersedia:
 * - Edit dan delete distribusi (untuk koreksi)
 * - Search dan filter advanced
 * - Export data untuk reporting
 */

interface DistributionItem {
  id: string
  itemName: string
  quantity: number
  unit: string
  itemId?: string
  item?: {
    id: string
    name: string
    category: string
    stock: number
  }
}

interface Distribution {
  id: string
  noteNumber: string
  staffName: string
  department: string
  distributionDate: string
  purpose: string
  createdAt: string
  distributedBy: {
    id: string
    name: string
    username: string
  }
  items: DistributionItem[]
}

interface DistributionStats {
  totalDistributions: number
  recentDistributions: number
  totalQuantityDistributed: number
  departmentStats: Array<{
    department: string
    count: number
    totalQuantity: number
  }>
  topDistributedItems: Array<{
    itemName: string
    count: number
    totalQuantity: number
  }>
}

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  stock: number
}

export default function DistributionPage() {
  const { data: session, status } = useSession()
  // State untuk data distribusi dan statistik
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [distributionStats, setDistributionStats] = useState<DistributionStats | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDistribution, setEditingDistribution] = useState<Distribution | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()
  const { toast } = useToast()

  // Data form untuk distribusi baru
  const [newDistribution, setNewDistribution] = useState({
    staffName: "",
    department: "",
    distributionDate: new Date().toISOString().split('T')[0],
    purpose: "",
    items: [] as Array<{
      itemName: string
      quantity: number
      unit: string
      itemId?: string
    }>,
  })

  // State untuk item yang sedang ditambahkan
  const [currentItem, setCurrentItem] = useState({
    itemName: "",
    quantity: 1,
    unit: "",
    itemId: "",
  })

  // State untuk editing item dalam edit dialog
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editingItemData, setEditingItemData] = useState({
    itemName: "",
    quantity: 1,
    unit: "",
    itemId: "",
  })

  // Mengambil data distribusi dengan filter dan pagination
  const fetchDistributions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(departmentFilter && departmentFilter !== "all" && { department: departmentFilter }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
      })

      const response = await fetch(`/api/distribution?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch distributions")
      }
      const data = await response.json()
      setDistributions(data.distributions)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch distributions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, departmentFilter, dateRange, toast])

  // Mengambil statistik distribusi
  const fetchDistributionStats = useCallback(async () => {
    try {
      const response = await fetch("/api/distribution/stats?period=month")
      if (!response.ok) {
        throw new Error("Failed to fetch distribution statistics")
      }
      const data = await response.json()
      setDistributionStats(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch distribution statistics",
        variant: "destructive",
      })
    }
  }, [toast])

  const fetchInventoryItems = useCallback(async () => {
    try {
      const response = await fetch("/api/inventory")
      if (!response.ok) {
        throw new Error("Failed to fetch inventory items")
      }
      const data = await response.json()
      setInventoryItems(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch inventory items",
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

    fetchDistributions()
    fetchDistributionStats()
    fetchInventoryItems()
  }, [session, status, router])

  const handleAddDistribution = async () => {
    if (!newDistribution.staffName || !newDistribution.department || 
        !newDistribution.purpose || newDistribution.items.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one item",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/distribution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newDistribution,
          distributionDate: new Date(newDistribution.distributionDate).toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create distribution")
      }

      const createdDistribution = await response.json()
      setDistributions([createdDistribution, ...distributions])
      
      // Reset form
      setNewDistribution({
        staffName: "",
        department: "",
        distributionDate: new Date().toISOString().split('T')[0],
        purpose: "",
        items: [],
      })
      setCurrentItem({
        itemName: "",
        quantity: 1,
        unit: "",
        itemId: "",
      })
      setIsAddDialogOpen(false)
      await fetchDistributionStats()
      
      toast({
        title: "Success",
        description: "Distribution created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create distribution",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditDistribution = async () => {
    if (!editingDistribution) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/distribution/${editingDistribution.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteNumber: editingDistribution.noteNumber,
          staffName: editingDistribution.staffName,
          department: editingDistribution.department,
          distributionDate: new Date(editingDistribution.distributionDate).toISOString(),
          purpose: editingDistribution.purpose,
          items: editingDistribution.items.map((item: any) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            itemId: item.itemId || null,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update distribution")
      }

      const updatedDistribution = await response.json()
      setDistributions(distributions.map((dist) => 
        dist.id === updatedDistribution.id ? updatedDistribution : dist
      ))
      setEditingDistribution(null)
      setEditingItemIndex(null)
      setEditingItemData({
        itemName: "",
        quantity: 1,
        unit: "",
        itemId: "",
      })
      await fetchDistributionStats()
      
      toast({
        title: "Success",
        description: "Distribution updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update distribution",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDistribution = async (id: string) => {
    if (!confirm("Are you sure you want to delete this distribution? This will restore the items to inventory.")) {
      return
    }

    try {
      const response = await fetch(`/api/distribution/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete distribution")
      }

      setDistributions(distributions.filter((dist) => dist.id !== id))
      await fetchDistributionStats()
      
      toast({
        title: "Success",
        description: "Distribution deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete distribution",
        variant: "destructive",
      })
    }
  }

  const handleItemSelection = (itemId: string) => {
    const selectedItem = inventoryItems.find(item => item.id === itemId)
    if (selectedItem) {
      setCurrentItem(prev => ({
        ...prev,
        itemId,
        itemName: selectedItem.name,
        unit: selectedItem.unit,
      }))
    }
  }

  const handleAddItem = () => {
    if (!currentItem.itemName || !currentItem.unit || currentItem.quantity < 1) {
      toast({
        title: "Error",
        description: "Please fill in all item fields",
        variant: "destructive",
      })
      return
    }

    setNewDistribution(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem }]
    }))

    // Reset current item
    setCurrentItem({
      itemName: "",
      quantity: 1,
      unit: "",
      itemId: "",
    })
  }

  const handleRemoveItem = (index: number) => {
    setNewDistribution(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  // Edit dialog item functions
  const handleEditItem = (index: number) => {
    const item = editingDistribution?.items[index]
    if (item) {
      setEditingItemIndex(index)
      setEditingItemData({
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        itemId: item.itemId || "",
      })
    }
  }

  const handleSaveEditingItem = () => {
    if (editingDistribution && editingItemIndex !== null) {
      const updatedItems = [...editingDistribution.items]
      updatedItems[editingItemIndex] = {
        ...updatedItems[editingItemIndex],
        itemName: editingItemData.itemName,
        quantity: editingItemData.quantity,
        unit: editingItemData.unit,
        itemId: editingItemData.itemId || undefined,
      }
      
      setEditingDistribution({
        ...editingDistribution,
        items: updatedItems
      })
      
      setEditingItemIndex(null)
      setEditingItemData({
        itemName: "",
        quantity: 1,
        unit: "",
        itemId: "",
      })
    }
  }

  const handleCancelEditingItem = () => {
    setEditingItemIndex(null)
    setEditingItemData({
      itemName: "",
      quantity: 1,
      unit: "",
      itemId: "",
    })
  }

  const handleRemoveEditingItem = (index: number) => {
    if (editingDistribution) {
      const updatedItems = editingDistribution.items.filter((_, i) => i !== index)
      setEditingDistribution({
        ...editingDistribution,
        items: updatedItems
      })
    }
  }

  const handleAddNewItemToEdit = () => {
    if (editingDistribution && editingItemData.itemName && editingItemData.unit) {
      setEditingDistribution({
        ...editingDistribution,
        items: [...editingDistribution.items, {
          id: Date.now().toString(), // Temporary ID for new items
          itemName: editingItemData.itemName,
          quantity: editingItemData.quantity,
          unit: editingItemData.unit,
          itemId: editingItemData.itemId || undefined,
        }]
      })
      
      setEditingItemData({
        itemName: "",
        quantity: 1,
        unit: "",
        itemId: "",
      })
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchDistributions()
  }

  const resetFilters = () => {
    setSearchTerm("")
    setDepartmentFilter("all")
    setDateRange({ start: "", end: "" })
    setCurrentPage(1)
  }

  const departments = [...new Set(distributions.map(d => d.department))].filter(Boolean)

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
            <h1 className="text-3xl font-bold tracking-tight">Distribusi Barang</h1>
            <p className="text-muted-foreground">Kelola distribusi barang inventaris</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Distribusi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Distribusi Baru</DialogTitle>
                <DialogDescription>Buat catatan distribusi barang baru</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Basic Distribution Info */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="distributionDate">Tanggal Distribusi *</Label>
                    <Input
                      id="distributionDate"
                      type="date"
                      value={newDistribution.distributionDate}
                      onChange={(e) => setNewDistribution({ ...newDistribution, distributionDate: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="staffName">Nama Staff Penerima *</Label>
                    <Input
                      id="staffName"
                      value={newDistribution.staffName}
                      onChange={(e) => setNewDistribution({ ...newDistribution, staffName: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Departemen *</Label>
                    <Input
                      id="department"
                      value={newDistribution.department}
                      onChange={(e) => setNewDistribution({ ...newDistribution, department: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="purpose">Tujuan Penggunaan *</Label>
                  <Textarea
                    id="purpose"
                    value={newDistribution.purpose}
                    onChange={(e) => setNewDistribution({ ...newDistribution, purpose: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="Describe the purpose of this distribution"
                  />
                </div>

                {/* Add Items Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Tambah Barang</h3>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Pilih dari Inventaris (Opsional)</Label>
                      <Select
                        value={currentItem.itemId}
                        onValueChange={handleItemSelection}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih barang dari inventaris..." />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.category} (Stok: {item.stock} {item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="currentItemName">Nama Barang *</Label>
                        <Input
                          id="currentItemName"
                          value={currentItem.itemName}
                          onChange={(e) => setCurrentItem({ ...currentItem, itemName: e.target.value })}
                          disabled={isSubmitting}
                          placeholder="Nama barang"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="currentUnit">Satuan *</Label>
                        <Input
                          id="currentUnit"
                          value={currentItem.unit}
                          onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                          disabled={isSubmitting}
                          placeholder="pcs, box, dll"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="currentQuantity">Jumlah *</Label>
                        <Input
                          id="currentQuantity"
                          type="number"
                          min="1"
                          value={currentItem.quantity}
                          onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddItem}
                      disabled={isSubmitting}
                      className="w-fit"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Barang
                    </Button>
                  </div>
                </div>

                {/* Items List */}
                {newDistribution.items.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Daftar Barang ({newDistribution.items.length})</h3>
                    <div className="space-y-2">
                      {newDistribution.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{item.itemName}</span>
                            <span className="text-muted-foreground ml-2">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleAddDistribution} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Tambah Distribusi"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distribusi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{distributionStats?.totalDistributions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distribusi Bulan Ini</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{distributionStats?.recentDistributions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Barang Terdistribusi</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{distributionStats?.totalQuantityDistributed || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Distribusi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Pencarian</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Cari nomor nota, barang, staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline" size="icon" onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Departemen</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua departemen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua departemen</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
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

        {/* Distributions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Distribusi</CardTitle>
            <CardDescription>Kelola semua catatan distribusi barang</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Nota</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Staff Penerima</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Didistribusi Oleh</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions.map((distribution) => (
                  <TableRow key={distribution.id}>
                    <TableCell className="font-medium">{distribution.noteNumber}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {distribution.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.itemName} ({item.quantity} {item.unit})
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{distribution.staffName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{distribution.department}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(distribution.distributionDate).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>{distribution.distributedBy.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingDistribution({ ...distribution })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {session?.user.role === "ADMINISTRATOR" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDistribution(distribution.id)}
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
        <Dialog open={!!editingDistribution} onOpenChange={() => setEditingDistribution(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Distribusi</DialogTitle>
              <DialogDescription>Ubah informasi distribusi barang (catatan: item tidak dapat diubah)</DialogDescription>
            </DialogHeader>
            {editingDistribution && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-noteNumber">Nomor Nota</Label>
                    <Input
                      id="edit-noteNumber"
                      value={editingDistribution.noteNumber}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, noteNumber: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-distributionDate">Tanggal Distribusi</Label>
                    <Input
                      id="edit-distributionDate"
                      type="date"
                      value={editingDistribution.distributionDate.split('T')[0]}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, distributionDate: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-staffName">Nama Staff Penerima</Label>
                    <Input
                      id="edit-staffName"
                      value={editingDistribution.staffName}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, staffName: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-department">Departemen</Label>
                    <Input
                      id="edit-department"
                      value={editingDistribution.department}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, department: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-purpose">Tujuan Penggunaan</Label>
                  <Textarea
                    id="edit-purpose"
                    value={editingDistribution.purpose}
                    onChange={(e) => setEditingDistribution({ ...editingDistribution, purpose: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Editable items section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">Barang yang Didistribusikan</Label>
                    <span className="text-sm text-muted-foreground">
                      {editingDistribution.items.length} item(s)
                    </span>
                  </div>
                  
                  {/* Items list */}
                  <div className="space-y-3">
                    {editingDistribution.items.map((item, index) => (
                      <div key={index} className="border rounded-lg">
                        {editingItemIndex === index ? (
                          /* Editing mode */
                          <div className="p-4 space-y-3">
                            <div className="grid gap-2">
                              <Label>Pilih dari Inventaris (Opsional)</Label>
                              <Select
                                value={editingItemData.itemId}
                                onValueChange={(value) => {
                                  const selectedItem = inventoryItems.find(item => item.id === value)
                                  if (selectedItem) {
                                    setEditingItemData({
                                      ...editingItemData,
                                      itemId: value,
                                      itemName: selectedItem.name,
                                      unit: selectedItem.unit,
                                    })
                                  } else {
                                    setEditingItemData({
                                      ...editingItemData,
                                      itemId: value,
                                    })
                                  }
                                }}
                                disabled={isSubmitting}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih barang dari inventaris..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {inventoryItems.map((inventoryItem) => (
                                    <SelectItem key={inventoryItem.id} value={inventoryItem.id}>
                                      {inventoryItem.name} - {inventoryItem.category} (Stok: {inventoryItem.stock} {inventoryItem.unit})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div className="grid gap-2">
                                <Label>Nama Barang</Label>
                                <Input
                                  value={editingItemData.itemName}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, itemName: e.target.value })}
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Satuan</Label>
                                <Input
                                  value={editingItemData.unit}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, unit: e.target.value })}
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Jumlah</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={editingItemData.quantity}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, quantity: parseInt(e.target.value) || 1 })}
                                  disabled={isSubmitting}
                                />
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveEditingItem}
                                disabled={!editingItemData.itemName || !editingItemData.unit}
                              >
                                Simpan
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEditingItem}
                              >
                                Batal
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Display mode */
                          <div className="p-3 flex items-center justify-between">
                            <div>
                              <span className="font-medium">{item.itemName}</span>
                              <span className="text-muted-foreground ml-2">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditItem(index)}
                                disabled={isSubmitting}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveEditingItem(index)}
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add new item section - Only show when not editing any item */}
                  {editingItemIndex === null && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                      <Label className="text-sm font-medium mb-3 block">Tambah Item Baru</Label>
                      
                      <div className="space-y-3">
                        <div className="grid gap-2">
                          <Select
                            value={editingItemData.itemId}
                            onValueChange={(value) => {
                              const selectedItem = inventoryItems.find(item => item.id === value)
                              if (selectedItem) {
                                setEditingItemData({
                                  ...editingItemData,
                                  itemId: value,
                                  itemName: selectedItem.name,
                                  unit: selectedItem.unit,
                                })
                              } else {
                                setEditingItemData({
                                  ...editingItemData,
                                  itemId: value,
                                })
                              }
                            }}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih barang dari inventaris..." />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryItems.map((inventoryItem) => (
                                <SelectItem key={inventoryItem.id} value={inventoryItem.id}>
                                  {inventoryItem.name} - {inventoryItem.category} (Stok: {inventoryItem.stock} {inventoryItem.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            placeholder="Nama barang"
                            value={editingItemData.itemName}
                            onChange={(e) => setEditingItemData({ ...editingItemData, itemName: e.target.value })}
                            disabled={isSubmitting}
                          />
                          <Input
                            placeholder="Satuan"
                            value={editingItemData.unit}
                            onChange={(e) => setEditingItemData({ ...editingItemData, unit: e.target.value })}
                            disabled={isSubmitting}
                          />
                          <Input
                            type="number"
                            placeholder="Jumlah"
                            min="1"
                            value={editingItemData.quantity}
                            onChange={(e) => setEditingItemData({ ...editingItemData, quantity: parseInt(e.target.value) || 1 })}
                            disabled={isSubmitting}
                          />
                        </div>
                        
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddNewItemToEdit}
                          disabled={!editingItemData.itemName || !editingItemData.unit || isSubmitting}
                          className="w-fit"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Item
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditDistribution} disabled={isSubmitting}>
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