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

interface Distribution {
  id: string
  noteNumber: string
  itemName: string
  quantity: number
  unit: string
  staffName: string
  department: string
  distributionDate: string
  purpose: string
  notes?: string
  createdAt: string
  distributedBy: {
    id: string
    name: string
    username: string
  }
  item?: {
    id: string
    name: string
    category: string
    stock: number
  }
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

  const [newDistribution, setNewDistribution] = useState({
    itemName: "",
    quantity: 1,
    unit: "",
    staffName: "",
    department: "",
    distributionDate: new Date().toISOString().split('T')[0],
    purpose: "",
    notes: "",
    itemId: "",
  })

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
  }, [session, status, router, fetchDistributions, fetchDistributionStats, fetchInventoryItems])

  const handleAddDistribution = async () => {
    if (!newDistribution.itemName || !newDistribution.staffName || 
        !newDistribution.department || !newDistribution.purpose) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
        itemName: "",
        quantity: 1,
        unit: "",
        staffName: "",
        department: "",
        distributionDate: new Date().toISOString().split('T')[0],
        purpose: "",
        notes: "",
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteNumber: editingDistribution.noteNumber,
          itemName: editingDistribution.itemName,
          quantity: editingDistribution.quantity,
          unit: editingDistribution.unit,
          staffName: editingDistribution.staffName,
          department: editingDistribution.department,
          distributionDate: new Date(editingDistribution.distributionDate).toISOString(),
          purpose: editingDistribution.purpose,
          notes: editingDistribution.notes,
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
      setNewDistribution(prev => ({
        ...prev,
        itemId,
        itemName: selectedItem.name,
        unit: selectedItem.unit,
      }))
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Distribusi Baru</DialogTitle>
                <DialogDescription>Buat catatan distribusi barang baru</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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

                <div className="grid gap-2">
                  <Label>Pilih dari Inventaris (Opsional)</Label>
                  <Select
                    value={newDistribution.itemId}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="itemName">Nama Barang *</Label>
                    <Input
                      id="itemName"
                      value={newDistribution.itemName}
                      onChange={(e) => setNewDistribution({ ...newDistribution, itemName: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Satuan *</Label>
                    <Input
                      id="unit"
                      value={newDistribution.unit}
                      onChange={(e) => setNewDistribution({ ...newDistribution, unit: e.target.value })}
                      disabled={isSubmitting}
                      placeholder="pcs, box, dll"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quantity">Jumlah *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newDistribution.quantity}
                    onChange={(e) => setNewDistribution({ ...newDistribution, quantity: parseInt(e.target.value) || 1 })}
                    disabled={isSubmitting}
                  />
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

                <div className="grid gap-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={newDistribution.notes}
                    onChange={(e) => setNewDistribution({ ...newDistribution, notes: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="Additional notes..."
                  />
                </div>
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
                  <TableHead>Jumlah</TableHead>
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
                    <TableCell>{distribution.itemName}</TableCell>
                    <TableCell>{distribution.quantity} {distribution.unit}</TableCell>
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
              <DialogDescription>Ubah informasi distribusi barang</DialogDescription>
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
                    <Label htmlFor="edit-itemName">Nama Barang</Label>
                    <Input
                      id="edit-itemName"
                      value={editingDistribution.itemName}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, itemName: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-unit">Satuan</Label>
                    <Input
                      id="edit-unit"
                      value={editingDistribution.unit}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, unit: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-quantity">Jumlah</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    value={editingDistribution.quantity}
                    onChange={(e) => setEditingDistribution({ ...editingDistribution, quantity: parseInt(e.target.value) || 1 })}
                    disabled={isSubmitting}
                  />
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

                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Catatan</Label>
                  <Textarea
                    id="edit-notes"
                    value={editingDistribution.notes || ""}
                    onChange={(e) => setEditingDistribution({ ...editingDistribution, notes: e.target.value })}
                    disabled={isSubmitting}
                  />
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