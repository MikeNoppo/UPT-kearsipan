"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, CheckCircle, AlertCircle, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateReceptionDialog } from "./create-reception-dialog"
import { EditReceptionDialog } from "./edit-reception-dialog"
import { DeleteReceptionDialog } from "./delete-reception-dialog"
import { ReceptionActions } from "./reception-actions"

interface Reception {
  id: string
  requestId?: string
  itemName: string
  requestedQuantity: number
  receivedQuantity: number
  unit: string
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
  // Multi-item support
  items?: {
    id: string
    itemName: string
    requestedQuantity: number
    receivedQuantity: number
    unit: string
  }[]
  requestedBy?: {
    id: string
    name: string
    username: string
  }
  purchaseRequest?: {
    id: string
    requestNumber: string
    requestedBy: {
      id: string
      name: string
      username: string
    }
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

export function ReceptionClient() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  
  // State untuk data penerimaan dan statistik
  const [receptions, setReceptions] = useState<Reception[]>([])
  const [_inventory, setInventory] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<ReceptionStats>({
    totalReceptions: 0,
    completeReceptions: 0,
    partialReceptions: 0,
    differentReceptions: 0,
    completionRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // State untuk dialog edit dan delete
  const [editReception, setEditReception] = useState<Reception | null>(null)
  const [deleteReception, setDeleteReception] = useState<Reception | null>(null)

  // Mengambil data penerimaan dari API
  const fetchReceptions = useCallback(async () => {
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
  }, [toast])

  // Mengambil statistik penerimaan
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

  // Handler untuk refresh data setelah edit/delete
  const handleDataUpdate = () => {
    fetchReceptions()
    fetchStats()
  }

  // Handler untuk dialog state management
  const handleEditReception = (reception: Reception) => {
    setTimeout(() => {
      setEditReception(reception);
    }, 0);
  };

  const handleDeleteReception = (reception: Reception) => {
    setTimeout(() => {
      setDeleteReception(reception);
    }, 0);
  };

  const handleCloseEditDialog = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setEditReception(null);
      }, 100);
    }
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setDeleteReception(null);
      }, 100);
    }
  };

  // Mengambil daftar inventaris untuk pilihan item
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

  // Load data saat session tersedia
  useEffect(() => {
    if (session) {
      fetchReceptions()
      fetchStats()
      fetchInventory()
    }
  }, [session, fetchReceptions])

  // Cleanup dialog state saat component unmount
  useEffect(() => {
    return () => {
      setEditReception(null);
      setDeleteReception(null);
    };
  }, []);

  // Filter penerimaan berdasarkan pencarian
  const filteredReceptions = receptions.filter(
    (reception) =>
      reception.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reception.purchaseRequest?.requestNumber && reception.purchaseRequest.requestNumber.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Fungsi untuk menentukan badge status penerimaan
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Please sign in to access this page</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Penerimaan Barang</h1>
          <p className="text-muted-foreground">Catat barang yang diterima dan perbarui stok inventaris</p>
        </div>
        <CreateReceptionDialog 
          onReceptionCreated={handleDataUpdate}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penerimaan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.totalReceptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lengkap</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.completeReceptions}</div>
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
            <div className="text-xl font-bold">{stats.partialReceptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berbeda</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.differentReceptions}</div>
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
                <TableHead>Diminta Oleh</TableHead>
                <TableHead>Diterima Oleh</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceptions.map((reception) => (
                <TableRow key={reception.id}>
                  <TableCell className="font-medium">
                    {reception.purchaseRequest?.requestNumber ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {reception.purchaseRequest.requestNumber}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {reception.items && reception.items.length > 0 ? (
                          <>
                            {reception.items.length === 1 ? reception.items[0].itemName : `${reception.items.length} Barang`}
                            <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {reception.items.length > 1 && reception.items.map((i)=>i.itemName).join(', ')}
                            </div>
                          </>
                        ) : (
                          reception.itemName
                        )}
                      </div>
                      {reception.item && (!reception.items || reception.items.length === 0) && (
                        <div className="text-sm text-muted-foreground">
                          {reception.item.category} - Stock: {reception.item.stock}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {reception.requestedQuantity}{reception.unit ? ` ${reception.unit}` : ''}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {reception.receivedQuantity}{reception.unit ? ` ${reception.unit}` : ''}
                    </div>
                    {reception.requestedQuantity > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {Math.round((reception.receivedQuantity / reception.requestedQuantity) * 100)}% dari diminta
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {reception.purchaseRequest?.requestedBy ? (
                      <div>
                        <div className="font-medium">{reception.purchaseRequest.requestedBy.name}</div>
                        <div className="text-sm text-muted-foreground">@{reception.purchaseRequest.requestedBy.username}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{reception.receivedBy.name}</TableCell>
                  <TableCell>{new Date(reception.receiptDate).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>{getStatusBadge(reception.status)}</TableCell>
                  <TableCell>
                    <ReceptionActions
                      reception={reception}
                      onEdit={handleEditReception}
                      onDelete={handleDeleteReception}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Reception Dialog */}
      <EditReceptionDialog
        reception={editReception}
        open={!!editReception}
        onOpenChange={handleCloseEditDialog}
        onReceptionUpdated={handleDataUpdate}
      />

      {/* Delete Reception Dialog */}
      <DeleteReceptionDialog
        reception={deleteReception}
        open={!!deleteReception}
        onOpenChange={handleCloseDeleteDialog}
        onReceptionDeleted={handleDataUpdate}
      />
    </div>
  )
}
