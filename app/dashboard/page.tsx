"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Download, Upload, Archive, TrendingUp, TrendingDown } from "lucide-react"

interface User {
  username: string
  role: string
  name: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))
    fetchStats()
  }, [router])

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

  if (!user || loading) {
    return <div>Loading...</div>
  }

  const statsConfig = [
    {
      title: "Permintaan Pending",
      value: stats?.pendingRequests?.toString() || "0",
      description: "Menunggu persetujuan",
      icon: ShoppingCart,
      color: "text-orange-500",
    },
    {
      title: "Barang Diterima",
      value: stats?.receivedThisMonth?.toString() || "0",
      description: "Bulan ini",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Barang Keluar",
      value: stats?.distributedThisMonth?.toString() || "0",
      description: "Bulan ini",
      icon: TrendingDown,
      color: "text-blue-500",
    },
    {
      title: "Total Inventaris",
      value: stats?.totalInventory?.toString() || "0",
      description: "Item aktif",
      icon: Package,
      color: "text-purple-500",
    },
    {
      title: "Surat Masuk",
      value: stats?.incomingLettersThisMonth?.toString() || "0",
      description: "Bulan ini",
      icon: Download,
      color: "text-cyan-500",
    },
    {
      title: "Surat Keluar",
      value: stats?.outgoingLettersThisMonth?.toString() || "0",
      description: "Bulan ini",
      icon: Upload,
      color: "text-indigo-500",
    },
    {
      title: "Arsip Permanen",
      value: stats?.permanentArchives?.toString() || "0",
      description: "Total dokumen",
      icon: Archive,
      color: "text-gray-500",
    },
    {
      title: "Arsip Musnah",
      value: stats?.scheduledDestructionArchives?.toString() || "0",
      description: "Dijadwalkan",
      icon: Archive,
      color: "text-red-500",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang, {user.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsConfig.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
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
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Permintaan kertas A4 - Pending</p>
                    <p className="text-xs text-muted-foreground">Diajukan 2 jam yang lalu</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Penerimaan tinta printer - Selesai</p>
                    <p className="text-xs text-muted-foreground">Diterima 4 jam yang lalu</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Distribusi alat tulis - Selesai</p>
                    <p className="text-xs text-muted-foreground">Diambil 1 hari yang lalu</p>
                  </div>
                </div>
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
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Surat masuk dari Fakultas Teknik</p>
                    <p className="text-xs text-muted-foreground">Perlu upload dokumen</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">45 arsip dijadwalkan musnah</p>
                    <p className="text-xs text-muted-foreground">Review dalam 7 hari</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Arsip permanen diperbarui</p>
                    <p className="text-xs text-muted-foreground">Status dikonfirmasi</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
