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

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  stock: number
}

interface CreateRequestDialogProps {
  onRequestCreated: () => void
}

export function CreateRequestDialog({ onRequestCreated }: CreateRequestDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isCustomItem, setIsCustomItem] = useState(false)
  const [newRequest, setNewRequest] = useState({
    itemName: "",
    quantity: 0,
    unit: "",
    reason: "",
  })

  // Mengambil daftar inventaris untuk dropdown
  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventory')
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory items')
      }

      const data = await response.json()
      setInventoryItems(data || [])
    } catch (error) {
      console.error('Error fetching inventory items:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchInventoryItems()
    }
  }, [isOpen])

  // Handle selection from inventory dropdown
  const handleInventorySelection = (itemId: string) => {
    if (itemId === "custom") {
      setIsCustomItem(true)
      setNewRequest({ ...newRequest, itemName: "", unit: "" })
    } else {
      const selectedItem = inventoryItems.find(item => item.id === itemId)
      if (selectedItem) {
        setIsCustomItem(false)
        setNewRequest({ 
          ...newRequest, 
          itemName: selectedItem.name,
          unit: selectedItem.unit
        })
      }
    }
  }

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setNewRequest({ itemName: "", quantity: 0, unit: "", reason: "" })
      setIsCustomItem(false)
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

      setNewRequest({ itemName: "", quantity: 0, unit: "", reason: "" })
      setIsCustomItem(false)
      setIsOpen(false)
      onRequestCreated()
      
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
            <Label htmlFor="itemSelection">Pilih Barang</Label>
            <Select onValueChange={handleInventorySelection}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih dari inventaris atau item baru" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">+ Item Baru (Ketik Manual)</SelectItem>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - {item.category} (Stok: {item.stock} {item.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isCustomItem && (
            <div className="grid gap-2">
              <Label htmlFor="itemName">Nama Barang Baru</Label>
              <Input
                id="itemName"
                value={newRequest.itemName}
                onChange={(e) => setNewRequest({ ...newRequest, itemName: e.target.value })}
                placeholder="Masukkan nama barang baru"
              />
            </div>
          )}
          
          {!isCustomItem && newRequest.itemName && (
            <div className="grid gap-2">
              <Label>Barang Terpilih</Label>
              <Input value={newRequest.itemName} disabled />
            </div>
          )}

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
              disabled={!isCustomItem && !!newRequest.itemName}
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
  )
}
