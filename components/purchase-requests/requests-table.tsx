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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, X, Clock, Loader2, Edit, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PurchaseRequestActions } from "./request-actions"

interface PurchaseRequest {
  id: string
  requestNumber: string
  itemName: string
  quantity: number
  unit: string
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED" 
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
  onDeleteRequest?: (request: PurchaseRequest) => void
}

export function RequestsTable({ 
  requests, 
  userRole, 
  userId, 
  onRequestUpdated, 
  onDeleteRequest 
}: RequestsTableProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null)
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null)


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
      case "RECEIVED":
        return (
          <Badge variant="default" className="bg-blue-600">
            <Package className="mr-1 h-3 w-3" />
            Diterima
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

  // Menyetujui atau menolak permintaan (untuk admin dan staff)
  const handleReviewRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setReviewingRequestId(id)
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
    } finally {
      setReviewingRequestId(null)
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
      
      // Prepare request body - include status if it's being changed
      const requestBody: any = {
        itemName: editingRequest.itemName,
        quantity: editingRequest.quantity,
        unit: editingRequest.unit,
        reason: editingRequest.reason,
      }
      
      // Add status if user can edit it (Admin can edit all, Staff can edit own)
      const canEditStatus = userRole === "ADMINISTRATOR" || 
        (userRole === "STAFF" && editingRequest.requestedBy.id === userId)
      
      if (canEditStatus && editingRequest.status) {
        requestBody.status = editingRequest.status
      }
      
      const response = await fetch(`/api/purchase-requests/${editingRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Permintaan Pembelian</DialogTitle>
            <DialogDescription>
              Ubah detail permintaan pembelian Anda
              {editingRequest && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  ID: {editingRequest.requestNumber} | Status saat ini: {
                    editingRequest.status === 'PENDING' ? 'Menunggu' :
                    editingRequest.status === 'APPROVED' ? 'Disetujui' :
                    editingRequest.status === 'REJECTED' ? 'Ditolak' : 'Diterima'
                  }
                </span>
              )}
            </DialogDescription>
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
            
            {/* Status field - only for Admin or staff editing their own request */}
            {editingRequest && (userRole === "ADMINISTRATOR" || 
              (userRole === "STAFF" && editingRequest.requestedBy.id === userId)) && (
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingRequest.status}
                  onValueChange={(value: "PENDING" | "APPROVED" | "REJECTED") => 
                    setEditingRequest({ ...editingRequest, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Menunggu</SelectItem>
                    <SelectItem value="APPROVED">Disetujui</SelectItem>
                    <SelectItem value="REJECTED">Ditolak</SelectItem>
                    <SelectItem value="RECEIVED">Diterima</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {userRole === "ADMINISTRATOR" ? 
                    "Administrator dapat mengubah status semua permintaan" :
                    "Anda dapat mengubah status permintaan sendiri"
                  }
                </p>
              </div>
            )}
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
                <TableHead>ID Permintaan</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {request.requestNumber}
                    </code>
                  </TableCell>
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
                            disabled={reviewingRequestId === request.id}
                            className="text-green-600 hover:text-green-700"
                          >
                            {reviewingRequestId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={reviewingRequestId === request.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {reviewingRequestId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      
                      {/* Delete action using dropdown */}
                      {onDeleteRequest && (
                        <PurchaseRequestActions
                          purchaseRequest={request}
                          onDelete={onDeleteRequest}
                          currentUserId={userId}
                          currentUserRole={userRole}
                        />
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
