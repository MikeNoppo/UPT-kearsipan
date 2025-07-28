import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateArchiveSchema = z.object({
  code: z.string().min(1, "Archive code is required").optional(),
  title: z.string().min(1, "Title is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  creationDate: z.string().min(1, "Creation date is required").optional(),
  retentionPeriod: z.number().min(1, "Retention period must be at least 1 year").optional(),
  status: z.enum(["UNDER_REVIEW", "PERMANENT", "SCHEDULED_DESTRUCTION"]).optional(),
  location: z.string().min(1, "Location is required").optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  destructionDate: z.string().optional(),
})

// GET /api/archives/[id] - Get specific archive
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const archive = await prisma.archive.findUnique({
      where: { id: params.id },
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

    if (!archive) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 })
    }

    return NextResponse.json(archive)
  } catch (error) {
    console.error("Error fetching archive:", error)
    return NextResponse.json(
      { error: "Failed to fetch archive" },
      { status: 500 }
    )
  }
}

// PATCH /api/archives/[id] - Update archive
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = updateArchiveSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if archive exists
    const existingArchive = await prisma.archive.findUnique({
      where: { id: params.id },
    })

    if (!existingArchive) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 })
    }

    // Check if archive code already exists (if being changed)
    if (data.code && data.code !== existingArchive.code) {
      const archiveWithSameCode = await prisma.archive.findUnique({
        where: { code: data.code },
      })

      if (archiveWithSameCode) {
        return NextResponse.json(
          { error: "Archive code already exists" },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (data.code) updateData.code = data.code
    if (data.title) updateData.title = data.title
    if (data.category) updateData.category = data.category
    if (data.creationDate) updateData.creationDate = new Date(data.creationDate)
    if (data.retentionPeriod) updateData.retentionPeriod = data.retentionPeriod
    if (data.status) updateData.status = data.status
    if (data.location) updateData.location = data.location
    if (data.description !== undefined) updateData.description = data.description
    if (data.notes !== undefined) updateData.notes = data.notes

    // Handle destruction date
    if (data.destructionDate !== undefined) {
      updateData.destructionDate = data.destructionDate ? new Date(data.destructionDate) : null
    } else if (data.status === "SCHEDULED_DESTRUCTION" && !existingArchive.destructionDate) {
      // Auto-calculate destruction date if status changed to SCHEDULED_DESTRUCTION
      const creationDate = data.creationDate ? new Date(data.creationDate) : existingArchive.creationDate
      const retentionPeriod = data.retentionPeriod || existingArchive.retentionPeriod
      const destructionDate = new Date(creationDate)
      destructionDate.setFullYear(creationDate.getFullYear() + retentionPeriod)
      updateData.destructionDate = destructionDate
    } else if (data.status === "PERMANENT" || data.status === "UNDER_REVIEW") {
      updateData.destructionDate = null
    }

    // Update archive
    const archive = await prisma.archive.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(archive)
  } catch (error) {
    console.error("Error updating archive:", error)
    return NextResponse.json(
      { error: "Failed to update archive" },
      { status: 500 }
    )
  }
}

// DELETE /api/archives/[id] - Delete archive
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if archive exists
    const existingArchive = await prisma.archive.findUnique({
      where: { id: params.id },
    })

    if (!existingArchive) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 })
    }

    // Only allow deletion by admin or the creator
    if (session.user.role !== "ADMINISTRATOR" && existingArchive.archivedById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete archive
    await prisma.archive.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Archive deleted successfully" })
  } catch (error) {
    console.error("Error deleting archive:", error)
    return NextResponse.json(
      { error: "Failed to delete archive" },
      { status: 500 }
    )
  }
}
