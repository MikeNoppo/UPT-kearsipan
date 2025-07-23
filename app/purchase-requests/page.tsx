"use client"

import { useState, useEffect } from "react"
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
import { Plus, Check, X, Clock } from "lucide-react"

interface PurchaseRequest {
  id: string
  itemName: string
  quantity: number
  unit: string
  reason: string
  requestedBy: string
  requestDate: string
  status: "pending" | "approved" | "rejected"
  reviewedBy?: string
  reviewDate?: string
  notes?: string
}

export default function PurchaseRequestsPage() {
  const [user, setUser] = useState<any>(null)
  const [requests, setRequests] = useState<PurchaseRequest[]>([
    {
      id: "1",
      itemName: "Kertas HVS A4",
      quantity: 10,
      unit: "Rim",
      reason: "Stok habis untuk kebutuhan operasional",
      requestedBy: "Staff Tata Usaha",
      requestDate: "2024-01-15",
      status: "pending",
    },
    {
      id: "2",
      itemName: "Tinta Printer",
      quantity: 5,
      unit: "Unit",
      reason: "Tinta printer hampir habis",
      requestedBy: "Staff Tata Usaha",
      requestDate: "2024-01-14",
      status: "approved",
      reviewedBy: "Administrator",
      reviewDate: "2024-01-15",
    },
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRequest, setNewRequest] = useState({
    itemName: "",
    quantity: 0,
    unit: "",
    reason: "",
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default">
            <Check className="mr-1 h-3 w-3" />
            Disetujui
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <X className="mr-1 h-3 w-3" />
            Ditolak
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleAddRequest = () => {
    const request: PurchaseRequest = {
      id: Date.now().toString(),
      ...newRequest,
      requestedBy: user?.name || "Unknown",
      requestDate: new Date().toISOString().split("T")[0],
      status: "pending",
    }

    setRequests([...requests, request])
    setNewRequest({ itemName: "", quantity: 0, unit: "", reason: "" })
    setIsAddDialogOpen(false)
  }

  const handleApproveRequest = (id: string) => {
    setRequests(
      requests.map((request) =>
        request.id === id
          ? {
              ...request,
              status: "approved" as const,
              reviewedBy: user?.name,
              reviewDate: new Date().toISOString().split("T")[0],
            }
          : request,
      ),
    )
  }

  const handleRejectRequest = (id: string) => {
    setRequests(
      requests.map((request) =>
        request.id === id
          ? {
              ...request,
              status: "rejected" as const,
              reviewedBy: user?.name,
              reviewDate: new Date().toISOString().split("T")[0],
            }
          : request,
      ),
    )
  }

  const filteredRequests =
    user?.role === "administrator" ? requests : requests.filter((request) => request.requestedBy === user?.name)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Permintaan Pembelian</h1>
            <p className="text-muted-foreground">Kelola permintaan pembelian barang</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Buat Permintaan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Permintaan Pembelian</DialogTitle>
                <DialogDescription>Ajukan permintaan pembelian barang baru</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="itemName">Nama Barang</Label>
                  <Input
                    id="itemName"
                    value={newRequest.itemName}
                    onChange={(e) => setNewRequest({ ...newRequest, itemName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newRequest.quantity}
                    onChange={(e) => setNewRequest({ ...newRequest, quantity: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Input
                    id="unit"
                    value={newRequest.unit}
                    onChange={(e) => setNewRequest({ ...newRequest, unit: e.target.value })}
                    placeholder="Unit, Rim, Kg, dll"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason">Alasan Permintaan</Label>
                  <Textarea
                    id="reason"
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                    placeholder="Jelaskan alasan permintaan pembelian"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddRequest}>Ajukan Permintaan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permintaan</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredRequests.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredRequests.filter((r) => r.status === "pending").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredRequests.filter((r) => r.status === "approved").length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Permintaan</CardTitle>
            <CardDescription>
              {user?.role === "administrator"
                ? "Semua permintaan pembelian yang masuk"
                : "Permintaan pembelian yang Anda ajukan"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  {user?.role === "administrator" && <TableHead>Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.itemName}</TableCell>
                    <TableCell>
                      {request.quantity} {request.unit}
                    </TableCell>
                    <TableCell>{request.requestedBy}</TableCell>
                    <TableCell>{new Date(request.requestDate).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    {user?.role === "administrator" && (
                      <TableCell>
                        {request.status === "pending" && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
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
