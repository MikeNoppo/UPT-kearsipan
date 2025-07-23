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
import { Plus, TrendingDown, User, Package, Search, AlertTriangle } from "lucide-react"

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
  distributedBy: string
  notes: string
}

interface InventoryItem {
  id: string
  name: string
  stock: number
  unit: string
  minStock: number
}

export default function DistributionPage() {
  const [distributions, setDistributions] = useState<Distribution[]>([
    {
      id: "1",
      noteNumber: "NPB001",
      itemName: "Kertas HVS A4",
      quantity: 2,
      unit: "Rim",
      staffName: "Budi Santoso",
      department: "Administrasi",
      distributionDate: "2024-01-15",
      purpose: "Kebutuhan operasional harian",
      distributedBy: "Staff Tata Usaha",
      notes: "Pengambilan rutin",
    },
    {
      id: "2",
      noteNumber: "NPB002",
      itemName: "Tinta Printer Canon",
      quantity: 1,
      unit: "Unit",
      staffName: "Sari Dewi",
      department: "Kearsipan",
      distributionDate: "2024-01-14",
      purpose: "Printer rusak, perlu ganti tinta",
      distributedBy: "Staff Tata Usaha",
      notes: "Urgent",
    },
  ])

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: "1", name: "Kertas HVS A4", stock: 23, unit: "Rim", minStock: 10 },
    { id: "2", name: "Tinta Printer Canon", stock: 7, unit: "Unit", minStock: 5 },
    { id: "3", name: "Stapler Besar", stock: 8, unit: "Unit", minStock: 3 },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const [newDistribution, setNewDistribution] = useState({
    noteNumber: "",
    itemName: "",
    quantity: 0,
    unit: "",
    staffName: "",
    department: "",
    distributionDate: "",
    purpose: "",
    notes: "",
  })

  const filteredDistributions = distributions.filter(
    (distribution) =>
      distribution.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distribution.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distribution.noteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distribution.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const availableItems = inventory.filter((item) => item.stock > 0)

  const handleAddDistribution = () => {
    const distribution: Distribution = {
      id: Date.now().toString(),
      ...newDistribution,
      distributedBy: "Staff Tata Usaha", // In real app, get from current user
    }

    setDistributions([...distributions, distribution])

    // Update inventory stock
    setInventory(
      inventory.map((item) =>
        item.name === newDistribution.itemName
          ? { ...item, stock: Math.max(0, item.stock - newDistribution.quantity) }
          : item,
      ),
    )

    setNewDistribution({
      noteNumber: "",
      itemName: "",
      quantity: 0,
      unit: "",
      staffName: "",
      department: "",
      distributionDate: "",
      purpose: "",
      notes: "",
    })
    setIsAddDialogOpen(false)
  }

  const handleItemSelect = (itemName: string) => {
    const selectedItem = inventory.find((item) => item.name === itemName)
    if (selectedItem) {
      setNewDistribution({
        ...newDistribution,
        itemName,
        unit: selectedItem.unit,
      })
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock === 0) {
      return <Badge variant="destructive">Habis</Badge>
    } else if (item.stock <= item.minStock) {
      return <Badge variant="secondary">Rendah</Badge>
    }
    return <Badge variant="default">Normal</Badge>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Distribusi Barang</h1>
            <p className="text-muted-foreground">Catat pengambilan barang oleh staf berdasarkan nota pengambilan</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Catat Distribusi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Catat Distribusi Barang</DialogTitle>
                <DialogDescription>
                  Masukkan detail pengambilan barang berdasarkan nota pengambilan barang.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="noteNumber">Nomor Nota Pengambilan</Label>
                    <Input
                      id="noteNumber"
                      value={newDistribution.noteNumber}
                      onChange={(e) => setNewDistribution({ ...newDistribution, noteNumber: e.target.value })}
                      placeholder="NPB001"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="distributionDate">Tanggal Distribusi</Label>
                    <Input
                      id="distributionDate"
                      type="date"
                      value={newDistribution.distributionDate}
                      onChange={(e) => setNewDistribution({ ...newDistribution, distributionDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Nama Barang</Label>
                  <Select value={newDistribution.itemName} onValueChange={handleItemSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih barang yang tersedia" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems.map((item) => (
                        <SelectItem key={item.id} value={item.name}>
                          {item.name} (Stok: {item.stock} {item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Jumlah Diambil</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newDistribution.quantity}
                      onChange={(e) =>
                        setNewDistribution({
                          ...newDistribution,
                          quantity: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Satuan</Label>
                    <Input id="unit" value={newDistribution.unit} disabled />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="staffName">Nama Staf Pengambil</Label>
                    <Input
                      id="staffName"
                      value={newDistribution.staffName}
                      onChange={(e) => setNewDistribution({ ...newDistribution, staffName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Bagian/Unit</Label>
                    <Input
                      id="department"
                      value={newDistribution.department}
                      onChange={(e) => setNewDistribution({ ...newDistribution, department: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purpose">Tujuan Penggunaan</Label>
                  <Textarea
                    id="purpose"
                    value={newDistribution.purpose}
                    onChange={(e) => setNewDistribution({ ...newDistribution, purpose: e.target.value })}
                    placeholder="Jelaskan tujuan penggunaan barang"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={newDistribution.notes}
                    onChange={(e) => setNewDistribution({ ...newDistribution, notes: e.target.value })}
                    placeholder="Catatan tambahan"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddDistribution}>Simpan Distribusi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distribusi</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{distributions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {distributions.filter((d) => new Date(d.distributionDate).getMonth() === new Date().getMonth()).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staf Aktif</CardTitle>
              <User className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(distributions.map((d) => d.staffName)).size}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.filter((item) => item.stock <= item.minStock).length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari distribusi barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Distribusi</CardTitle>
              <CardDescription>Catatan pengambilan barang oleh staf</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nota</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Staf</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDistributions.slice(0, 5).map((distribution) => (
                    <TableRow key={distribution.id}>
                      <TableCell className="font-medium">{distribution.noteNumber}</TableCell>
                      <TableCell>{distribution.itemName}</TableCell>
                      <TableCell>
                        {distribution.quantity} {distribution.unit}
                      </TableCell>
                      <TableCell>{distribution.staffName}</TableCell>
                      <TableCell>{new Date(distribution.distributionDate).toLocaleDateString("id-ID")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Stok Inventaris</CardTitle>
              <CardDescription>Monitoring stok barang yang tersedia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Stok: {item.stock} {item.unit} | Min: {item.minStock} {item.unit}
                      </p>
                    </div>
                    {getStockStatus(item)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
