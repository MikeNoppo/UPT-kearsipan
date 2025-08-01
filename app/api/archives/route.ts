import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for archives
const createArchiveSchema = z.object({
  code: z.string().min(1, "Archive code is required"),
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  creationDate: z.string().min(1, "Creation date is required"),
  retentionPeriod: z.number().min(1, "Retention period must be at least 1 year"),
  status: z.enum(["UNDER_REVIEW", "PERMANENT", "SCHEDULED_DESTRUCTION"]).default("UNDER_REVIEW"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  destructionDate: z.string().optional(),
})

// GET /api/archives - Fetch all archives with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const status = searchParams.get("status") || ""

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" }
    }

    if (status) {
      where.status = status
    }

    // Get archives with pagination
    const [archives, totalCount] = await Promise.all([
      prisma.archive.findMany({
        where,
        include: {
          archivedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.archive.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      archives,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching archives:", error)
    return NextResponse.json(
      { error: "Failed to fetch archives" },
      { status: 500 }
    )
  }
}

// POST /api/archives - Create new archive
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = createArchiveSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if archive code already exists
    const existingArchive = await prisma.archive.findUnique({
      where: { code: data.code },
    })

    if (existingArchive) {
      return NextResponse.json(
        { error: "Archive code already exists" },
        { status: 409 }
      )
    }

    // Logika kalkulasi tanggal pemusnahan arsip berdasarkan masa retensi
    // Formula: tanggal pembuatan + periode retensi (dalam tahun) = tanggal pemusnahan
    let destructionDate = null
    if (data.status === "SCHEDULED_DESTRUCTION" || data.destructionDate) {
      if (data.destructionDate) {
        destructionDate = new Date(data.destructionDate)
      } else {
        // Rumus perhitungan: creation date + retention period (years)
        // Menggunakan manipulasi Date object untuk menambah tahun
        const creationDate = new Date(data.creationDate)
        destructionDate = new Date(creationDate)
        destructionDate.setFullYear(creationDate.getFullYear() + data.retentionPeriod)
      }
    }

    // Create archive
    const archive = await prisma.archive.create({
      data: {
        code: data.code,
        title: data.title,
        category: data.category,
        creationDate: new Date(data.creationDate),
        retentionPeriod: data.retentionPeriod,
        status: data.status,
        location: data.location,
        description: data.description,
        notes: data.notes,
        destructionDate,
        archivedById: session.user.id,
      },
      include: {
        archivedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(archive, { status: 201 })
  } catch (error) {
    console.error("Error creating archive:", error)
    return NextResponse.json(
      { error: "Failed to create archive" },
      { status: 500 }
    )
  }
}
