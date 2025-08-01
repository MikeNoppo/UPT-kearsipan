import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Archive } from "@/types/archive"

interface EditArchiveDialogProps {
  archive: Archive | null
  onClose: () => void
  onArchiveChange: (archive: Archive) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function EditArchiveDialog({
  archive,
  onClose,
  onArchiveChange,
  onSubmit,
  isSubmitting,
}: EditArchiveDialogProps) {
  if (!archive) return null

  return (
    <Dialog open={!!archive} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Arsip</DialogTitle>
          <DialogDescription>Ubah informasi dokumen arsip</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Kode Arsip</Label>
              <Input
                id="edit-code"
                value={archive.code}
                onChange={(e) => onArchiveChange({ ...archive, code: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-creationDate">Tanggal Pembuatan</Label>
              <Input
                id="edit-creationDate"
                type="date"
                value={archive.creationDate.split('T')[0]}
                onChange={(e) => onArchiveChange({ ...archive, creationDate: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-title">Judul Dokumen</Label>
            <Input
              id="edit-title"
              value={archive.title}
              onChange={(e) => onArchiveChange({ ...archive, title: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Kategori</Label>
              <Input
                id="edit-category"
                value={archive.category}
                onChange={(e) => onArchiveChange({ ...archive, category: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Lokasi Penyimpanan</Label>
              <Input
                id="edit-location"
                value={archive.location}
                onChange={(e) => onArchiveChange({ ...archive, location: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-retentionPeriod">Masa Retensi (Tahun)</Label>
              <Input
                id="edit-retentionPeriod"
                type="number"
                min="1"
                value={archive.retentionPeriod}
                onChange={(e) => onArchiveChange({ ...archive, retentionPeriod: parseInt(e.target.value) || 1 })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={archive.status}
                onValueChange={(value: "UNDER_REVIEW" | "PERMANENT" | "SCHEDULED_DESTRUCTION") => 
                  onArchiveChange({ ...archive, status: value })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNDER_REVIEW">Dalam Review</SelectItem>
                  <SelectItem value="PERMANENT">Permanen</SelectItem>
                  <SelectItem value="SCHEDULED_DESTRUCTION">Dijadwalkan Musnah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {archive.status === "SCHEDULED_DESTRUCTION" && (
            <div className="grid gap-2">
              <Label htmlFor="edit-destructionDate">Tanggal Pemusnahan</Label>
              <Input
                id="edit-destructionDate"
                type="date"
                value={archive.destructionDate ? archive.destructionDate.split('T')[0] : ""}
                onChange={(e) => onArchiveChange({ ...archive, destructionDate: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="edit-description">Deskripsi</Label>
            <Textarea
              id="edit-description"
              value={archive.description || ""}
              onChange={(e) => onArchiveChange({ ...archive, description: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Catatan</Label>
            <Textarea
              id="edit-notes"
              value={archive.notes || ""}
              onChange={(e) => onArchiveChange({ ...archive, notes: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={isSubmitting}>
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
      </DialogContent>
    </Dialog>
  )
}
