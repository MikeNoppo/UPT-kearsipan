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
  items?: { id:string; itemName:string; quantity:number; unit:string; itemId?:string | null }[];
  isMulti?: boolean;
  totalQuantity?: number;
  requestedBy: {
    id: string;
    name: string;
    username: string;
  };
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
    items: [] as {purchaseRequestItemId?:string; itemName:string; requestedQuantity:number; receivedQuantity:number; unit:string; itemId?:string}[],
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
    if (!selected) return;
    if (selected.items && selected.items.length > 0) {
      // multi-item path
      setNewReception(prev => ({
        ...prev,
        purchaseRequestId: requestId,
        itemName: '',
        requestedQuantity: 0,
        receivedQuantity: 0,
        unit: '',
        itemId: undefined,
  items: selected.items!.map(it => ({
          purchaseRequestItemId: it.id,
          itemName: it.itemName,
          requestedQuantity: it.quantity,
          receivedQuantity: it.quantity,
          unit: it.unit,
          itemId: it.itemId || undefined,
        })),
      }))
      setShowAddInventory(false)
    } else {
      // legacy single item
      setNewReception(prev => ({
        ...prev,
        purchaseRequestId: requestId,
        itemName: selected.itemName,
        requestedQuantity: selected.quantity,
        receivedQuantity: selected.quantity,
        unit: selected.unit,
        itemId: selected.itemId || undefined,
        items: [],
      }))
      setShowAddInventory(!selected.itemId)
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
    const isMulti = newReception.items.length > 0
    if (!isMulti) {
      if (!newReception.itemId) {
        toast({ title: 'Validasi Gagal', description: 'Barang harus terhubung dengan inventory sebelum disimpan.', variant: 'destructive' }); return;
      }
    } else {
      // validasi setiap item multi
      if (newReception.items.some(i => i.receivedQuantity < 0)) {
        toast({ title: 'Validasi Gagal', description: 'Jumlah diterima tidak boleh negatif.', variant: 'destructive' }); return;
      }
      if (newReception.items.every(i => i.receivedQuantity === 0)) {
        toast({ title: 'Validasi Gagal', description: 'Minimal satu item memiliki jumlah diterima > 0.', variant: 'destructive' }); return;
      }
    }
    // Untuk multi-item kita tidak wajibkan receiptDate karena backend default now().
    if (!isMulti) {
      if (!newReception.receiptDate || newReception.receivedQuantity <= 0) {
        toast({
          title: 'Validasi Gagal',
          description: 'Tanggal diterima dan jumlah diterima wajib diisi.',
          variant: 'destructive'
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const isMultiNow = newReception.items.length > 0;
      const payload: any = {
        status: newReception.status,
        notes: newReception.notes || undefined,
      };
      if (newReception.purchaseRequestId) payload.purchaseRequestId = newReception.purchaseRequestId;
      if (isMultiNow) {
        payload.items = newReception.items.map(i => ({
          purchaseRequestItemId: i.purchaseRequestItemId,
          itemName: i.itemName,
          requestedQuantity: i.requestedQuantity,
          receivedQuantity: i.receivedQuantity,
          unit: i.unit,
          itemId: i.itemId,
        }));
      } else {
        payload.itemId = newReception.itemId;
        payload.itemName = newReception.itemName;
        payload.requestedQuantity = newReception.requestedQuantity;
        payload.receivedQuantity = newReception.receivedQuantity;
        payload.unit = newReception.unit;
        payload.receiptDate = newReception.receiptDate ? new Date(newReception.receiptDate).toISOString() : undefined;
      }
      const response = await fetch('/api/reception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detail = errorData.details && errorData.details[0]?.message ? `: ${errorData.details[0].message}` : ''
        throw new Error((errorData.error || 'Gagal mencatat penerimaan barang') + detail);
      }
      
      // 5. Reset form dan tutup dialog
      toast({
        title: "Sukses",
        description: "Penerimaan barang berhasil dicatat.",
      });
      
      // Delay closing and refresh to ensure proper cleanup
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
        onReceptionCreated();
        // Refresh available purchase requests untuk dialog berikutnya
        fetchAvailablePurchaseRequests();
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
    items: [],
    });
    setShowAddInventory(false);
  }

  // Handle dialog open/close properly
  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting) {
      setTimeout(() => {
        setIsOpen(open);
        if (!open) {
          resetForm();
        }
      }, 0);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Catat Penerimaan
          </Button>
        </DialogTrigger>
  <DialogContent className="max-w-3xl">
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
                  <SelectValue placeholder="Pilih Permintaan Pembelian">
                    {newReception.purchaseRequestId && (
                      <span>
                        {purchaseRequests.find(pr => pr.id === newReception.purchaseRequestId)?.itemName || "Pilih Permintaan Pembelian"}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {purchaseRequests.map((pr) => (
                    <SelectItem key={pr.id} value={pr.id}>
                      <div className="flex flex-col">
                        {pr.items && pr.items.length > 0 ? (
                          <span className="font-medium">{pr.requestNumber} • {pr.items.length} barang (Total {pr.items.reduce((a,i)=>a+i.quantity,0)})</span>
                        ) : (
                          <span className="font-medium">{pr.itemName} ({pr.quantity} {pr.unit})</span>
                        )}
                        <span className="text-xs text-muted-foreground">Diminta oleh: {pr.requestedBy.name} (@{pr.requestedBy.username})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {newReception.purchaseRequestId && (
              <>
                {showAddInventory && newReception.items.length === 0 && (
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
                {!showAddInventory && newReception.itemId && newReception.items.length === 0 && (
                     <div className="p-3 border-l-4 border-green-500 bg-green-50 rounded-md">
                        <p className="font-semibold text-green-800">
                            Barang sudah terhubung ke inventory.
                        </p>
                     </div>
                )}
                {newReception.items.length === 0 && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-2">
                    <Label>Nama Barang</Label>
                    <Input value={newReception.itemName} disabled />
                  </div>
                </div> )}

                {newReception.items.length === 0 && (
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
                </div> )}

                {newReception.items.length > 0 && (
                  <div className="space-y-4">
                    <div className="border rounded p-3 max-h-72 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left">
                            <th className="py-1">Nama</th>
                            <th className="py-1 w-20">Diminta</th>
                            <th className="py-1 w-24">Diterima</th>
                            <th className="py-1 w-20">Unit</th>
                            <th className="py-1 w-32">Inventory</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newReception.items.map((it, idx) => (
                            <tr key={it.purchaseRequestItemId || idx} className="border-t">
                              <td className="py-1 pr-2">{it.itemName}</td>
                              <td className="py-1 pr-2">{it.requestedQuantity}</td>
                              <td className="py-1 pr-2">
                                <Input type="number" className="h-8" value={it.receivedQuantity} onChange={e=>{
                                  const val = Number(e.target.value)||0; setNewReception(prev=>({...prev, items: prev.items.map((x,i)=> i===idx?{...x, receivedQuantity: val}:x)}))
                                }} />
                              </td>
                              <td className="py-1 pr-2">{it.unit}</td>
                              <td className="py-1 pr-2 text-xs">
                                {it.itemId ? 'Terhubung' : <Button type="button" variant="outline" size="sm" onClick={()=>{
                                  // Trigger add inventory dialog for this row
                                  setShowAddInventory(true);
                                  setNewReception(prev=>({...prev, itemName: it.itemName, unit: it.unit}))
                                }}>Tambah</Button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
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
              disabled={isSubmitting || (newReception.items.length === 0 && !newReception.itemId)}
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