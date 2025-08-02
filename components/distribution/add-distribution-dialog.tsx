import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Loader2 } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  stock: number
}

interface NewDistributionItem {
  itemName: string
  quantity: number
  unit: string
  itemId?: string
}

interface NewDistribution {
  staffName: string
  department: string
  distributionDate: string
  purpose: string
  items: NewDistributionItem[]
}

interface AddDistributionDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  newDistribution: NewDistribution
  setNewDistribution: React.Dispatch<React.SetStateAction<NewDistribution>>
  currentItem: NewDistributionItem & { itemId: string }
  setCurrentItem: React.Dispatch<React.SetStateAction<NewDistributionItem & { itemId: string }>>
  inventoryItems: InventoryItem[]
  handleItemSelection: (itemId: string) => void
  handleAddItem: () => void
  handleRemoveItem: (index: number) => void
  handleAddDistribution: () => void
  isSubmitting: boolean
}

export function AddDistributionDialog({
  isOpen,
  setIsOpen,
  newDistribution,
  setNewDistribution,
  currentItem,
  setCurrentItem,
  inventoryItems,
  handleItemSelection,
  handleAddItem,
  handleRemoveItem,
  handleAddDistribution,
  isSubmitting,
}: AddDistributionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Distribusi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Distribusi Baru</DialogTitle>
          <DialogDescription>Buat catatan distribusi barang baru</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Basic Distribution Info */}
          <div className="grid grid-cols-1 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="distributionDate">Tanggal Distribusi *</Label>
              <Input
                id="distributionDate"
                type="date"
                value={newDistribution.distributionDate}
                onChange={(e) => setNewDistribution({ ...newDistribution, distributionDate: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="staffName">Nama Staff Penerima *</Label>
              <Input
                id="staffName"
                value={newDistribution.staffName}
                onChange={(e) => setNewDistribution({ ...newDistribution, staffName: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Departemen *</Label>
              <Input
                id="department"
                value={newDistribution.department}
                onChange={(e) => setNewDistribution({ ...newDistribution, department: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purpose">Tujuan Penggunaan *</Label>
            <Textarea
              id="purpose"
              value={newDistribution.purpose}
              onChange={(e) => setNewDistribution({ ...newDistribution, purpose: e.target.value })}
              disabled={isSubmitting}
              placeholder="Describe the purpose of this distribution"
            />
          </div>

          {/* Add Items Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Tambah Barang</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Pilih dari Inventaris (Opsional)</Label>
                <Select
                  value={currentItem.itemId}
                  onValueChange={handleItemSelection}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih barang dari inventaris..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - {item.category} (Stok: {item.stock} {item.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentItemName">Nama Barang *</Label>
                  <Input
                    id="currentItemName"
                    value={currentItem.itemName}
                    onChange={(e) => setCurrentItem({ ...currentItem, itemName: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="Nama barang"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currentUnit">Satuan *</Label>
                  <Input
                    id="currentUnit"
                    value={currentItem.unit}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="pcs, box, dll"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currentQuantity">Jumlah *</Label>
                  <Input
                    id="currentQuantity"
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={isSubmitting}
                className="w-fit"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Barang
              </Button>
            </div>
          </div>

          {/* Items List */}
          {newDistribution.items.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Daftar Barang ({newDistribution.items.length})</h3>
              <div className="space-y-2">
                {newDistribution.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-muted-foreground ml-2">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleAddDistribution} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Tambah Distribusi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
