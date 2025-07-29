"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PurchaseRequestOption {
  id: string
  itemName: string
  quantity: number
  unit: string
}


interface CreateReceptionDialogProps {
  onReceptionCreated: () => void
}

export function CreateReceptionDialog({ onReceptionCreated }: CreateReceptionDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestOption[]>([])
  const [newReception, setNewReception] = useState({
    itemName: "",
    requestedQuantity: 0,
    receivedQuantity: 0,
    unit: "",
    receiptDate: "",
    notes: "",
    status: "COMPLETE" as "COMPLETE" | "PARTIAL" | "DIFFERENT",
    requestId: "",
  })

  useEffect(() => {
    if (isOpen) {
      fetch('/api/purchase-requests?status=APPROVED')
        .then(res => res.json())
        .then(data => setPurchaseRequests(data.purchaseRequests || []))
        .catch(() => setPurchaseRequests([]))
    }
  }, [isOpen])

  const handlePurchaseRequestSelect = (requestId: string) => {
    const selected = purchaseRequests.find(pr => pr.id === requestId)
    if (selected) {
      setNewReception(prev => ({
        ...prev,
        requestId: requestId,
        itemName: selected.itemName,
        requestedQuantity: selected.quantity,
        unit: selected.unit,
      }))
    }
  }

  const handleAddReception = async () => {
    if (!newReception.itemName || !newReception.receiptDate) {
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

      // Reset form
      setNewReception({
        requestId: "",
        itemName: "",
        requestedQuantity: 0,
        receivedQuantity: 0,
        unit: "",
        receiptDate: "",
        notes: "",
        status: "COMPLETE",
      })
      
      setIsOpen(false)
      onReceptionCreated()
      
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              <Label htmlFor="receiptDate">Tanggal Terima *</Label>
              <Input
                id="receiptDate"
                type="date"
                value={newReception.receiptDate}
                onChange={(e) => setNewReception({ ...newReception, receiptDate: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purchaseRequest">Pilih barang dari Permintaan pembelian</Label>
              <Select onValueChange={handlePurchaseRequestSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih permintaan pembelian yang disetujui" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseRequests.map((pr) => (
                    <SelectItem key={pr.id} value={pr.id}>
                      {pr.itemName} - {pr.quantity} {pr.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
  )
}
