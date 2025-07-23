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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Package, CheckCircle, AlertCircle, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Reception {
  id: string
  requestId?: string
  itemName: string
  requestedQuantity: number
  receivedQuantity: number
  unit: string
  supplier: string
  receiptDate: string
  status: "COMPLETE" | "PARTIAL" | "DIFFERENT"
  notes?: string
  createdAt: string
  updatedAt: string
  receivedBy: {
    id: string
    name: string
    username: string
  }
  item?: {
    id: string
    name: string
    category: string
    stock: number
    unit: string
  }
}

interface ReceptionStats {
  totalReceptions: number
  completeReceptions: number
  partialReceptions: number
  differentReceptions: number
  completionRate: number
}

interface InventoryItem {
  id: string
  name: string
  stock: number
  unit: string
}

export default function ReceptionPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [receptions, setReceptions] = useState<Reception[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<ReceptionStats>({
    totalReceptions: 0,
    completeReceptions: 0,
    partialReceptions: 0,
    differentReceptions: 0,
    completionRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const [newReception, setNewReception] = useState({
    requestId: "",
    itemName: "",
    requestedQuantity: 0,
    receivedQuantity: 0,
    unit: "",
    supplier: "",
    receiptDate: "",
    notes: "",
    status: "COMPLETE" as "COMPLETE" | "PARTIAL" | "DIFFERENT",
    itemId: "",
  })

  // Fetch receptions from API
  const fetchReceptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reception')
      
      if (!response.ok) {
        throw new Error('Failed to fetch receptions')
      }

      const data = await response.json()
      setReceptions(data.receptions || [])
    } catch (error) {
      console.error('Error fetching receptions:', error)
      toast({
        title: "Error",
        description: "Failed to load receptions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reception/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const data = await response.json()
      setStats({
        totalReceptions: data.totalReceptions,
        completeReceptions: data.completeReceptions,
        partialReceptions: data.partialReceptions,
        differentReceptions: data.differentReceptions,
        completionRate: data.completionRate,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Fetch inventory items for selection
  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }

      const data = await response.json()
      setInventory(data.items || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  useEffect(() => {
    if (session) {
      fetchReceptions()
      fetchStats()
      fetchInventory()
    }
  }, [session])

  const filteredReceptions = receptions.filter(
    (reception) =>
      reception.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reception.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reception.requestId && reception.requestId.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETE":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Lengkap
          </Badge>
        )
      case "PARTIAL":
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            Sebagian
          </Badge>
        )
      case "DIFFERENT":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Berbeda
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleAddReception = async () => {
    if (!newReception.itemName || !newReception.supplier || !newReception.receiptDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      
      // Prepare the data
      const receptionData = {
        ...newReception,
        receiptDate: new Date(newReception.receiptDate).toISOString(),
        itemId: newReception.itemId || undefined,
      }

      const response = await fetch('/api/reception', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receptionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create reception')
      }

      const createdReception = await response.json()
      setReceptions([createdReception, ...receptions])
      
      // Refresh stats
      fetchStats()
      
      setNewReception({
        requestId: "",
        itemName: "",
        requestedQuantity: 0,
        receivedQuantity: 0,
        unit: "",
        supplier: "",
        receiptDate: "",
        notes: "",
        status: "COMPLETE",
        itemId: "",
      })
      setIsAddDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Reception recorded successfully",
      })
    } catch (error) {
      console.error('Error creating reception:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create reception',
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleInventoryItemSelect = (itemId: string) => {
    const selectedItem = inventory.find(item => item.id === itemId)
    if (selectedItem) {
      setNewReception(prev => ({
        ...prev,
        itemId: itemId,
        itemName: selectedItem.name,
        unit: selectedItem.unit,
      }))
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Please sign in to access this page</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Penerimaan Barang</h1>
            <p className="text-muted-foreground">Catat barang yang diterima dan perbarui stok inventaris</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Catat Penerimaan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Catat Penerimaan Barang</DialogTitle>
                <DialogDescription>
                  Masukkan detail barang yang diterima. Stok akan otomatis diperbarui jika barang terhubung dengan inventaris.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="requestId">ID Permintaan (Opsional)</Label>
                    <Input
                      id="requestId"
                      value={newReception.requestId}
                      onChange={(e) => setNewReception({ ...newReception, requestId: e.target.value })}
                      placeholder="REQ001"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="receiptDate">Tanggal Terima *</Label>
                    <Input
                      id="receiptDate"
                      type="date"
                      value={newReception.receiptDate}
                      onChange={(e) => setNewReception({ ...newReception, receiptDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="inventoryItem">Pilih dari Inventaris (Opsional)</Label>
                  <Select onValueChange={handleInventoryItemSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih barang dari inventaris" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - Stok: {item.stock} {item.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="itemName">Nama Barang *</Label>
                  <Input
                    id="itemName"
                    value={newReception.itemName}
                    onChange={(e) => setNewReception({ ...newReception, itemName: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="requestedQuantity">Jumlah Diminta</Label>
                    <Input
                      id="requestedQuantity"
                      type="number"
                      value={newReception.requestedQuantity}
                      onChange={(e) =>
                        setNewReception({
                          ...newReception,
                          requestedQuantity: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="receivedQuantity">Jumlah Diterima *</Label>
                    <Input
                      id="receivedQuantity"
                      type="number"
                      value={newReception.receivedQuantity}
                      onChange={(e) =>
                        setNewReception({
                          ...newReception,
                          receivedQuantity: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Satuan *</Label>
                    <Input
                      id="unit"
                      value={newReception.unit}
                      onChange={(e) => setNewReception({ ...newReception, unit: e.target.value })}
                      placeholder="Unit, Rim, Kg"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={newReception.status} 
                      onValueChange={(value: "COMPLETE" | "PARTIAL" | "DIFFERENT") => 
                        setNewReception({ ...newReception, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPLETE">Lengkap</SelectItem>
                        <SelectItem value="PARTIAL">Sebagian</SelectItem>
                        <SelectItem value="DIFFERENT">Berbeda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Input
                    id="supplier"
                    value={newReception.supplier}
                    onChange={(e) => setNewReception({ ...newReception, supplier: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={newReception.notes}
                    onChange={(e) => setNewReception({ ...newReception, notes: e.target.value })}
                    placeholder="Catatan tambahan tentang penerimaan barang"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddReception} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Penerimaan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Penerimaan</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReceptions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lengkap</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completeReceptions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sebagian</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.partialReceptions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Berbeda</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.differentReceptions}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari penerimaan barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Penerimaan Barang</CardTitle>
            <CardDescription>Catatan semua barang yang telah diterima</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Permintaan</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Diminta</TableHead>
                  <TableHead>Diterima</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Diterima Oleh</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceptions.map((reception) => (
                  <TableRow key={reception.id}>
                    <TableCell className="font-medium">{reception.requestId || "-"}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reception.itemName}</div>
                        {reception.item && (
                          <div className="text-sm text-muted-foreground">
                            {reception.item.category} - Stock: {reception.item.stock}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reception.requestedQuantity} {reception.unit}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {reception.receivedQuantity} {reception.unit}
                      </div>
                      {reception.requestedQuantity > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {Math.round((reception.receivedQuantity / reception.requestedQuantity) * 100)}% dari diminta
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{reception.supplier}</TableCell>
                    <TableCell>{reception.receivedBy.name}</TableCell>
                    <TableCell>{new Date(reception.receiptDate).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{getStatusBadge(reception.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
