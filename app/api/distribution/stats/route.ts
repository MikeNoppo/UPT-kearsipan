import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/distribution/stats - Get distribution statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // month, quarter, year
    
    let dateFilter: any = {}
    const now = new Date()

    switch (period) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { gte: weekAgo }
        break
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        dateFilter = { gte: monthAgo }
        break
      case "quarter":
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        dateFilter = { gte: quarterAgo }
        break
      case "year":
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        dateFilter = { gte: yearAgo }
        break
    }

    const [
      totalDistributions,
      recentDistributions,
      totalQuantityDistributed,
      departmentStats,
      monthlyDistributions,
      topDistributedItems,
    ] = await Promise.all([
      // Total distributions
      prisma.distribution.count(),

      // Recent distributions (within the specified period)
      prisma.distribution.count({
        where: {
          distributionDate: dateFilter,
        },
      }),

      // Total quantity distributed in the period
      prisma.distributionItem.aggregate({
        where: {
          distribution: {
            distributionDate: dateFilter,
          },
        },
        _sum: {
          quantity: true,
        },
      }),

      // Distribution by department
      prisma.distribution.groupBy({
        by: ["department"],
        where: {
          distributionDate: dateFilter,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      }),

      // Monthly distribution trends (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "distributionDate") as month,
          COUNT(*)::int as count,
          SUM((
            SELECT SUM(quantity) 
            FROM distribution_items 
            WHERE "distributionId" = distributions.id
          ))::int as total_quantity
        FROM distributions 
        WHERE "distributionDate" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "distributionDate")
        ORDER BY month ASC
      `,

      // Top distributed items
      prisma.distributionItem.groupBy({
        by: ["itemName"],
        where: {
          distribution: {
            distributionDate: dateFilter,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 10,
      }),
    ])

    const stats = {
      totalDistributions,
      recentDistributions,
      totalQuantityDistributed: totalQuantityDistributed._sum.quantity || 0,
      departmentStats: departmentStats.map((dept) => ({
        department: dept.department,
        count: dept._count.id,
        totalQuantity: 0, // Will be calculated separately if needed
      })),
      monthlyDistributions,
      topDistributedItems: topDistributedItems.map((item) => ({
        itemName: item.itemName,
        count: item._count.id,
        totalQuantity: item._sum.quantity || 0,
      })),
      period,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching distribution statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch distribution statistics" },
      { status: 500 }
    )
  }
}
