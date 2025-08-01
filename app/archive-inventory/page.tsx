import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ArchiveInventoryClient } from "@/components/archive-inventory"
import type { Archive, ArchiveStats } from "@/types/archive"

/**
 * Archive Inventory Page - Halaman inventarisasi arsip (SSR)
 * 
 * Fungsi utama:
 * - Mengelola inventarisasi dokumen arsip UPT
 * - Tracking masa retensi dokumen dan jadwal pemusnahan
 * - Kategorisasi dokumen berdasarkan jenis dan nilai guna
 * - Monitoring status arsip berdasarkan retention period
 * 
 * Status arsip yang dikelola (computed from retention logic):
 * - Active: Arsip masih dalam masa retensi aktif
 * - Near Expiry: Arsip mendekati batas masa retensi (30 hari)
 * - Expired: Arsip telah melewati masa retensi
 * - Destroyed: Arsip telah dimusnahkan secara fisik
 * 
 * Fitur yang tersedia:
 * - CRUD operations untuk data arsip
 * - Sistem kode arsip untuk klasifikasi
 * - Penentuan masa retensi berdasarkan kategori dokumen
 * - Kalkulasi otomatis status berdasarkan tanggal dan retention period
 * - Filter berdasarkan kategori dan retention status
 * - Search berdasarkan kode atau judul arsip
 * - Statistik arsip per kategori dan retention status
 * - Alert untuk arsip yang mendekati masa expired
 * 
 * Arsitektur:
 * - SSR untuk performance dan SEO
 * - Modular component architecture
 * - Client-side interactivity untuk UI
 * - Server-side data fetching untuk initial load
 */

export const metadata = {
  title: "Inventaris Arsip - UPT Kearsipan",
  description: "Kelola inventaris dokumen arsip dengan sistem retensi dan tracking masa pemusnahan"
}

// Fetch initial data server-side
async function getInitialData() {
  try {
    // Fetch archives with default parameters
    const archivesResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/archives?page=1&limit=10`, {
      cache: 'no-store'
    })
    
    // Fetch statistics  
    const statsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/archives/stats?period=month`, {
      cache: 'no-store'
    })

    const [archivesData, statsData] = await Promise.all([
      archivesResponse.ok ? archivesResponse.json() : { archives: [], pagination: { pages: 1 } },
      statsResponse.ok ? statsResponse.json() : null
    ])

    return {
      archives: archivesData.archives as Archive[],
      stats: statsData as ArchiveStats | null,
      totalPages: archivesData.pagination.pages
    }
  } catch (error) {
    console.error('Failed to fetch initial data:', error)
    return {
      archives: [] as Archive[],
      stats: null as ArchiveStats | null,
      totalPages: 1
    }
  }
}

export default async function ArchiveInventoryPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const { archives, stats, totalPages } = await getInitialData()

  return (
    <DashboardLayout>
      <ArchiveInventoryClient
        initialArchives={archives}
        initialStats={stats}
        initialTotalPages={totalPages}
      />
    </DashboardLayout>
  )
}
