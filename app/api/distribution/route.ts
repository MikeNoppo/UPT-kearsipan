import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema validation for distribution creation
const distributionSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  staffName: z.string().min(1, "Staff name is required"),
  department: z.string().min(1, "Department is required"),
  distributionDate: z.string().transform((val) => new Date(val)),
  purpose: z.string().min(1, "Purpose is required"),
  notes: z.string().optional(),
  itemId: z.string().optional(),
})

// Helper function to generate next note number
async function generateNoteNumber(): Promise<string> {
  try {
    // Get the last distribution ordered by creation date
    const lastDistribution = await prisma.distribution.findFirst({
      orderBy: { createdAt: "desc" },
      select: { noteNumber: true }
    })

    if (!lastDistribution) {
      return "DST-001"
    }

    const lastNoteNumber = lastDistribution.noteNumber
    // Extract number from note number format DST-XXX
    const match = lastNoteNumber.match(/DST-(\d+)/)
    
    if (match) {
      const lastNumber = parseInt(match[1])
      const nextNumber = lastNumber + 1
      return `DST-${nextNumber.toString().padStart(3, '0')}`
    } else {
      // If format doesn't match, start from 001
      return "DST-001"
    }
  } catch (error) {
    console.error("Error generating note number:", error)
    // Fallback: use timestamp-based number
    const fallbackNumber = Date.now().toString().slice(-3)
    return `DST-${fallbackNumber}`
  }
}

// GET /api/distribution - Fetch all distributions
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
    const department = searchParams.get("department") || ""
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}
    
    if (search) {
      where.OR = [
        { noteNumber: { contains: search, mode: "insensitive" } },
        { itemName: { contains: search, mode: "insensitive" } },
        { staffName: { contains: search, mode: "insensitive" } },
        { purpose: { contains: search, mode: "insensitive" } },
      ]
    }

    if (department) {
      where.department = { contains: department, mode: "insensitive" }
    }

    if (startDate && endDate) {
      where.distributionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [distributions, total] = await Promise.all([
      prisma.distribution.findMany({
        where,
        include: {
          distributedBy: {
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
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.distribution.count({ where }),
    ])

    return NextResponse.json({
      distributions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching distributions:", error)
    return NextResponse.json(
      { error: "Failed to fetch distributions" },
      { status: 500 }
    )
  }
}

// POST /api/distribution - Create new distribution
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = distributionSchema.parse(body)

    // Generate unique note number
    const noteNumber = await generateNoteNumber()

    // Check if generated note number already exists (extra safety check)
    const existingDistribution = await prisma.distribution.findUnique({
      where: { noteNumber },
    })

    if (existingDistribution) {
      // If by chance the generated number exists, try again with timestamp fallback
      const fallbackNumber = Date.now().toString().slice(-6)
      const fallbackNoteNumber = `DST-${fallbackNumber}`
      
      const distribution = await prisma.distribution.create({
        data: {
          noteNumber: fallbackNoteNumber,
          distributedById: session.user.id,
          ...validatedData,
        },
        include: {
          distributedBy: {
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
            },
          },
        },
      })
      
      return NextResponse.json(distribution, { status: 201 })
    }

    // If itemId is provided, check if item exists and update stock
    let inventoryItem = null
    if (validatedData.itemId) {
      inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: validatedData.itemId },
      })

      if (!inventoryItem) {
        return NextResponse.json(
          { error: "Inventory item not found" },
          { status: 404 }
        )
      }

      // Check if there's enough stock
      if (inventoryItem.stock < validatedData.quantity) {
        return NextResponse.json(
          { error: "Insufficient stock available" },
          { status: 400 }
        )
      }
    }

    // Create distribution and update inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the distribution
      const distribution = await tx.distribution.create({
        data: {
          noteNumber,
          ...validatedData,
          distributedById: session.user.id,
        },
        include: {
          distributedBy: {
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
            },
          },
        },
      })

      // If linked to inventory item, update stock and create stock transaction
      if (validatedData.itemId && inventoryItem) {
        await tx.inventoryItem.update({
          where: { id: validatedData.itemId },
          data: {
            stock: {
              decrement: validatedData.quantity,
            },
          },
        })

        // Create stock transaction record
        await tx.stockTransaction.create({
          data: {
            type: "OUT",
            quantity: validatedData.quantity,
            description: `Distribution - ${noteNumber}: ${validatedData.purpose}`,
            itemId: validatedData.itemId,
            userId: session.user.id,
          },
        })
      }

      return distribution
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating distribution:", error)
    return NextResponse.json(
      { error: "Failed to create distribution" },
      { status: 500 }
    )
  }
}
