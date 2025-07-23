import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    // Get various stats
    const [
      pendingRequests,
      receivedThisMonth,
      distributedThisMonth,
      totalInventory,
      incomingLettersThisMonth,
      outgoingLettersThisMonth,
      permanentArchives,
      scheduledDestructionArchives
    ] = await Promise.all([
      prisma.purchaseRequest.count({
        where: { status: 'PENDING' }
      }),
      prisma.reception.count({
        where: {
          receiptDate: { gte: currentMonth }
        }
      }),
      prisma.distribution.count({
        where: {
          distributionDate: { gte: currentMonth }
        }
      }),
      prisma.inventoryItem.count(),
      prisma.letter.count({
        where: {
          type: 'INCOMING',
          createdAt: { gte: currentMonth }
        }
      }),
      prisma.letter.count({
        where: {
          type: 'OUTGOING',
          createdAt: { gte: currentMonth }
        }
      }),
      prisma.archive.count({
        where: { status: 'PERMANENT' }
      }),
      prisma.archive.count({
        where: { status: 'SCHEDULED_DESTRUCTION' }
      })
    ])

    const stats = {
      pendingRequests,
      receivedThisMonth,
      distributedThisMonth,
      totalInventory,
      incomingLettersThisMonth,
      outgoingLettersThisMonth,
      permanentArchives,
      scheduledDestructionArchives
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
