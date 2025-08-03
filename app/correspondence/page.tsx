import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CorrespondenceClient } from "@/components/correspondence"
export default function CorrespondencePage() {
  return (
    <DashboardLayout>
      <CorrespondenceClient
        initialLetters={[]}
        initialStats={null}
        initialPagination={{
          currentPage: 1,
          totalPages: 1
        }}
      />
    </DashboardLayout>
  )
}


