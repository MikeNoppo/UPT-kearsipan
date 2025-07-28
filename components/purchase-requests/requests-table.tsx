"use client"

import { useState } from "react"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, Loader2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface RequestsTableProps {
  requests: PurchaseRequest[]
  userRole: string
  userId: string
  onRequestUpdated: () => void
}

export function RequestsTable({ requests, userRole, userId, onRequestUpdated }: RequestsTableProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null)

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

      onRequestUpdated()
      
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

  // Mengedit permintaan pembelian (untuk staff dan administrator pada semua status)
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

      setEditingRequest(null)
      setIsEditDialogOpen(false)
      onRequestUpdated()
      
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

  // Filter requests based on user role
  const filteredRequests = userRole === "ADMINISTRATOR" 
    ? requests 
    : requests.filter((request) => request.requestedBy.id === userId)

  return (
    <>
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

      <Card>
        <CardHeader>
          <CardTitle>Daftar Permintaan</CardTitle>
          <CardDescription>
            {userRole === "ADMINISTRATOR"
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
                      {/* Edit button for staff (own requests) and administrators (all requests) */}
                      {(userRole === "ADMINISTRATOR" || 
                        (userRole === "STAFF" && request.requestedBy.id === userId)) && (
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
                      )}
                      
                      {/* Review buttons for pending requests */}
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
    </>
  )
}
