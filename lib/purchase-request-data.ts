import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export interface PurchaseRequestOption {
  id: string
  itemName: string
  quantity: number
  unit: string
}

export async function getApprovedPurchaseRequests(): Promise<PurchaseRequestOption[]> {
  const session = await getServerSession(authOptions)
  if (!session) return []

  const requests = await prisma.purchaseRequest.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      itemName: true,
      quantity: true,
      unit: true,
    },
  })
  return requests
}
