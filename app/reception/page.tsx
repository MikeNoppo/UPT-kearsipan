import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionClient } from "@/components/reception/reception-client"

/**
 * Reception Page - Halaman penerimaan barang (Server Side)
 * 
 * Fungsi utama:
 * - Mencatat penerimaan barang yang telah dipesan
 * - Memverifikasi kesesuaian antara barang yang dipesan vs diterima
 * - Update stok inventaris secara otomatis setelah penerimaan
 * - Tracking supplier dan tanggal penerimaan
 * 
 * Status penerimaan yang dikelola:
 * - COMPLETE: Barang diterima sesuai jumlah yang dipesan
 * - PARTIAL: Barang diterima lebih sedikit dari yang dipesan
 * - DIFFERENT: Barang yang diterima berbeda dengan yang dipesan
 * 
 * Fitur yang tersedia:
 * - Form penerimaan barang dengan detail lengkap
 * - Validasi quantity yang diterima vs yang diminta
 * - Integrasi dengan inventory untuk update stok otomatis
 * - Statistik penerimaan (completion rate, dll)
 * - Pencarian dan filter penerimaan
 * - Catatan untuk setiap penerimaan barang
 */

export default function ReceptionPage() {
  return (
    <DashboardLayout>
      <ReceptionClient />
    </DashboardLayout>
  )
}
