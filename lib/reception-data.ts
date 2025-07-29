import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Reception {
  id: string
  requestId?: string
  itemName: string
  requestedQuantity: number
  receivedQuantity: number
  unit: string
  receiptDate: string
  status: "COMPLETE" | "PARTIAL" | "DIFFERENT"
  notes?: string
  createdAt: string
  updatedAt: string
  receivedBy: {
    id: string
    name: string
    username: string
  }
  item?: {
    id: string
    name: string
    category: string
    stock: number
    unit: string
  }
}

interface ReceptionStats {
  totalReceptions: number
  completeReceptions: number
  partialReceptions: number
  differentReceptions: number
  completionRate: number
}

interface InventoryItem {
  id: string
  name: string
  stock: number
  unit: string
}

export async function getReceptions(): Promise<Reception[]> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return []
  }

  try {
    const receptions = await prisma.reception.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        receivedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            stock: true,
            unit: true,
          },
        },
      },
    })

    return receptions.map(reception => ({
      ...reception,
      requestId: reception.requestId || undefined,
      notes: reception.notes || undefined,
      item: reception.item || undefined,
      receiptDate: reception.receiptDate.toISOString(),
      createdAt: reception.createdAt.toISOString(),
      updatedAt: reception.updatedAt.toISOString(),
    })) as Reception[]
  } catch (error) {
    console.error('Error fetching receptions:', error)
    return []
  }
}

export async function getReceptionStats(): Promise<ReceptionStats> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return {
      totalReceptions: 0,
      completeReceptions: 0,
      partialReceptions: 0,
      differentReceptions: 0,
      completionRate: 0,
    }
  }

  try {
    const [
      totalReceptions,
      completeReceptions,
      partialReceptions,
      differentReceptions,
    ] = await Promise.all([
      prisma.reception.count(),
      prisma.reception.count({ where: { status: 'COMPLETE' } }),
      prisma.reception.count({ where: { status: 'PARTIAL' } }),
      prisma.reception.count({ where: { status: 'DIFFERENT' } }),
    ])

    const completionRate = totalReceptions > 0 
      ? Math.round((completeReceptions / totalReceptions) * 100) 
      : 0

    return {
      totalReceptions,
      completeReceptions,
      partialReceptions,
      differentReceptions,
      completionRate,
    }
  } catch (error) {
    console.error('Error fetching reception stats:', error)
    return {
      totalReceptions: 0,
      completeReceptions: 0,
      partialReceptions: 0,
      differentReceptions: 0,
      completionRate: 0,
    }
  }
}

export async function getInventory(): Promise<InventoryItem[]> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return []
  }

  try {
    const items = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        unit: true,
      },
      orderBy: { name: 'asc' },
    })

    return items
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
}
