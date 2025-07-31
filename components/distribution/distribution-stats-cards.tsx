import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FileText, Calendar, Package } from "lucide-react"

interface DistributionStats {
  totalDistributions: number
  recentDistributions: number
  totalQuantityDistributed: number
}

interface DistributionStatsCardsProps {
  stats: DistributionStats | null
}

export function DistributionStatsCards({ stats }: DistributionStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Distribusi</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats?.totalDistributions || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Distribusi Bulan Ini</CardTitle>
          <Calendar className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats?.recentDistributions || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Barang Terdistribusi</CardTitle>
          <Package className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats?.totalQuantityDistributed || 0}</div>
        </CardContent>
      </Card>
    </div>
  )
}
