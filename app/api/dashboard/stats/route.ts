import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Setup tanggal awal bulan ini untuk filter periode
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    // Mengambil berbagai statistik secara paralel menggunakan Promise.all untuk performa optimal
    const [
      pendingRequests,
      receivedThisMonth,
      distributedThisMonth,
      totalInventory,
      incomingLettersThisMonth,
      outgoingLettersThisMonth
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
    ])

    const stats = {
      pendingRequests,
      receivedThisMonth,
      distributedThisMonth,
      totalInventory,
      incomingLettersThisMonth,
      outgoingLettersThisMonth,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
