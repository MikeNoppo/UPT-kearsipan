import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema validation for distribution update
const updateDistributionItemSchema = z.object({
  id: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  itemId: z.string().optional(),
})

const updateDistributionSchema = z.object({
  noteNumber: z.string().min(1, "Note number is required").optional(),
  staffName: z.string().min(1, "Staff name is required").optional(),
  department: z.string().min(1, "Department is required").optional(),
  distributionDate: z.string().transform((val) => new Date(val)).optional(),
  purpose: z.string().min(1, "Purpose is required").optional(),
  items: z.array(updateDistributionItemSchema).optional(),
})

// GET /api/distribution/[id] - Get specific distribution
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const distribution = await prisma.distribution.findUnique({
      where: { id: params.id },
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

    if (!distribution) {
      return NextResponse.json(
        { error: "Distribution not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(distribution)
  } catch (error) {
    console.error("Error fetching distribution:", error)
    return NextResponse.json(
      { error: "Failed to fetch distribution" },
      { status: 500 }
    )
  }
}

// PATCH /api/distribution/[id] - Update distribution
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateDistributionSchema.parse(body)

    // Check if distribution exists
    const existingDistribution = await prisma.distribution.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!existingDistribution) {
      return NextResponse.json(
        { error: "Distribution not found" },
        { status: 404 }
      )
    }

    // If note number is being updated, check for uniqueness
    if (validatedData.noteNumber && validatedData.noteNumber !== existingDistribution.noteNumber) {
      const noteExists = await prisma.distribution.findUnique({
        where: { noteNumber: validatedData.noteNumber },
      })

      if (noteExists) {
        return NextResponse.json(
          { error: "Note number already exists" },
          { status: 400 }
        )
      }
    }

    // If items are being updated, validate inventory
    if (validatedData.items) {
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

          // Check if we need to validate stock (comparing with existing quantity)
          const existingItem = existingDistribution.items.find(item => item.itemId === itemData.itemId)
          const existingQuantity = existingItem ? existingItem.quantity : 0
          const quantityDifference = itemData.quantity - existingQuantity

          if (quantityDifference > 0 && inventoryItem.stock < quantityDifference) {
            return NextResponse.json(
              { error: `Insufficient stock for ${itemData.itemName}. Available: ${inventoryItem.stock}, Required additional: ${quantityDifference}` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Update distribution and items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Prepare update data for distribution (excluding items)
      const updateData: any = {}
      if (validatedData.noteNumber) updateData.noteNumber = validatedData.noteNumber
      if (validatedData.staffName) updateData.staffName = validatedData.staffName
      if (validatedData.department) updateData.department = validatedData.department
      if (validatedData.distributionDate) updateData.distributionDate = validatedData.distributionDate
      if (validatedData.purpose) updateData.purpose = validatedData.purpose

      // Update the distribution basic info
      const distribution = await tx.distribution.update({
        where: { id: params.id },
        data: updateData,
        include: {
          distributedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      })

      // If items are being updated
      if (validatedData.items) {
        // First, restore stock for old items that are linked to inventory
        for (const oldItem of existingDistribution.items) {
          if (oldItem.itemId) {
            await tx.inventoryItem.update({
              where: { id: oldItem.itemId },
              data: {
                stock: {
                  increment: oldItem.quantity,
                },
              },
            })

            // Create stock transaction for restoration
            await tx.stockTransaction.create({
              data: {
                type: "IN",
                quantity: oldItem.quantity,
                description: `Stock restored from updated distribution - ${distribution.noteNumber}: ${oldItem.itemName}`,
                itemId: oldItem.itemId,
                userId: session.user.id,
              },
            })
          }
        }

        // Delete all existing items
        await tx.distributionItem.deleteMany({
          where: { distributionId: params.id },
        })

        // Create new items and update inventory
        for (const itemData of validatedData.items) {
          // Create new distribution item
          await tx.distributionItem.create({
            data: {
              distributionId: params.id,
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
                description: `Distribution updated - ${distribution.noteNumber}: ${itemData.itemName} to ${distribution.staffName}`,
                itemId: itemData.itemId,
                userId: session.user.id,
              },
            })
          }
        }
      }

      // Return updated distribution with items
      return await tx.distribution.findUnique({
        where: { id: params.id },
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
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating distribution:", error)
    return NextResponse.json(
      { error: "Failed to update distribution" },
      { status: 500 }
    )
  }
}

// DELETE /api/distribution/[id] - Delete distribution
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only administrators can delete distributions
    if (session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Check if distribution exists
    const existingDistribution = await prisma.distribution.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!existingDistribution) {
      return NextResponse.json(
        { error: "Distribution not found" },
        { status: 404 }
      )
    }

    // Delete distribution and potentially restore stock in a transaction
    await prisma.$transaction(async (tx) => {
      // Restore stock for each item that was linked to inventory
      for (const distributionItem of existingDistribution.items) {
        if (distributionItem.itemId) {
          await tx.inventoryItem.update({
            where: { id: distributionItem.itemId },
            data: {
              stock: {
                increment: distributionItem.quantity,
              },
            },
          })

          // Create stock transaction record for the restoration
          await tx.stockTransaction.create({
            data: {
              type: "IN",
              quantity: distributionItem.quantity,
              description: `Stock restored from deleted distribution - ${existingDistribution.noteNumber}: ${distributionItem.itemName}`,
              itemId: distributionItem.itemId,
              userId: session.user.id,
            },
          })
        }
      }

      // Delete distribution items first (cascade should handle this but let's be explicit)
      await tx.distributionItem.deleteMany({
        where: { distributionId: params.id },
      })

      // Delete the distribution
      await tx.distribution.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json(
      { message: "Distribution deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting distribution:", error)
    return NextResponse.json(
      { error: "Failed to delete distribution" },
      { status: 500 }
    )
  }
}
