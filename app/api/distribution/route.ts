import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema validation for distribution creation
const distributionItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  itemId: z.string().optional(),
})

const distributionSchema = z.object({
  staffName: z.string().min(1, "Staff name is required"),
  department: z.string().min(1, "Department is required"),
  distributionDate: z.string().transform((val) => new Date(val)),
  purpose: z.string().min(1, "Purpose is required"),
  items: z.array(distributionItemSchema).min(1, "At least one item is required"),
})

// Helper function untuk generate nomor nota distribusi otomatis
async function generateNoteNumber(): Promise<string> {
  try {
    // Query distribusi terakhir berdasarkan tanggal pembuatan
    const lastDistribution = await prisma.distribution.findFirst({
      orderBy: { createdAt: "desc" },
      select: { noteNumber: true }
    })

    // Jika belum ada distribusi, mulai dari DST-001
    if (!lastDistribution) {
      return "DST-001"
    }

    const lastNoteNumber = lastDistribution.noteNumber
    // Extract angka dari format nomor nota DST-XXX menggunakan regex
    const match = lastNoteNumber.match(/DST-(\d+)/)
    
    if (match) {
      // Rumus increment: nomor terakhir + 1 dengan padding zero
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

// GET endpoint untuk mengambil semua data distribusi
export async function GET(request: NextRequest) {
  try {
    // Verifikasi autentikasi user session
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parsing parameter query untuk pagination dan filter
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const department = searchParams.get("department") || ""
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Rumus pagination offset
    const skip = (page - 1) * limit

    // Build where clause untuk filtering database
    const where: Record<string, unknown> = {}
    
    // Filter pencarian teks multi-kolom menggunakan OR condition
    if (search) {
      where.OR = [
        { noteNumber: { contains: search, mode: "insensitive" } },
        { staffName: { contains: search, mode: "insensitive" } },
        { purpose: { contains: search, mode: "insensitive" } },
        { items: { some: { itemName: { contains: search, mode: "insensitive" } } } },
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
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  stock: true,
                },
              },
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
      
      // Create distribution with items in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const distribution = await tx.distribution.create({
          data: {
            noteNumber: fallbackNoteNumber,
            distributedById: session.user.id,
            staffName: validatedData.staffName,
            department: validatedData.department,
            distributionDate: validatedData.distributionDate,
            purpose: validatedData.purpose,
          },
          include: {
            distributedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            items: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    stock: true,
                  },
                },
              },
            },
          },
        })

        // Create distribution items and update inventory
        for (const itemData of validatedData.items) {
          // Create distribution item
          await tx.distributionItem.create({
            data: {
              distributionId: distribution.id,
              itemName: itemData.itemName,
              quantity: itemData.quantity,
              unit: itemData.unit,
              itemId: itemData.itemId,
            },
          })

          // If linked to inventory item, update stock
          if (itemData.itemId) {
            const inventoryItem = await tx.inventoryItem.findUnique({
              where: { id: itemData.itemId },
            })

            if (!inventoryItem) {
              throw new Error(`Inventory item not found: ${itemData.itemName}`)
            }

            if (inventoryItem.stock < itemData.quantity) {
              throw new Error(`Insufficient stock for ${itemData.itemName}. Available: ${inventoryItem.stock}, Required: ${itemData.quantity}`)
            }

            await tx.inventoryItem.update({
              where: { id: itemData.itemId },
              data: {
                stock: {
                  decrement: itemData.quantity,
                },
              },
            })

            // Create stock transaction record
            await tx.stockTransaction.create({
              data: {
                type: "OUT",
                quantity: itemData.quantity,
                description: `Distribution - ${fallbackNoteNumber}: ${itemData.itemName} to ${validatedData.staffName}`,
                itemId: itemData.itemId,
                userId: session.user.id,
              },
            })
          }
        }

        return distribution
      })
      
      return NextResponse.json(result, { status: 201 })
    }

    // Validate inventory items and check stock
    for (const itemData of validatedData.items) {
      if (itemData.itemId) {
        const inventoryItem = await prisma.inventoryItem.findUnique({
          where: { id: itemData.itemId },
        })

        if (!inventoryItem) {
          return NextResponse.json(
            { error: `Inventory item not found: ${itemData.itemName}` },
            { status: 404 }
          )
        }

        if (inventoryItem.stock < itemData.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${itemData.itemName}. Available: ${inventoryItem.stock}, Required: ${itemData.quantity}` },
            { status: 400 }
          )
        }
      }
    }

    // Create distribution and update inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the distribution
      const distribution = await tx.distribution.create({
        data: {
          noteNumber,
          distributedById: session.user.id,
          staffName: validatedData.staffName,
          department: validatedData.department,
          distributionDate: validatedData.distributionDate,
          purpose: validatedData.purpose,
        },
        include: {
          distributedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  stock: true,
                },
              },
            },
          },
        },
      })

      // Create distribution items and update inventory
      for (const itemData of validatedData.items) {
        // Create distribution item
        await tx.distributionItem.create({
          data: {
            distributionId: distribution.id,
            itemName: itemData.itemName,
            quantity: itemData.quantity,
            unit: itemData.unit,
            itemId: itemData.itemId,
          },
        })

        // If linked to inventory item, update stock
        if (itemData.itemId) {
          await tx.inventoryItem.update({
            where: { id: itemData.itemId },
            data: {
              stock: {
                decrement: itemData.quantity,
              },
            },
          })

          // Create stock transaction record
          await tx.stockTransaction.create({
            data: {
              type: "OUT",
              quantity: itemData.quantity,
              description: `Distribution - ${noteNumber}: ${itemData.itemName} to ${validatedData.staffName}`,
              itemId: itemData.itemId,
              userId: session.user.id,
            },
          })
        }
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
      { error: error instanceof Error ? error.message : "Failed to create distribution" },
      { status: 500 }
    )
  }
}
