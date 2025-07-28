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
import { Plus, Check, X, Clock, Loader2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/**
 * Purchase Requests Page - Halaman permintaan pembelian barang
 * 
 * Fungsi utama:
 * - Mengelola permintaan pembelian barang untuk keperluan UPT
 * - Staff dapat mengajukan permintaan barang baru
 * - Administrator dapat menyetujui atau menolak permintaan
 * - Tracking status permintaan dari pending hingga approved/rejected
 * 
 * Alur kerja permintaan:
 * 1. Staff membuat permintaan dengan detail barang dan alasan
 * 2. Permintaan masuk status PENDING
 * 3. Administrator review dan beri keputusan (APPROVED/REJECTED)
 * 4. Jika disetujui, permintaan dapat diproses ke tahap penerimaan
 * 
 * Fitur yang tersedia:
 * - Form permintaan barang dengan validasi
 * - Review dan approval system untuk admin
 * - Status tracking dengan badge visual
 * - Catatan dan alasan untuk setiap permintaan
 * - History lengkap permintaan dengan timestamp
 */

interface PurchaseRequest {
  id: string
  itemName: string
  quantity: number
  unit: string
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  notes?: string
  requestDate: string
  reviewDate?: string
  createdAt: string
  updatedAt: string
  requestedBy: {
    id: string
    name: string
    username: string
  }
  reviewedBy?: {
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

export default function PurchaseRequestsPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null)
  // Data form untuk permintaan baru
  const [newRequest, setNewRequest] = useState({
    itemName: "",
    quantity: 0,
    unit: "",
    reason: "",
  })

  // Mengambil daftar permintaan pembelian dari API
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/purchase-requests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchase requests')
      }

      const data = await response.json()
      setRequests(data.purchaseRequests || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        title: "Error",
        description: "Failed to load purchase requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load permintaan saat session tersedia
  useEffect(() => {
    if (session) {
      fetchRequests()
    }
  }, [session])

  // Fungsi untuk menentukan badge status permintaan
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-600">
            <Check className="mr-1 h-3 w-3" />
            Disetujui
          </Badge>
        )
      case "REJECTED":
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

  // Menambah permintaan pembelian baru
  const handleAddRequest = async () => {
    if (!newRequest.itemName || !newRequest.quantity || !newRequest.unit || !newRequest.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRequest),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create purchase request')
      }

      const createdRequest = await response.json()
      setRequests([createdRequest, ...requests])
      setNewRequest({ itemName: "", quantity: 0, unit: "", reason: "" })
      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Purchase request created successfully",
      })
    } catch (error) {
      console.error('Error creating request:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create purchase request',
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Menyetujui atau menolak permintaan (untuk admin)
  const handleReviewRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/purchase-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to review purchase request')
      }

      const updatedRequest = await response.json()
      setRequests(requests.map(request => 
        request.id === id ? updatedRequest : request
      ))
      
      toast({
        title: "Success",
        description: `Purchase request ${status.toLowerCase()} successfully`,
      })
    } catch (error) {
      console.error('Error reviewing request:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to review purchase request',
        variant: "destructive",
      })
    }
  }

  const handleApproveRequest = (id: string) => {
    handleReviewRequest(id, 'APPROVED')
  }

  const handleRejectRequest = (id: string) => {
    handleReviewRequest(id, 'REJECTED')
  }

  // Mengedit permintaan pembelian (hanya untuk staff dan permintaan pending)
  const handleEditRequest = async () => {
    if (!editingRequest) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/purchase-requests/${editingRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: editingRequest.itemName,
          quantity: editingRequest.quantity,
          unit: editingRequest.unit,
          reason: editingRequest.reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update purchase request')
      }

      const updatedRequest = await response.json()
      setRequests(requests.map(request => 
        request.id === editingRequest.id ? updatedRequest : request
      ))
      
      setEditingRequest(null)
      setIsEditDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Purchase request updated successfully",
      })
    } catch (error) {
      console.error('Error updating request:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update purchase request',
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
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

  // Filter requests based on user role
  const filteredRequests = session.user.role === "ADMINISTRATOR" 
    ? requests 
    : requests.filter((request) => request.requestedBy.id === session.user.id)

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
                <Button onClick={handleAddRequest} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ajukan Permintaan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Request Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Permintaan Pembelian</DialogTitle>
              <DialogDescription>Ubah detail permintaan pembelian Anda</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-itemName">Nama Barang</Label>
                <Input
                  id="edit-itemName"
                  value={editingRequest?.itemName || ""}
                  onChange={(e) => editingRequest && setEditingRequest({ ...editingRequest, itemName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-quantity">Jumlah</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editingRequest?.quantity || 0}
                  onChange={(e) => editingRequest && setEditingRequest({ ...editingRequest, quantity: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unit">Satuan</Label>
                <Input
                  id="edit-unit"
                  value={editingRequest?.unit || ""}
                  onChange={(e) => editingRequest && setEditingRequest({ ...editingRequest, unit: e.target.value })}
                  placeholder="Unit, Rim, Kg, dll"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-reason">Alasan Permintaan</Label>
                <Textarea
                  id="edit-reason"
                  value={editingRequest?.reason || ""}
                  onChange={(e) => editingRequest && setEditingRequest({ ...editingRequest, reason: e.target.value })}
                  placeholder="Jelaskan alasan permintaan pembelian"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEditRequest} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permintaan</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{filteredRequests.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{filteredRequests.filter((r) => r.status === "PENDING").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{filteredRequests.filter((r) => r.status === "APPROVED").length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Permintaan</CardTitle>
            <CardDescription>
              {session.user.role === "ADMINISTRATOR"
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
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.itemName}</TableCell>
                    <TableCell>
                      {request.quantity} {request.unit}
                    </TableCell>
                    <TableCell>{request.requestedBy.name}</TableCell>
                    <TableCell>{new Date(request.requestDate).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {/* Edit button for staff (own pending requests) and administrators (all pending requests) */}
                        {request.status === "PENDING" && (
                          (session.user.role === "ADMINISTRATOR" || 
                           (session.user.role === "STAFF" && request.requestedBy.id === session.user.id)) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingRequest({...request})
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )
                        )}
                        
                        {/* Review buttons for all users on pending requests */}
                        {request.status === "PENDING" && (
                          <>
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
                          </>
                        )}
                      </div>
                    </TableCell>
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
