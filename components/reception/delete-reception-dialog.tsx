"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface DeleteReceptionDialogProps {
  reception: Reception | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceptionDeleted: () => void;
}

export function DeleteReceptionDialog({
  reception,
  open,
  onOpenChange,
  onReceptionDeleted,
}: DeleteReceptionDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setDeleting] = useState(false);

  // Cleanup effect saat component unmount atau dialog close
  useEffect(() => {
    if (!open && isDeleting) {
      setDeleting(false);
    }
  }, [open, isDeleting]);

  // Handle dialog close properly
  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      setTimeout(() => {
        onOpenChange(newOpen);
      }, 0);
    }
  };

  // Handle cancel button
  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isDeleting) {
      setTimeout(() => {
        onOpenChange(false);
      }, 0);
    }
  };

  const handleDelete = async () => {
    if (!reception) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/reception?id=${reception.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus penerimaan barang.");
      }

      toast({
        title: "Sukses",
        description: "Penerimaan barang berhasil dihapus.",
      });
      
      // Delay closing to ensure proper cleanup
      setTimeout(() => {
        onOpenChange(false);
        onReceptionDeleted();
      }, 100);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!reception) return null;

  return (
    <AlertDialog key={reception.id} open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Penerimaan Barang</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Apakah Anda yakin ingin menghapus penerimaan barang ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="p-4 border rounded-md bg-muted/50">
                <div className="text-sm space-y-1">
                  <p><strong>Nomor Permintaan:</strong> {reception.purchaseRequest?.requestNumber || "-"}</p>
                  <p><strong>Nama Barang:</strong> {reception.itemName}</p>
                  <p><strong>Jumlah Diterima:</strong> {reception.receivedQuantity} {reception.unit}</p>
                  <p><strong>Status:</strong> {
                    reception.status === 'COMPLETE' ? 'Lengkap' :
                    reception.status === 'PARTIAL' ? 'Sebagian' : 'Berbeda'
                  }</p>
                  <p><strong>Tanggal:</strong> {new Date(reception.receiptDate).toLocaleDateString("id-ID")}</p>
                </div>
              </div>
              
              {reception.status === 'COMPLETE' && reception.item && (
                <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Peringatan:</strong> Stok inventory akan dikurangi sebesar {reception.receivedQuantity} {reception.unit}
                    {reception.purchaseRequest && " dan status permintaan pembelian akan dikembalikan ke 'Disetujui'."}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
