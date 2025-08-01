import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/letters/stats - Get letter statistics
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
          date: {
            gte: startDate,
          },
        }
      : {}

    // Get various statistics
    const [
      totalLetters,
      incomingLetters,
      outgoingLetters,
      lettersWithDocuments,
      recentLetters,
      lettersByMonth,
    ] = await Promise.all([
      // Total letters
      prisma.letter.count(),

      // Incoming letters count
      prisma.letter.count({
        where: { type: "INCOMING" },
      }),

      // Outgoing letters count
      prisma.letter.count({
        where: { type: "OUTGOING" },
      }),

      // Letters with documents
      prisma.letter.count({
        where: { hasDocument: true },
      }),

      // Recent letters (based on period)
      prisma.letter.count({
        where: timeFilter,
      }),

      // Letters by month (for chart data)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', date) as month,
          type,
          COUNT(*)::int as count
        FROM letters 
        WHERE date >= ${startDate || new Date(now.getFullYear() - 1, 0, 1)}
        GROUP BY DATE_TRUNC('month', date), type
        ORDER BY month DESC
        LIMIT 12
      `,
    ])

    // Get department statistics (from/to fields)
    const departmentStats = await prisma.$queryRaw`
      SELECT 
        COALESCE("from", "to") as department,
        COUNT(*)::int as count
      FROM letters 
      WHERE COALESCE("from", "to") IS NOT NULL
      GROUP BY COALESCE("from", "to")
      ORDER BY count DESC
      LIMIT 10
    `

    return NextResponse.json({
      totalLetters,
      incomingLetters,
      outgoingLetters,
      lettersWithDocuments,
      recentLetters,
      departmentStats,
      monthlyData: lettersByMonth,
      period,
    })
  } catch (error) {
    console.error("Error fetching letter statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch letter statistics" },
      { status: 500 }
    )
  }
}
