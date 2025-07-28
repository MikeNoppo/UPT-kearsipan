import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Check } from "lucide-react"

interface PurchaseRequest {
  id: string
  status: "PENDING" | "APPROVED" | "REJECTED"
}

interface StatsCardsProps {
  requests: PurchaseRequest[]
}

export function StatsCards({ requests }: StatsCardsProps) {
  const totalRequests = requests.length
  const pendingRequests = requests.filter((r) => r.status === "PENDING").length
  const approvedRequests = requests.filter((r) => r.status === "APPROVED").length

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Permintaan</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{totalRequests}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{pendingRequests}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
          <Check className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{approvedRequests}</div>
        </CardContent>
      </Card>
    </div>
  )
}
