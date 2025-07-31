"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DistributionFilter } from "@/components/distribution/distribution-filter"
import { DistributionsTable } from "@/components/distribution/distributions-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AddDistributionDialog } from "@/components/distribution/add-distribution-dialog"
import { EditDistributionDialog } from "@/components/distribution/edit-distribution-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  FileText, 
  Package,
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
          <AddDistributionDialog
            isOpen={isAddDialogOpen}
            setIsOpen={setIsAddDialogOpen}
            newDistribution={newDistribution}
            setNewDistribution={setNewDistribution}
            currentItem={currentItem}
            setCurrentItem={setCurrentItem}
            inventoryItems={inventoryItems}
            handleItemSelection={handleItemSelection}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
            handleAddDistribution={handleAddDistribution}
            isSubmitting={isSubmitting}
          />
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
        <DistributionFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          departments={departments}
          handleSearch={handleSearch}
          resetFilters={resetFilters}
        />

        {/* Distributions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Distribusi</CardTitle>
            <CardDescription>Kelola semua catatan distribusi barang</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionsTable
              distributions={distributions}
              session={session}
              setEditingDistribution={setEditingDistribution}
              handleDeleteDistribution={handleDeleteDistribution}
            />
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
        <EditDistributionDialog
          open={!!editingDistribution}
          setOpen={(open) => setEditingDistribution(open ? editingDistribution : null)}
          editingDistribution={editingDistribution}
          setEditingDistribution={setEditingDistribution}
          editingItemIndex={editingItemIndex}
          setEditingItemIndex={setEditingItemIndex}
          editingItemData={editingItemData}
          setEditingItemData={setEditingItemData}
          inventoryItems={inventoryItems}
          isSubmitting={isSubmitting}
          handleEditDistribution={handleEditDistribution}
          handleEditItem={handleEditItem}
          handleSaveEditingItem={handleSaveEditingItem}
          handleCancelEditingItem={handleCancelEditingItem}
          handleRemoveEditingItem={handleRemoveEditingItem}
          handleAddNewItemToEdit={handleAddNewItemToEdit}
        />
      </div>
    </DashboardLayout>
  )
}