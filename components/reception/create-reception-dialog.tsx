"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interface untuk data Purchase Request dari API
interface PurchaseRequestOption {
  id: string;
  requestNumber: string;
  itemName: string;
  quantity: number;
  unit: string;
  itemId?: string | null;
}

// Interface untuk props komponen utama
interface CreateReceptionDialogProps {
  onReceptionCreated: () => void;
}

// Komponen Dialog untuk menambah item baru ke inventory
function AddInventoryDialog({
  open,
  onOpenChange,
  defaultName,
  defaultUnit,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  defaultUnit: string;
  onCreated: (item: Record<string, unknown>) => void;
}) {
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setError("Kategori wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: defaultName,
          unit: defaultUnit,
          category,
          stock: 0,
          minStock: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambah item ke inventory.");
      }

      const newItem = await response.json();
      toast({
        title: "Sukses",
        description: "Barang baru berhasil ditambahkan ke inventory.",
      });
      onCreated(newItem);
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Barang ke Inventory</DialogTitle>
          <DialogDescription>
            Barang ini belum ada di inventory. Silakan lengkapi data berikut.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nama Barang</Label>
            <Input value={defaultName} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Satuan</Label>
            <Input value={defaultUnit} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Kategori *</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Contoh: Alat Tulis Kantor"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan ke Inventory
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Komponen utama: Dialog untuk mencatat penerimaan barang
export function CreateReceptionDialog({ onReceptionCreated }: CreateReceptionDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestOption[]>([]);
  const [newReception, setNewReception] = useState({
    itemName: "",
    requestedQuantity: 0,
    receivedQuantity: 0,
    unit: "",
    receiptDate: new Date().toISOString().split('T')[0],
    notes: "",
    status: "COMPLETE" as "COMPLETE" | "PARTIAL" | "DIFFERENT",
    purchaseRequestId: "",
    itemId: undefined as string | undefined,
  });

  // Function untuk fetch purchase requests yang tersedia
  const fetchAvailablePurchaseRequests = useCallback(() => {
    fetch("/api/purchase-requests/available")
      .then((res) => res.json())
      .then((data) => setPurchaseRequests(data.purchaseRequests || []))
      .catch(() => {
        toast({
          title: "Error",
          description: "Gagal memuat data permintaan pembelian.",
          variant: "destructive",
        });
        setPurchaseRequests([]);
      });
  }, [toast]);

  // Fetch data purchase request yang sudah di-approve tapi belum ada receptionnya
  useEffect(() => {
    if (isOpen) {
      fetchAvailablePurchaseRequests();
    }
  }, [isOpen, fetchAvailablePurchaseRequests]);

  // Handler saat memilih purchase request
  const handlePurchaseRequestSelect = (requestId: string) => {
    const selected = purchaseRequests.find((pr) => pr.id === requestId);
    if (selected) {
      setNewReception((prev) => ({
        ...prev,
        purchaseRequestId: requestId,
        itemName: selected.itemName,
        requestedQuantity: selected.quantity,
        receivedQuantity: selected.quantity, // Default samakan dengan yang diminta
        unit: selected.unit,
        itemId: selected.itemId || undefined,
      }));
      // Jika itemId belum ada, tampilkan tombol tambah inventory
      setShowAddInventory(!selected.itemId);
    }
  };

  // Handler setelah item baru berhasil ditambahkan ke inventory
  const handleInventoryCreated = async (newItem: Record<string, unknown>) => {
    if (!newReception.purchaseRequestId) return;

    try {
      // Get item ID with proper type checking
      const itemId = typeof newItem.id === 'string' ? newItem.id : String(newItem.id || '');
      
      // 2. PATCH purchase request dengan itemId baru
      const response = await fetch(`/api/purchase-requests/${newReception.purchaseRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: itemId }),
      });

      if (!response.ok) {
        throw new Error("Gagal update purchase request dengan inventory ID baru.");
      }

      // 3. Update state form penerimaan
      setNewReception((prev) => ({ ...prev, itemId }));
      setShowAddInventory(false);

      toast({
        title: "Sukses",
        description: "Inventory baru berhasil ditambahkan dan terhubung.",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // Handler untuk submit form penerimaan
  const handleAddReception = async () => {
    // 4. Validasi sebelum submit
    if (!newReception.itemId) {
      toast({
        title: "Validasi Gagal",
        description: "Barang harus terhubung dengan inventory sebelum disimpan.",
        variant: "destructive",
      });
      return;
    }
    if (!newReception.receiptDate || newReception.receivedQuantity <= 0) {
        toast({
            title: "Validasi Gagal",
            description: "Tanggal diterima dan jumlah diterima wajib diisi.",
            variant: "destructive",
        })
        return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newReception,
          receiptDate: new Date(newReception.receiptDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mencatat penerimaan barang.");
      }
      
      // 5. Reset form dan tutup dialog
      toast({
        title: "Sukses",
        description: "Penerimaan barang berhasil dicatat.",
      });
      setIsOpen(false);
      resetForm();
      onReceptionCreated();
      // Refresh available purchase requests untuk dialog berikutnya
      fetchAvailablePurchaseRequests();

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
  
  const resetForm = () => {
    setNewReception({
        itemName: "",
        requestedQuantity: 0,
        receivedQuantity: 0,
        unit: "",
        receiptDate: new Date().toISOString().split('T')[0],
        notes: "",
        status: "COMPLETE",
        purchaseRequestId: "",
        itemId: undefined,
    });
    setShowAddInventory(false);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Catat Penerimaan
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Catat Penerimaan Barang</DialogTitle>
            <DialogDescription>
              Pilih permintaan pembelian yang sudah disetujui untuk mencatat penerimaan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="purchaseRequest">Permintaan Pembelian *</Label>
              <Select
                value={newReception.purchaseRequestId}
                onValueChange={handlePurchaseRequestSelect}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Permintaan Pembelian" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseRequests.map((pr) => (
                    <SelectItem key={pr.id} value={pr.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{pr.requestNumber}</span>
                        <span className="text-sm text-muted-foreground">
                          {pr.itemName} ({pr.quantity} {pr.unit})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {newReception.purchaseRequestId && (
              <>
                {showAddInventory && (
                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-md">
                      <p className="font-semibold text-yellow-800">Barang Belum Terdaftar</p>
                      <p className="text-sm text-yellow-700">
                          Barang ini belum terdaftar di inventory. Klik tombol di bawah untuk menambahkannya.
                      </p>
                      <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowAddInventory(true)}
                      >
                          Tambah ke Inventory
                      </Button>
                  </div>
                )}

                {!showAddInventory && newReception.itemId && (
                     <div className="p-3 border-l-4 border-green-500 bg-green-50 rounded-md">
                        <p className="font-semibold text-green-800">
                            Barang sudah terhubung ke inventory.
                        </p>
                     </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nama Barang</Label>
                    <Input value={newReception.itemName} disabled />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="receiptDate">Tanggal Diterima *</Label>
                    <Input
                      id="receiptDate"
                      type="date"
                      value={newReception.receiptDate}
                      onChange={(e) => setNewReception({ ...newReception, receiptDate: e.target.value })}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label>Jumlah Diminta</Label>
                    <Input value={newReception.requestedQuantity} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="receivedQuantity">Jumlah Diterima *</Label>
                    <Input
                      id="receivedQuantity"
                      type="number"
                      value={newReception.receivedQuantity}
                      onChange={(e) =>
                        setNewReception({
                          ...newReception,
                          receivedQuantity: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Satuan</Label>
                    <Input value={newReception.unit} disabled />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="status">Status Penerimaan</Label>
                    <Select
                      value={newReception.status}
                      onValueChange={(value: "COMPLETE" | "PARTIAL" | "DIFFERENT") =>
                        setNewReception({ ...newReception, status: value })
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
                    value={newReception.notes}
                    onChange={(e) => setNewReception({ ...newReception, notes: e.target.value })}
                    placeholder="Catatan tambahan (opsional)"
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddReception}
              disabled={isSubmitting || !newReception.itemId}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Penerimaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog untuk menambah inventory baru */}
      <AddInventoryDialog
        open={showAddInventory && !newReception.itemId}
        onOpenChange={setShowAddInventory}
        defaultName={newReception.itemName}
        defaultUnit={newReception.unit}
        onCreated={handleInventoryCreated}
      />
    </>
  );
}