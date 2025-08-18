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

interface PurchaseRequestItem { id: string; itemName: string; quantity: number; unit: string }
interface PurchaseRequest {
  id: string
  requestNumber: string
  itemName: string
  quantity: number
  unit: string
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED"
  notes?: string
  requestDate: string
  reviewDate?: string
  createdAt: string
  updatedAt: string
  requestedBy: { id: string; name: string; username: string }
  reviewedBy?: { id: string; name: string; username: string }
  item?: { id: string; name: string; category: string; stock: number }
  items?: PurchaseRequestItem[]
}

interface DeletePurchaseRequestDialogProps {
  purchaseRequest: PurchaseRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestDeleted: () => void;
}

export function DeletePurchaseRequestDialog({
  purchaseRequest,
  open,
  onOpenChange,
  onRequestDeleted,
}: DeletePurchaseRequestDialogProps) {
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
    if (!purchaseRequest) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/purchase-requests?id=${purchaseRequest.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus permintaan pembelian.");
      }

      toast({
        title: "Sukses",
        description: "Permintaan pembelian berhasil dihapus.",
      });
      
      // Delay closing to ensure proper cleanup
      setTimeout(() => {
        onOpenChange(false);
        onRequestDeleted();
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

  if (!purchaseRequest) return null;

  const canDelete = ['PENDING', 'REJECTED', 'APPROVED'].includes(purchaseRequest.status);

  return (
    <AlertDialog key={purchaseRequest.id} open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Permintaan Pembelian</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Apakah Anda yakin ingin menghapus permintaan pembelian ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="p-4 border rounded-md bg-muted/50">
                <div className="text-sm space-y-1">
                  <p><strong>Nomor Permintaan:</strong> {purchaseRequest.requestNumber}</p>
                  <p><strong>Nama Barang:</strong> {purchaseRequest.itemName}</p>
                  <p><strong>Jumlah:</strong> {purchaseRequest.quantity} {purchaseRequest.unit}</p>
                  <p><strong>Status:</strong> {
                    purchaseRequest.status === 'PENDING' ? 'Menunggu' :
                    purchaseRequest.status === 'APPROVED' ? 'Disetujui' :
                    purchaseRequest.status === 'REJECTED' ? 'Ditolak' : 'Diterima'
                  }</p>
                  <p><strong>Diminta oleh:</strong> {purchaseRequest.requestedBy.name}</p>
                  <p><strong>Tanggal:</strong> {new Date(purchaseRequest.createdAt).toLocaleDateString("id-ID")}</p>
                </div>
              </div>
              
              {!canDelete && (
                <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Tidak dapat dihapus:</strong> Hanya permintaan dengan status "Menunggu", "Ditolak", atau "Disetujui" yang dapat dihapus.
                  </p>
                </div>
              )}

              {canDelete && purchaseRequest.status === 'PENDING' && (
                <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Peringatan:</strong> Permintaan ini masih dalam status menunggu persetujuan.
                  </p>
                </div>
              )}

              {canDelete && purchaseRequest.status === 'APPROVED' && (
                <div className="p-3 border-l-4 border-orange-500 bg-orange-50 rounded-md">
                  <p className="text-sm text-orange-800">
                    <strong>Perhatian:</strong> Permintaan ini sudah disetujui. Penghapusan akan membatalkan persetujuan yang telah diberikan.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || !canDelete}
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
