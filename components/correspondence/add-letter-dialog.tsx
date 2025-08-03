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
import { FileUpload } from "@/components/ui/file-upload"
import { Plus, Loader2 } from "lucide-react"
import type { CreateLetterData, FileUploadResponse } from "@/types/letter"

interface AddLetterDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newLetter: CreateLetterData
  setNewLetter: (letter: CreateLetterData) => void
  isSubmitting: boolean
  onSubmit: () => void
  onFileUpload: (fileData: FileUploadResponse) => void
  onFileRemove: () => void
}

export function AddLetterDialog({
  isOpen,
  onOpenChange,
  newLetter,
  setNewLetter,
  isSubmitting,
  onSubmit,
  onFileUpload,
  onFileRemove,
}: AddLetterDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Surat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Surat Baru</DialogTitle>
          <DialogDescription>
            Masukkan informasi surat yang akan dicatat
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="number">Nomor Surat *</Label>
              <Input
                id="number"
                value={newLetter.number}
                onChange={(e) => setNewLetter({ ...newLetter, number: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Tanggal *</Label>
              <Input
                id="date"
                type="date"
                value={newLetter.date}
                onChange={(e) => setNewLetter({ ...newLetter, date: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Perihal *</Label>
            <Input
              id="subject"
              value={newLetter.subject}
              onChange={(e) => setNewLetter({ ...newLetter, subject: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label>Jenis Surat *</Label>
            <Select
              value={newLetter.type}
              onValueChange={(value: "INCOMING" | "OUTGOING") => setNewLetter({ ...newLetter, type: value })}
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
          {newLetter.type === "INCOMING" ? (
            <div className="grid gap-2">
              <Label htmlFor="from">Asal Surat</Label>
              <Input
                id="from"
                value={newLetter.from || ""}
                onChange={(e) => setNewLetter({ ...newLetter, from: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="to">Tujuan Surat</Label>
              <Input
                id="to"
                value={newLetter.to || ""}
                onChange={(e) => setNewLetter({ ...newLetter, to: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="description">Keterangan</Label>
            <Textarea
              id="description"
              value={newLetter.description || ""}
              onChange={(e) => setNewLetter({ ...newLetter, description: e.target.value })}
              disabled={isSubmitting}
              placeholder="Keterangan tambahan tentang surat"
            />
          </div>
          <FileUpload
            onUploadComplete={onFileUpload}
            onRemove={onFileRemove}
            currentFile={newLetter.documentName ? {
              name: newLetter.documentName,
              size: newLetter.documentSize,
              path: newLetter.documentPath
            } : undefined}
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Tambah Surat"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
