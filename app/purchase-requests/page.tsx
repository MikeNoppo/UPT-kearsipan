import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PurchaseRequestsClient } from "@/components/purchase-requests/purchase-requests-client"

/**
 * Purchase Requests Page - Halaman permintaan pembelian barang (Server Side)
 * 
 * Fungsi utama:
 * - Mengelola permintaan pembelian barang untuk keperluan UPT
 * - Staff dapat mengajukan permintaan barang baru
 * - Administrator dan Staff dapat menyetujui atau menolak permintaan
 * - Tracking status permintaan dari pending hingga approved/rejected
 * 
 * Alur kerja permintaan:
 * 1. Staff membuat permintaan dengan detail barang dan alasan
 * 2. Permintaan masuk status PENDING
 * 3. Administrator atau Staff lain dapat review dan beri keputusan (APPROVED/REJECTED)
 * 4. Jika disetujui, permintaan dapat diproses ke tahap penerimaan
 * 
 * Fitur yang tersedia:
 * - Form permintaan barang dengan validasi
 * - Review dan approval system untuk admin dan staff
 * - Status tracking dengan badge visual
 * - Catatan dan alasan untuk setiap permintaan
 * - History lengkap permintaan dengan timestamp
 */

export default function PurchaseRequestsPage() {
  return (
    <DashboardLayout>
      <PurchaseRequestsClient />
    </DashboardLayout>
  )
}
