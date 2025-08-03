import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/ui/file-upload"
import { Loader2 } from "lucide-react"
import type { Letter, FileUploadResponse } from "@/types/letter"

interface EditLetterDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingLetter: Letter | null
  setEditingLetter: (letter: Letter | null) => void
  isSubmitting: boolean
  onSubmit: () => void
  onFileUpload: (fileData: FileUploadResponse) => void
  onFileRemove: () => void
}

export function EditLetterDialog({
  isOpen,
  onOpenChange,
  editingLetter,
  setEditingLetter,
  isSubmitting,
  onSubmit,
  onFileUpload,
  onFileRemove,
}: EditLetterDialogProps) {
  if (!editingLetter) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Surat</DialogTitle>
          <DialogDescription>Ubah informasi surat</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-number">Nomor Surat</Label>
              <Input
                id="edit-number"
                value={editingLetter.number}
                onChange={(e) => setEditingLetter({ ...editingLetter, number: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Tanggal</Label>
              <Input
                id="edit-date"
                type="date"
                value={editingLetter.date.split('T')[0]}
                onChange={(e) => setEditingLetter({ ...editingLetter, date: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-subject">Perihal</Label>
            <Input
              id="edit-subject"
              value={editingLetter.subject}
              onChange={(e) => setEditingLetter({ ...editingLetter, subject: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label>Jenis Surat</Label>
            <Select
              value={editingLetter.type}
              onValueChange={(value: "INCOMING" | "OUTGOING") => setEditingLetter({ ...editingLetter, type: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOMING">Surat Masuk</SelectItem>
                <SelectItem value="OUTGOING">Surat Keluar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {editingLetter.type === "INCOMING" ? (
            <div className="grid gap-2">
              <Label htmlFor="edit-from">Asal Surat</Label>
              <Input
                id="edit-from"
                value={editingLetter.from || ""}
                onChange={(e) => setEditingLetter({ ...editingLetter, from: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="edit-to">Tujuan Surat</Label>
              <Input
                id="edit-to"
                value={editingLetter.to || ""}
                onChange={(e) => setEditingLetter({ ...editingLetter, to: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="edit-description">Keterangan</Label>
            <Textarea
              id="edit-description"
              value={editingLetter.description || ""}
              onChange={(e) => setEditingLetter({ ...editingLetter, description: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
          <FileUpload
            onUploadComplete={onFileUpload}
            onRemove={onFileRemove}
            currentFile={editingLetter.documentName ? {
              name: editingLetter.documentName,
              size: editingLetter.documentSize,
              path: editingLetter.documentPath
            } : undefined}
            letterId={editingLetter.id}
            disabled={isSubmitting}
          />
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
