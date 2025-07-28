"use client"

import { useState, useCallback, memo } from "react"
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

interface InventoryItem {
  id: string
  name: string
  stock: number
  unit: string
}

interface NewReception {
  requestId: string
  itemName: string
  requestedQuantity: number
  receivedQuantity: number
  unit: string
  supplier: string
  receiptDate: string
  notes: string
  status: "COMPLETE" | "PARTIAL" | "DIFFERENT"
  itemId: string
}

interface AddReceptionDialogProps {
  inventory: InventoryItem[]
  onReceptionAdded: (reception: any) => void
}

const AddReceptionDialog = memo(function AddReceptionDialog({ inventory, onReceptionAdded }: AddReceptionDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newReception, setNewReception] = useState<NewReception>({
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

  const handleInventoryItemSelect = useCallback((itemId: string) => {
    const selectedItem = inventory.find(item => item.id === itemId)
    if (selectedItem) {
      setNewReception(prev => ({
        ...prev,
        itemId: itemId,
        itemName: selectedItem.name,
        unit: selectedItem.unit,
      }))
    }
  }, [inventory])

  const resetForm = useCallback(() => {
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
  }, [])

  const handleAddReception = useCallback(async () => {
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
      onReceptionAdded(createdReception)
      
      resetForm()
      setIsOpen(false)
      
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
  }, [newReception, onReceptionAdded, resetForm, toast])

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
  )
})

export { AddReceptionDialog }
