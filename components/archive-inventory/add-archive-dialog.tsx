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
import type { CreateArchiveData } from "@/types/archive"

interface AddArchiveDialogProps {
  isOpen: boolean
  onClose: () => void
  archive: CreateArchiveData
  onArchiveChange: (archive: CreateArchiveData) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function AddArchiveDialog({
  isOpen,
  onClose,
  archive,
  onArchiveChange,
  onSubmit,
  isSubmitting,
}: AddArchiveDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tambah Arsip Baru</DialogTitle>
          <DialogDescription>
            Daftarkan dokumen baru ke dalam inventaris arsip. Status akan ditentukan otomatis berdasarkan masa retensi.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Kode Arsip *</Label>
              <Input
                id="code"
                value={archive.code}
                onChange={(e) => onArchiveChange({ ...archive, code: e.target.value })}
                disabled={isSubmitting}
                placeholder="ARS/2024/001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creationDate">Tanggal Pembuatan *</Label>
              <Input
                id="creationDate"
                type="date"
                value={archive.creationDate}
                onChange={(e) => onArchiveChange({ ...archive, creationDate: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Judul Dokumen *</Label>
            <Input
              id="title"
              value={archive.title}
              onChange={(e) => onArchiveChange({ ...archive, title: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Kategori *</Label>
              <Input
                id="category"
                value={archive.category}
                onChange={(e) => onArchiveChange({ ...archive, category: e.target.value })}
                disabled={isSubmitting}
                placeholder="Akademik, Keuangan, dll"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Lokasi Penyimpanan *</Label>
              <Input
                id="location"
                value={archive.location}
                onChange={(e) => onArchiveChange({ ...archive, location: e.target.value })}
                disabled={isSubmitting}
                placeholder="Rak A-1-001"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="retentionPeriod">Masa Retensi (Tahun) *</Label>
            <Input
              id="retentionPeriod"
              type="number"
              min="1"
              max="100"
              value={archive.retentionPeriod}
              onChange={(e) => onArchiveChange({ ...archive, retentionPeriod: parseInt(e.target.value) || 1 })}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Arsip akan otomatis dianggap kadaluarsa setelah masa retensi berakhir
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={archive.description || ""}
              onChange={(e) => onArchiveChange({ ...archive, description: e.target.value })}
              disabled={isSubmitting}
              placeholder="Deskripsi dokumen arsip"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={archive.notes || ""}
              onChange={(e) => onArchiveChange({ ...archive, notes: e.target.value })}
              disabled={isSubmitting}
              placeholder="Catatan tambahan"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Tambah Arsip"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
