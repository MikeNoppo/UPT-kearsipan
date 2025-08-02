"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Reception {
  id: string
  requestId?: string
  itemName: string
  requestedQuantity: number
  receivedQuantity: number
  unit: string
  receiptDate: string
  status: "COMPLETE" | "PARTIAL" | "DIFFERENT"
  notes?: string
  createdAt: string
  updatedAt: string
  receivedBy: {
    id: string
    name: string
    username: string
  }
  requestedBy?: {
    id: string
    name: string
    username: string
  }
  purchaseRequest?: {
    id: string
    requestNumber: string
    requestedBy: {
      id: string
      name: string
      username: string
    }
  }
  item?: {
    id: string
    name: string
    category: string
    stock: number
    unit: string
  }
}

interface EditReceptionDialogProps {
  reception: Reception | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceptionUpdated: () => void;
}

export function EditReceptionDialog({
  reception,
  open,
  onOpenChange,
  onReceptionUpdated,
}: EditReceptionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    receivedQuantity: 0,
    receiptDate: "",
    status: "COMPLETE" as "COMPLETE" | "PARTIAL" | "DIFFERENT",
    notes: "",
  });

  // Update form data when reception changes
  useEffect(() => {
    if (reception) {
      setFormData({
        receivedQuantity: reception.receivedQuantity,
        receiptDate: new Date(reception.receiptDate).toISOString().split('T')[0],
        status: reception.status,
        notes: reception.notes || "",
      });
    }
  }, [reception]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Ensure no lingering state
      if (!open) {
        setFormData({
          receivedQuantity: 0,
          receiptDate: "",
          status: "COMPLETE",
          notes: "",
        });
      }
    };
  }, [open]);

  // Handle dialog close properly
  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      // Clear any pending timeouts or focus traps
      setTimeout(() => {
        onOpenChange(newOpen);
      }, 0);
    }
  };

  // Handle cancel/close
  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isSubmitting) {
      setTimeout(() => {
        onOpenChange(false);
      }, 0);
    }
  };

  const handleSubmit = async () => {
    if (!reception) return;

    if (formData.receivedQuantity <= 0) {
      toast({
        title: "Validasi Gagal",
        description: "Jumlah diterima harus lebih dari 0.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reception", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reception.id,
          ...formData,
          receiptDate: new Date(formData.receiptDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memperbarui penerimaan barang.");
      }

      toast({
        title: "Sukses",
        description: "Penerimaan barang berhasil diperbarui.",
      });
      
      // Delay closing to ensure proper cleanup
      setTimeout(() => {
        onOpenChange(false);
        onReceptionUpdated();
      }, 100);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!reception) return null;

  return (
    <Dialog key={reception.id} open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className="max-w-2xl" 
        onInteractOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault();
            return;
          }
          // Add small delay to prevent focus issues
          setTimeout(() => {
            handleOpenChange(false);
          }, 0);
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) {
            e.preventDefault();
            return;
          }
          setTimeout(() => {
            handleOpenChange(false);
          }, 0);
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Penerimaan Barang</DialogTitle>
          <DialogDescription>
            Perbarui data penerimaan barang untuk{" "}
            {reception.purchaseRequest?.requestNumber || "item ini"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Nomor Permintaan</Label>
              <Input
                value={reception.purchaseRequest?.requestNumber || "-"}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label>Nama Barang</Label>
              <Input
                value={reception.itemName}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Jumlah Diminta</Label>
              <Input
                value={`${reception.requestedQuantity} ${reception.unit}`}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receivedQuantity">Jumlah Diterima *</Label>
              <Input
                id="receivedQuantity"
                type="number"
                value={formData.receivedQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    receivedQuantity: Number.parseInt(e.target.value) || 0,
                  })
                }
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label>Satuan</Label>
              <Input
                value={reception.unit}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="receiptDate">Tanggal Diterima *</Label>
              <Input
                id="receiptDate"
                type="date"
                value={formData.receiptDate}
                onChange={(e) =>
                  setFormData({ ...formData, receiptDate: e.target.value })
                }
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status Penerimaan *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "COMPLETE" | "PARTIAL" | "DIFFERENT") =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isSubmitting}
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
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Catatan tambahan (opsional)"
              disabled={isSubmitting}
            />
          </div>

          {/* Status info */}
          <div className="p-4 border rounded-md bg-muted/50">
            <div className="text-sm">
              <div className="font-medium mb-2">Informasi Tambahan:</div>
              <div className="space-y-1 text-muted-foreground">
                <div>• Persentase diterima: {reception.requestedQuantity > 0 ? Math.round((formData.receivedQuantity / reception.requestedQuantity) * 100) : 0}%</div>
                {reception.item && (
                  <div>• Stok inventory saat ini: {reception.item.stock} {reception.item.unit}</div>
                )}
                {reception.purchaseRequest?.requestedBy && (
                  <div>• Diminta oleh: {reception.purchaseRequest.requestedBy.name}</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
