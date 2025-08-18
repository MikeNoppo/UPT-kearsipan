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

interface CreateRequestDialogProps { onRequestCreated: () => void }

export function CreateRequestDialog({ onRequestCreated }: CreateRequestDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isCustomItem, setIsCustomItem] = useState(false)
  // Legacy single item (fallback) + new multi-items state
  const [newRequest, setNewRequest] = useState({
    itemId: undefined as string | undefined,
    itemName: "",
    quantity: 0,
    unit: "",
    reason: "",
  })
  type DraftItem = { tempId: string; itemId?: string; itemName: string; quantity: number; unit: string }
  const [items, setItems] = useState<DraftItem[]>([])
  const [draftItem, setDraftItem] = useState<DraftItem | null>(null)
  const startNewDraft = () => setDraftItem({ tempId: crypto.randomUUID(), itemName: "", quantity: 0, unit: "", itemId: undefined })

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
      setNewRequest({ ...newRequest, itemId: undefined, itemName: "", unit: "" })
    } else {
      const selectedItem = inventoryItems.find(item => item.id === itemId)
      if (selectedItem) {
        setIsCustomItem(false)
        setNewRequest({ 
          ...newRequest, 
          itemId: selectedItem.id,
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
      setNewRequest({ itemId: undefined, itemName: "", quantity: 0, unit: "", reason: "" })
      setIsCustomItem(false)
      setItems([])
      setDraftItem(null)
    }
  }

  // Menambah permintaan pembelian baru
  const handleAddRequest = async () => {
    // Now only multi-item mode is allowed
    const hasMulti = items.length > 0
    if (!newRequest.reason || !hasMulti) {
      toast({
        title: "Validation Error",
        description: "Isi alasan dan tambahkan minimal satu barang.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        reason: newRequest.reason,
        notes: undefined,
        items: items.map(i => ({ itemName: i.itemName, quantity: i.quantity, unit: i.unit, itemId: i.itemId }))
      }
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create purchase request')
      }

  setNewRequest({ itemId: undefined, itemName: "", quantity: 0, unit: "", reason: "" })
  setIsCustomItem(false)
  setItems([])
  setDraftItem(null)
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
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Reason (now moved to top since multi-items) */}
          <div className="grid gap-2">
            <Label htmlFor="reason">Alasan Permintaan</Label>
            <Textarea
              id="reason"
              value={newRequest.reason}
              onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
              placeholder="Jelaskan alasan permintaan pembelian"
            />
          </div>
          <div className="border-t pt-2" />
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Daftar Barang</h4>
            <Button type="button" size="sm" variant="outline" onClick={() => { startNewDraft(); setIsCustomItem(true) }}>Tambah Barang</Button>
          </div>
          {items.length === 0 && !draftItem && (
            <p className="text-sm text-muted-foreground">Belum ada barang. Tambahkan barang pertama.</p>
          )}
          {/* Existing items list */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map(it => (
                <div key={it.tempId} className="flex items-center justify-between rounded-md border p-2 gap-2 bg-muted/30">
                  <div className="text-sm">
                    <div className="font-medium">{it.itemName}</div>
                    <div className="text-xs text-muted-foreground">{it.quantity} {it.unit}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setDraftItem(it); setItems(items.filter(x => x.tempId !== it.tempId)); }}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setItems(items.filter(x => x.tempId !== it.tempId))}>Hapus</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Draft item editor */}
          {draftItem && (
            <div className="rounded-md border p-3 space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-medium">{draftItem.itemId ? 'Barang Inventaris' : 'Barang Baru'}</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setDraftItem(null); }}>Batal</Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Pilih Barang (opsional)</Label>
                <Select value={draftItem.itemId || (draftItem.itemName ? 'custom' : undefined)} onValueChange={(val) => {
                  if (val === 'custom') {
                    setIsCustomItem(true)
                    setDraftItem({ ...draftItem, itemId: undefined, itemName: '' })
                  } else {
                    const selectedItem = inventoryItems.find(i => i.id === val)
                    if (selectedItem) {
                      setIsCustomItem(false)
                      setDraftItem({ ...draftItem, itemId: selectedItem.id, itemName: selectedItem.name, unit: selectedItem.unit })
                    }
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Pilih atau barang baru" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">+ Item Baru (Ketik Manual)</SelectItem>
                    {inventoryItems.map(i => (
                      <SelectItem value={i.id} key={i.id}>{i.name} - {i.category} (Stok: {i.stock} {i.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(isCustomItem || !draftItem.itemId) && (
                <div className="grid gap-2">
                  <Label>Nama Barang</Label>
                  <Input value={draftItem.itemName} onChange={(e) => setDraftItem({ ...draftItem, itemName: e.target.value })} />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Jumlah</Label>
                <Input type="number" value={draftItem.quantity} onChange={(e) => setDraftItem({ ...draftItem, quantity: Number(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Satuan</Label>
                <Input value={draftItem.unit} disabled={!!draftItem.itemId} onChange={(e) => setDraftItem({ ...draftItem, unit: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" onClick={() => {
                  if (!draftItem.itemName || draftItem.quantity <= 0 || !draftItem.unit) {
                    toast({ title: 'Validasi', description: 'Lengkapi data item', variant: 'destructive' })
                    return
                  }
                  setItems([...items, draftItem])
                  setDraftItem(null)
                }}>Simpan Item</Button>
              </div>
            </div>
          )}

          <div className="border-t pt-2" />
          {/* Legacy single-item UI disembunyikan */}
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
