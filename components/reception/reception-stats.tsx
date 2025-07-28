"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, CheckCircle, AlertCircle } from "lucide-react"

interface ReceptionStats {
  totalReceptions: number
  completeReceptions: number
  partialReceptions: number
  differentReceptions: number
  completionRate: number
}

interface ReceptionStatsProps {
  stats: ReceptionStats
}

const ReceptionStatsCards = memo(function ReceptionStatsCards({ stats }: ReceptionStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Penerimaan</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats.totalReceptions}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lengkap</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats.completeReceptions}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completionRate}% completion rate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sebagian</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats.partialReceptions}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Berbeda</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats.differentReceptions}</div>
        </CardContent>
      </Card>
    </div>
  )
})

export { ReceptionStatsCards }
