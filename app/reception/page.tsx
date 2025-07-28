import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionClient } from "@/components/reception"
import { getReceptions, getReceptionStats, getInventory } from "@/lib/reception-data"

/**
 * Reception Page - Halaman penerimaan barang (Server-Side Rendered)
 * 
 * Dioptimalkan dengan:
 * - Server-side rendering untuk performa yang lebih baik
 * - Modular components untuk maintainability
 * - Pre-fetched data untuk loading yang lebih cepat
 * - Direct database queries untuk efisiensi maksimal
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
 */

export default async function ReceptionPage() {
  // Check authentication on server side
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Parallel data fetching for better performance with direct database queries
  const [receptions, stats, inventory] = await Promise.all([
    getReceptions(),
    getReceptionStats(),
    getInventory(),
  ])

  return (
    <DashboardLayout>
      <ReceptionClient
        initialReceptions={receptions}
        initialStats={stats}
        initialInventory={inventory}
      />
    </DashboardLayout>
  )
}
