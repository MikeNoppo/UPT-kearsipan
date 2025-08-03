import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading correspondence data...</span>
      </div>
    </DashboardLayout>
  )
}
