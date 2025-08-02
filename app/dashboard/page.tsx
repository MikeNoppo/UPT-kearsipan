"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Download, Upload, Archive, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"

interface Activity {
  title: string
  description: string
  status?: string
  color?: string
}

interface DashboardActivities {
  inventoryActivities: Activity[]
  letterArchiveActivities: Activity[]
}

/**
 * Dashboard Page - Halaman utama dashboard setelah login
 * 
 * Fungsi utama:
 * - Menampilkan ringkasan statistik sistem kearsipan UPT dalam bentuk kartu-kartu
 * - Menampilkan aktivitas terbaru untuk inventaris dan surat/arsip
 * - Memberikan navigasi cepat ke berbagai modul sistem
 * 
 * Statistik yang ditampilkan:
 * - Permintaan barang yang masih pending
 * - Barang yang diterima dan keluar bulan ini
 * - Total inventaris aktif
 * - Surat masuk dan keluar bulan ini
 * - Status arsip (permanen dan yang dijadwalkan musnah)
 * 
 * Aktivitas yang dipantau:
 * - Alur kerja inventaris (status permintaan dan penerimaan)
 * - Aktivitas surat dan arsip yang memerlukan perhatian
 */
export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [activities, setActivities] = useState<DashboardActivities | null>(null)
  const [loading, setLoading] = useState(true)

  // Memuat data dashboard saat komponen dimount atau session berubah
  useEffect(() => {
    if (session) {
      fetchStats()
      fetchActivities()
    }
  }, [session])

  // Mengambil data statistik dashboard dari API
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mengambil data aktivitas terbaru dari API
  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/dashboard/activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      } else {
        console.error('Failed to fetch activities')
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  if (!session || loading) {
    return <div>Loading...</div>
  }

  // Fungsi untuk mengkonversi status enum ke teks yang dapat dibaca
  const getStatusText = (status?: string) => {
    if (!status) return ''
    switch (status) {
      case 'PENDING': return 'Pending'
      case 'APPROVED': return 'Disetujui'
      case 'REJECTED': return 'Ditolak'
      case 'COMPLETE': return 'Selesai'
      case 'PARTIAL': return 'Sebagian'
      case 'DIFFERENT': return 'Berbeda'
      case 'PERMANENT': return 'Permanen'
      case 'SCHEDULED_DESTRUCTION': return 'Dijadwalkan Musnah'
      case 'UNDER_REVIEW': return 'Dalam Review'
      case 'NEEDS_DOCUMENT': return 'Perlu Dokumen'
      case 'NEEDS_REVIEW': return 'Perlu Review'
      default: return status
    }
  }

  // Konfigurasi kartu-kartu statistik yang akan ditampilkan di dashboard
  const statsConfig = [
    {
      title: "Permintaan Pending",
      value: stats?.pendingRequests?.toString() || "0",
      description: "Menunggu persetujuan",
      icon: ShoppingCart,
      color: "text-orange-500",
      href: "/purchase-requests",
    },
    {
      title: "Barang Diterima",
      value: stats?.receivedThisMonth?.toString() || "0",
      description: "Bulan ini",
      icon: TrendingUp,
      color: "text-green-500",
      href: "/reception",
    },
    {
      title: "Barang Keluar",
      value: stats?.distributedThisMonth?.toString() || "0",
      description: "Bulan ini",
      icon: TrendingDown,
      color: "text-blue-500",
      href: "/distribution",
    },
    {
      title: "Total Inventaris",
      value: stats?.totalInventory?.toString() || "0",
      description: "Item aktif",
      icon: Package,
      color: "text-purple-500",
      href: "/inventory",
    },
    {
      title: "Surat Masuk",
      value: stats?.incomingLettersThisMonth?.toString() || "0",
      description: "Bulan ini",
      icon: Download,
      color: "text-cyan-500",
      href: "/correspondence",
    },
    {
      title: "Surat Keluar",
      value: stats?.outgoingLettersThisMonth?.toString() || "0",
      description: "Bulan ini",
      icon: Upload,
      color: "text-indigo-500",
      href: "/correspondence",
    },
    {
      title: "Arsip Permanen",
      value: stats?.permanentArchives?.toString() || "0",
      description: "Total dokumen",
      icon: Archive,
      color: "text-gray-500",
      href: "/archive-inventory",
    },
    {
      title: "Arsip Musnah",
      value: stats?.scheduledDestructionArchives?.toString() || "0",
      description: "Dijadwalkan",
      icon: Archive,
      color: "text-red-500",
      href: "/archive-inventory",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang, {session.user.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsConfig.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  <Link 
                    href={stat.href} 
                    className="text-xs text-black hover:text-gray-600 hover:underline flex items-center gap-1"
                  >
                    detail
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Alur Kerja Inventaris</CardTitle>
              <CardDescription>Status permintaan dan penerimaan barang terbaru</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities && activities.inventoryActivities && activities.inventoryActivities.length > 0 ? (
                  activities.inventoryActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title} - {getStatusText(activity.status)}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Tidak ada aktivitas terbaru</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Surat & Arsip</CardTitle>
              <CardDescription>Dokumen dan arsip yang perlu perhatian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities && activities.letterArchiveActivities && activities.letterArchiveActivities.length > 0 ? (
                  activities.letterArchiveActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Tidak ada aktivitas terbaru</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
