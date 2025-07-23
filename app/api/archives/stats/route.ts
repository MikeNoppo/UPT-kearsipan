import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/archives/stats - Get archive statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // month, year, all

    const now = new Date()
    let startDate: Date | undefined

    // Calculate start date based on period
    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    // Build where clause for time period
    const timeFilter = startDate
      ? {
          createdAt: {
            gte: startDate,
          },
        }
      : {}

    // Get various statistics
    const [
      totalArchives,
      permanentArchives,
      scheduledForDestruction,
      underReview,
      recentArchives,
      archivesByStatus,
      archivesByCategory,
      monthlyData,
    ] = await Promise.all([
      // Total archives
      prisma.archive.count(),

      // Permanent archives count
      prisma.archive.count({
        where: { status: "PERMANENT" },
      }),

      // Scheduled for destruction count
      prisma.archive.count({
        where: { status: "SCHEDULED_DESTRUCTION" },
      }),

      // Under review count
      prisma.archive.count({
        where: { status: "UNDER_REVIEW" },
      }),

      // Recent archives (based on period)
      prisma.archive.count({
        where: timeFilter,
      }),

      // Archives by status
      prisma.archive.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      }),

      // Archives by category
      prisma.archive.groupBy({
        by: ["category"],
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

      // Archives by month (for chart data)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as count
        FROM archives 
        WHERE "createdAt" >= ${startDate || new Date(now.getFullYear() - 1, 0, 1)}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
        LIMIT 12
      `,
    ])

    // Format status data
    const statusStats = archivesByStatus.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Format category data
    const categoriesStats = archivesByCategory.map((item) => ({
      category: item.category,
      count: item._count.id,
    }))

    // Get archives nearing destruction (within 1 year)
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    
    const nearingDestruction = await prisma.archive.count({
      where: {
        status: "SCHEDULED_DESTRUCTION",
        destructionDate: {
          lte: nextYear,
          gte: now,
        },
      },
    })

    return NextResponse.json({
      totalArchives,
      permanentArchives,
      scheduledForDestruction,
      underReview,
      recentArchives,
      nearingDestruction,
      statusStats,
      categoriesStats,
      monthlyData,
      period,
    })
  } catch (error) {
    console.error("Error fetching archive statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch archive statistics" },
      { status: 500 }
    )
  }
}
