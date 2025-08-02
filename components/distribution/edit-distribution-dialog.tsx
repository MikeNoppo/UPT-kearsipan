import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit, Loader2 } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  stock: number
}

interface DistributionItem {
  id: string
  itemName: string
  quantity: number
  unit: string
  itemId?: string
}

interface Distribution {
  id: string
  noteNumber: string
  staffName: string
  department: string
  distributionDate: string
  purpose: string
  createdAt: string
  distributedBy: {
    id: string
    name: string
    username: string
  }
  items: DistributionItem[]
}

interface EditDistributionDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  editingDistribution: Distribution | null
  setEditingDistribution: (dist: Distribution | null) => void
  editingItemIndex: number | null
  setEditingItemIndex: (idx: number | null) => void
  editingItemData: {
    itemName: string
    quantity: number
    unit: string
    itemId: string
  }
  setEditingItemData: (data: {
    itemName: string
    quantity: number
    unit: string
    itemId: string
  }) => void
  inventoryItems: InventoryItem[]
  isSubmitting: boolean
  handleEditDistribution: () => void
  handleEditItem: (index: number) => void
  handleSaveEditingItem: () => void
  handleCancelEditingItem: () => void
  handleRemoveEditingItem: (index: number) => void
  handleAddNewItemToEdit: () => void
}

export function EditDistributionDialog({
  open,
  setOpen,
  editingDistribution,
  setEditingDistribution,
  editingItemIndex,
  setEditingItemIndex: _setEditingItemIndex,
  editingItemData,
  setEditingItemData,
  inventoryItems,
  isSubmitting,
  handleEditDistribution,
  handleEditItem,
  handleSaveEditingItem,
  handleCancelEditingItem,
  handleRemoveEditingItem,
  handleAddNewItemToEdit,
}: EditDistributionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Distribusi</DialogTitle>
          <DialogDescription>Ubah informasi distribusi barang (catatan: item tidak dapat diubah)</DialogDescription>
        </DialogHeader>
        {editingDistribution && (
          <>
            <div className="overflow-y-auto pr-2" style={{ maxHeight: '65vh' }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-noteNumber">Nomor Nota</Label>
                    <Input
                      id="edit-noteNumber"
                      value={editingDistribution.noteNumber}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, noteNumber: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-distributionDate">Tanggal Distribusi</Label>
                    <Input
                      id="edit-distributionDate"
                      type="date"
                      value={editingDistribution.distributionDate.split('T')[0]}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, distributionDate: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-staffName">Nama Staff Penerima</Label>
                    <Input
                      id="edit-staffName"
                      value={editingDistribution.staffName}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, staffName: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-department">Departemen</Label>
                    <Input
                      id="edit-department"
                      value={editingDistribution.department}
                      onChange={(e) => setEditingDistribution({ ...editingDistribution, department: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-purpose">Tujuan Penggunaan</Label>
                  <Textarea
                    id="edit-purpose"
                    value={editingDistribution.purpose}
                    onChange={(e) => setEditingDistribution({ ...editingDistribution, purpose: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Editable items section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">Barang yang Didistribusikan</Label>
                    <span className="text-sm text-muted-foreground">
                      {editingDistribution.items.length} item(s)
                    </span>
                  </div>
                  {/* Items list */}
                  <div className="space-y-3">
                    {editingDistribution.items.map((item, index) => (
                      <div key={index} className="border rounded-lg">
                        {editingItemIndex === index ? (
                          /* Editing mode */
                          <div className="p-4 space-y-3">
                            <div className="grid gap-2">
                              <Label>Pilih dari Inventaris (Opsional)</Label>
                              <Select
                                value={editingItemData.itemId}
                                onValueChange={(value) => {
                                  const selectedItem = inventoryItems.find(item => item.id === value)
                                  if (selectedItem) {
                                    setEditingItemData({
                                      ...editingItemData,
                                      itemId: value,
                                      itemName: selectedItem.name,
                                      unit: selectedItem.unit,
                                    })
                                  } else {
                                    setEditingItemData({
                                      ...editingItemData,
                                      itemId: value,
                                    })
                                  }
                                }}
                                disabled={isSubmitting}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih barang dari inventaris..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {inventoryItems.map((inventoryItem) => (
                                    <SelectItem key={inventoryItem.id} value={inventoryItem.id}>
                                      {inventoryItem.name} - {inventoryItem.category} (Stok: {inventoryItem.stock} {inventoryItem.unit})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="grid gap-2">
                                <Label>Nama Barang</Label>
                                <Input
                                  value={editingItemData.itemName}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, itemName: e.target.value })}
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Satuan</Label>
                                <Input
                                  value={editingItemData.unit}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, unit: e.target.value })}
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Jumlah</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={editingItemData.quantity}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, quantity: parseInt(e.target.value) || 1 })}
                                  disabled={isSubmitting}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveEditingItem}
                                disabled={!editingItemData.itemName || !editingItemData.unit}
                              >
                                Simpan
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEditingItem}
                              >
                                Batal
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Display mode */
                          <div className="p-3 flex items-center justify-between">
                            <div>
                              <span className="font-medium">{item.itemName}</span>
                              <span className="text-muted-foreground ml-2">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditItem(index)}
                                disabled={isSubmitting}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveEditingItem(index)}
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Add new item section - Only show when not editing any item */}
                  {editingItemIndex === null && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                      <Label className="text-sm font-medium mb-3 block">Tambah Item Baru</Label>
                      <div className="space-y-3">
                        <div className="grid gap-2">
                          <Select
                            value={editingItemData.itemId}
                            onValueChange={(value) => {
                              const selectedItem = inventoryItems.find(item => item.id === value)
                              if (selectedItem) {
                                setEditingItemData({
                                  ...editingItemData,
                                  itemId: value,
                                  itemName: selectedItem.name,
                                  unit: selectedItem.unit,
                                })
                              } else {
                                setEditingItemData({
                                  ...editingItemData,
                                  itemId: value,
                                })
                              }
                            }}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih barang dari inventaris..." />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryItems.map((inventoryItem) => (
                                <SelectItem key={inventoryItem.id} value={inventoryItem.id}>
                                  {inventoryItem.name} - {inventoryItem.category} (Stok: {inventoryItem.stock} {inventoryItem.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            placeholder="Nama barang"
                            value={editingItemData.itemName}
                            onChange={(e) => setEditingItemData({ ...editingItemData, itemName: e.target.value })}
                            disabled={isSubmitting}
                          />
                          <Input
                            placeholder="Satuan"
                            value={editingItemData.unit}
                            onChange={(e) => setEditingItemData({ ...editingItemData, unit: e.target.value })}
                            disabled={isSubmitting}
                          />
                          <Input
                            type="number"
                            placeholder="Jumlah"
                            min="1"
                            value={editingItemData.quantity}
                            onChange={(e) => setEditingItemData({ ...editingItemData, quantity: parseInt(e.target.value) || 1 })}
                            disabled={isSubmitting}
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddNewItemToEdit}
                          disabled={!editingItemData.itemName || !editingItemData.unit || isSubmitting}
                          className="w-fit"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Item
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Footer selalu di bawah dialog */}
            <DialogFooter className="mt-2 bg-background border-t pt-4 pb-2">
              <Button onClick={handleEditDistribution} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
