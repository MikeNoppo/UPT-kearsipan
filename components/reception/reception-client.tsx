"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, CheckCircle, AlertCircle, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateReceptionDialog } from "./create-reception-dialog"

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

export function ReceptionClient() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  
  // State untuk data penerimaan dan statistik
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
  const [searchTerm, setSearchTerm] = useState("")

  // Mengambil data penerimaan dari API
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
  }, [session])

  // Filter penerimaan berdasarkan pencarian
  const filteredReceptions = receptions.filter(
    (reception) =>
      reception.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reception.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reception.requestId && reception.requestId.toLowerCase().includes(searchTerm.toLowerCase())),
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
          inventory={inventory}
          onReceptionCreated={() => {
            fetchReceptions()
            fetchStats()
          }}
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
  )
}
