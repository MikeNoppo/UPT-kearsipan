import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET /api/users/stats - Get user statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can access user statistics." },
        { status: 403 }
      )
    }

    // Get user counts
    const [totalUsers, adminCount, staffCount, activeUsers, inactiveUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMINISTRATOR" } }),
      prisma.user.count({ where: { role: "STAFF" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "INACTIVE" } })
    ])

    return NextResponse.json({
      totalUsers,
      adminCount,
      staffCount,
      activeUsers,
      inactiveUsers
    })
  } catch (error) {
    console.error("Error fetching user statistics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
