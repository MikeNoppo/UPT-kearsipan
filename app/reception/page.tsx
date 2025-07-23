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
import { Badge } from "@/components/ui/badge"
import { Plus, Package, CheckCircle, AlertCircle, Search } from "lucide-react"

interface Reception {
  id: string
  requestId?: string
  itemName: string
  requestedQuantity: number
  receivedQuantity: number
  unit: string
  supplier: string
  receiptDate: string
  receivedBy: string
  notes: string
  status: "complete" | "partial" | "different"
}

interface InventoryItem {
  id: string
  name: string
  stock: number
  unit: string
}

export default function ReceptionPage() {
  const [receptions, setReceptions] = useState<Reception[]>([
    {
      id: "1",
      requestId: "REQ001",
      itemName: "Kertas HVS A4",
      requestedQuantity: 10,
      receivedQuantity: 10,
      unit: "Rim",
      supplier: "PT Sinar Dunia",
      receiptDate: "2024-01-15",
      receivedBy: "Staff Tata Usaha",
      notes: "Barang diterima sesuai permintaan",
      status: "complete",
    },
    {
      id: "2",
      requestId: "REQ002",
      itemName: "Tinta Printer Canon",
      requestedQuantity: 5,
      receivedQuantity: 3,
      unit: "Unit",
      supplier: "CV Maju Jaya",
      receiptDate: "2024-01-14",
      receivedBy: "Staff Tata Usaha",
      notes: "Stok supplier terbatas, sisanya menyusul",
      status: "partial",
    },
  ])

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: "1", name: "Kertas HVS A4", stock: 25, unit: "Rim" },
    { id: "2", name: "Tinta Printer Canon", stock: 8, unit: "Unit" },
  ])

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
  })

  const filteredReceptions = receptions.filter(
    (reception) =>
      reception.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reception.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reception.requestId && reception.requestId.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <Badge variant="default">
            <CheckCircle className="mr-1 h-3 w-3" />
            Lengkap
          </Badge>
        )
      case "partial":
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            Sebagian
          </Badge>
        )
      case "different":
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

  const handleAddReception = () => {
    const reception: Reception = {
      id: Date.now().toString(),
      ...newReception,
      receivedBy: "Staff Tata Usaha", // In real app, get from current user
      status:
        newReception.receivedQuantity === newReception.requestedQuantity
          ? "complete"
          : newReception.receivedQuantity < newReception.requestedQuantity
            ? "partial"
            : "different",
    }

    setReceptions([...receptions, reception])

    // Update inventory stock
    const existingItem = inventory.find((item) => item.name === newReception.itemName)
    if (existingItem) {
      setInventory(
        inventory.map((item) =>
          item.name === newReception.itemName ? { ...item, stock: item.stock + newReception.receivedQuantity } : item,
        ),
      )
    } else {
      // Add new item to inventory
      setInventory([
        ...inventory,
        {
          id: Date.now().toString(),
          name: newReception.itemName,
          stock: newReception.receivedQuantity,
          unit: newReception.unit,
        },
      ])
    }

    setNewReception({
      requestId: "",
      itemName: "",
      requestedQuantity: 0,
      receivedQuantity: 0,
      unit: "",
      supplier: "",
      receiptDate: "",
      notes: "",
    })
    setIsAddDialogOpen(false)
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
                  Masukkan detail barang yang diterima. Stok akan otomatis diperbarui.
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
                    <Label htmlFor="receiptDate">Tanggal Terima</Label>
                    <Input
                      id="receiptDate"
                      type="date"
                      value={newReception.receiptDate}
                      onChange={(e) => setNewReception({ ...newReception, receiptDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="itemName">Nama Barang</Label>
                  <Input
                    id="itemName"
                    value={newReception.itemName}
                    onChange={(e) => setNewReception({ ...newReception, itemName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                    <Label htmlFor="receivedQuantity">Jumlah Diterima</Label>
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
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Satuan</Label>
                    <Input
                      id="unit"
                      value={newReception.unit}
                      onChange={(e) => setNewReception({ ...newReception, unit: e.target.value })}
                      placeholder="Unit, Rim, Kg"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={newReception.supplier}
                    onChange={(e) => setNewReception({ ...newReception, supplier: e.target.value })}
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
                <Button onClick={handleAddReception}>Simpan Penerimaan</Button>
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
              <div className="text-2xl font-bold">{receptions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lengkap</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receptions.filter((r) => r.status === "complete").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sebagian</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receptions.filter((r) => r.status === "partial").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Berbeda</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receptions.filter((r) => r.status === "different").length}</div>
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
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceptions.map((reception) => (
                  <TableRow key={reception.id}>
                    <TableCell className="font-medium">{reception.requestId || "-"}</TableCell>
                    <TableCell>{reception.itemName}</TableCell>
                    <TableCell>
                      {reception.requestedQuantity} {reception.unit}
                    </TableCell>
                    <TableCell>
                      {reception.receivedQuantity} {reception.unit}
                    </TableCell>
                    <TableCell>{reception.supplier}</TableCell>
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
