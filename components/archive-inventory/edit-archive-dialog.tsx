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
import { Loader2 } from "lucide-react"
import type { Archive } from "@/types/archive"
import { getArchiveStatus, isArchiveDestroyed } from "@/lib/archive-utils"

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

  const archiveStatus = getArchiveStatus(archive)

  return (
    <Dialog open={!!archive} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Arsip</DialogTitle>
          <DialogDescription>
            Ubah informasi dokumen arsip. Status: <strong>{archiveStatus.label}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
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

          <div className="grid gap-2">
            <Label htmlFor="edit-retentionPeriod">Masa Retensi (Tahun)</Label>
            <Input
              id="edit-retentionPeriod"
              type="number"
              min="1"
              max="100"
              value={archive.retentionPeriod}
              onChange={(e) => onArchiveChange({ ...archive, retentionPeriod: parseInt(e.target.value) || 1 })}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Mengubah masa retensi akan mempengaruhi tanggal kadaluarsa arsip
            </p>
          </div>

          {/* Field untuk menandai arsip sudah dimusnahkan */}
          <div className="grid gap-2">
            <Label htmlFor="edit-destructionDate">Tanggal Pemusnahan</Label>
            <Input
              id="edit-destructionDate"
              type="date"
              value={archive.destructionDate ? archive.destructionDate.split('T')[0] : ""}
              onChange={(e) => onArchiveChange({ ...archive, destructionDate: e.target.value })}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {archive.destructionDate 
                ? "Arsip telah dimusnahkan pada tanggal ini" 
                : "Kosongkan jika arsip belum dimusnahkan"
              }
            </p>
          </div>

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
        </div>
        <DialogFooter className="flex-shrink-0 border-t pt-4">
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
