import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionClient } from "@/components/reception/reception-client"

/**
 * Reception Page - Halaman penerimaan barang (Server Side)
 * 
 * Fungsi utama:
 * - Mencatat penerimaan barang berdasarkan permintaan pembelian yang telah disetujui
 * - Memverifikasi kesesuaian antara barang yang dipesan dengan barang yang diterima
 * - Memperbarui stok inventaris secara otomatis setelah proses penerimaan
 * - Mengintegrasikan sistem permintaan pembelian untuk pelacakan menyeluruh
 * 
 * Alur kerja penerimaan:
 * 1. Memilih permintaan pembelian yang telah disetujui
 * 2. Sistem mengisi data barang secara otomatis dari permintaan pembelian
 * 3. Memasukkan jumlah barang yang benar-benar diterima
 * 4. Menentukan status penerimaan (Lengkap/Sebagian/Berbeda)
 * 5. Stok inventaris diperbarui secara otomatis
 * 
 * Status penerimaan yang dikelola:
 * - COMPLETE: Barang diterima sesuai dengan jumlah yang dipesan
 * - PARTIAL: Barang diterima dalam jumlah yang kurang dari pesanan
 * - DIFFERENT: Barang yang diterima tidak sesuai dengan spesifikasi pesanan
 * 
 * Fitur yang tersedia:
 * - Formulir penerimaan yang terintegrasi dengan sistem permintaan pembelian
 * - Validasi kuantitas barang yang diterima terhadap jumlah yang diminta
 * - Penautan otomatis ke inventaris atau pembuatan item inventaris baru
 * - Statistik penerimaan barang dan tingkat kelengkapan
 * - Pencarian dan penyaringan data penerimaan
 * - Pencatatan keterangan untuk setiap transaksi penerimaan barang
 */

export default function ReceptionPage() {
  return (
    <DashboardLayout>
      <ReceptionClient />
    </DashboardLayout>
  )
}
