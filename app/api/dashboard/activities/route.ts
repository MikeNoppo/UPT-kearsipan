import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Activity {
  id: string
  type: string
  title: string
  status: string
  description: string
  color: string
}

export async function GET() {
  try {
    // Setup filter untuk aktivitas 7 hari terakhir
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Mengambil aktivitas workflow inventaris terbaru secara paralel
    const [recentPurchaseRequests, recentReceptions, recentDistributions] = await Promise.all([
      // Query permintaan pembelian terbaru dengan join user data
      prisma.purchaseRequest.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo }
        },
        include: {
          requestedBy: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),
      
      // Query penerimaan barang terbaru dengan join user data
      prisma.reception.findMany({
        where: {
          receiptDate: { gte: sevenDaysAgo }
        },
        include: {
          receivedBy: {
            select: { name: true }
          }
        },
        orderBy: { receiptDate: 'desc' },
        take: 3
      }),
      
      // Query distribusi barang terbaru dengan join user data
      prisma.distribution.findMany({
        where: {
          distributionDate: { gte: sevenDaysAgo }
        },
        include: {
          distributedBy: {
            select: { name: true }
          },
          items: {
            select: {
              itemName: true,
              quantity: true,
              unit: true
            }
          }
        },
        orderBy: { distributionDate: 'desc' },
        take: 3
      })
    ])

    // Mengambil aktivitas surat dan arsip yang memerlukan perhatian
    const [recentLetters, recentArchives, scheduledDestructionArchives] = await Promise.all([
      // Query surat yang belum upload dokumen
      prisma.letter.findMany({
        where: {
          hasDocument: false,
          createdAt: { gte: sevenDaysAgo }
        },
        include: {
          createdBy: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 2
      }),
      
      // Query arsip yang baru diupdate
      prisma.archive.findMany({
        where: {
          updatedAt: { gte: sevenDaysAgo }
        },
        include: {
          archivedBy: {
            select: { name: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 2
      }),
      
      // Query arsip yang dijadwalkan musnah dalam 7 hari (perlu review)
      prisma.archive.findMany({
        where: {
          status: 'SCHEDULED_DESTRUCTION',
          destructionDate: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Within 7 days
          }
        },
        orderBy: { destructionDate: 'asc' },
        take: 1
      })
    ])

    // Format inventory workflow activities
    const inventoryActivities: Activity[] = []

    // Transformasi data permintaan pembelian ke format activity
    recentPurchaseRequests.forEach(request => {
      inventoryActivities.push({
        id: request.id,
        type: 'purchase_request',
        title: `Permintaan ${request.itemName}`,
        status: request.status,
        description: getTimeAgo(request.createdAt),
        color: request.status === 'PENDING' ? 'bg-orange-500' : 
               request.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
      })
    })

    // Transformasi data penerimaan barang ke format activity
    recentReceptions.forEach(reception => {
      inventoryActivities.push({
        id: reception.id,
        type: 'reception',
        title: `Penerimaan ${reception.itemName}`,
        status: reception.status,
        description: getTimeAgo(reception.receiptDate),
        color: reception.status === 'COMPLETE' ? 'bg-green-500' :
               reception.status === 'PARTIAL' ? 'bg-yellow-500' : 'bg-orange-500'
      })
    })

    // Transformasi data distribusi barang ke format activity
    recentDistributions.forEach(distribution => {
      const itemsText = distribution.items.length > 1 
        ? `${distribution.items.length} barang` 
        : distribution.items[0]?.itemName || 'barang'
      
      inventoryActivities.push({
        id: distribution.id,
        type: 'distribution',
        title: `Distribusi ${itemsText}`,
        status: 'COMPLETE',
        description: getTimeAgo(distribution.distributionDate),
        color: 'bg-blue-500'
      })
    })

    // Sort by date and take top 3
    inventoryActivities.sort(() => {
      // Note: We need to add timestamp to sort properly, for now just take first 3
      return 0
    })

    // Format letter and archive activities
    const letterArchiveActivities: Activity[] = []

    // Add letters needing document upload
    recentLetters.forEach(letter => {
      letterArchiveActivities.push({
        id: letter.id,
        type: 'letter',
        title: `Surat ${letter.type === 'INCOMING' ? 'masuk' : 'keluar'}: ${letter.subject}`,
        status: 'NEEDS_DOCUMENT',
        description: 'Perlu upload dokumen',
        color: 'bg-cyan-500'
      })
    })

    // Add scheduled destruction archives
    if (scheduledDestructionArchives.length > 0) {
      const count = await prisma.archive.count({
        where: {
          status: 'SCHEDULED_DESTRUCTION',
          destructionDate: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
      
      letterArchiveActivities.push({
        id: 'destruction',
        type: 'archive_destruction',
        title: `${count} arsip dijadwalkan musnah`,
        status: 'NEEDS_REVIEW',
        description: 'Review dalam 7 hari',
        color: 'bg-red-500'
      })
    }

    // Add recent archive updates
    recentArchives.forEach(archive => {
      letterArchiveActivities.push({
        id: archive.id,
        type: 'archive',
        title: `Arsip ${archive.status === 'PERMANENT' ? 'permanen' : 'diperbarui'}: ${archive.title}`,
        status: archive.status,
        description: 'Status dikonfirmasi',
        color: 'bg-gray-500'
      })
    })

    return NextResponse.json({
      inventoryActivities: inventoryActivities.slice(0, 3),
      letterArchiveActivities: letterArchiveActivities.slice(0, 3)
    })
  } catch (error) {
    console.error('Error fetching dashboard activities:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard activities' }, { status: 500 })
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Baru saja'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} menit yang lalu`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} jam yang lalu`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} hari yang lalu`
  }
}
