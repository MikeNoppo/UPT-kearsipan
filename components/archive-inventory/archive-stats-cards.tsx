import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Archive as ArchiveIcon, Calendar, AlertTriangle, CheckCircle } from "lucide-react"

interface ArchiveStats {
  totalArchives: number
  activeArchives: number
  expiredArchives: number
  destroyedArchives: number
  recentArchives: number
}

interface ArchiveStatsCardsProps {
  stats: ArchiveStats | null
}

export function ArchiveStatsCards({ stats }: ArchiveStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Arsip</CardTitle>
          <ArchiveIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats?.totalArchives || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Arsip Aktif</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats?.activeArchives || 0}</div>
          <p className="text-xs text-muted-foreground">Masih dalam masa retensi</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Arsip Kadaluarsa</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats?.expiredArchives || 0}</div>
          <p className="text-xs text-muted-foreground">Lewat masa retensi</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
          <Calendar className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats?.recentArchives || 0}</div>
          <p className="text-xs text-muted-foreground">Arsip baru ditambahkan</p>
        </CardContent>
      </Card>
    </div>
  )
}
