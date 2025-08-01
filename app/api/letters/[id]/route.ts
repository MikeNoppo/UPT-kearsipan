import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateLetterSchema = z.object({
  number: z.string().min(1, "Letter number is required").optional(),
  date: z.string().min(1, "Date is required").optional(),
  subject: z.string().min(1, "Subject is required").optional(),
  type: z.enum(["INCOMING", "OUTGOING"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  description: z.string().optional(),
  hasDocument: z.boolean().optional(),
  documentPath: z.string().optional(),
  documentName: z.string().optional(),
  documentSize: z.number().optional(),
  documentType: z.string().optional(),
})

// GET /api/letters/[id] - Get specific letter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params for Next.js 15 compatibility
    const { id } = await params

    const letter = await prisma.letter.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    if (!letter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 })
    }

    return NextResponse.json(letter)
  } catch (error) {
    console.error("Error fetching letter:", error)
    return NextResponse.json(
      { error: "Failed to fetch letter" },
      { status: 500 }
    )
  }
}

// PATCH /api/letters/[id] - Update letter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params for Next.js 15 compatibility
    const { id } = await params

    const body = await request.json()

    // Validate input
    const validationResult = updateLetterSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if letter exists
    const existingLetter = await prisma.letter.findUnique({
      where: { id },
    })

    if (!existingLetter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 })
    }

    // Check if letter number already exists (if being changed)
    if (data.number && data.number !== existingLetter.number) {
      const letterWithSameNumber = await prisma.letter.findUnique({
        where: { number: data.number },
      })

      if (letterWithSameNumber) {
        return NextResponse.json(
          { error: "Letter number already exists" },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (data.number) updateData.number = data.number
    if (data.date) updateData.date = new Date(data.date)
    if (data.subject) updateData.subject = data.subject
    if (data.type) updateData.type = data.type
    if (data.from !== undefined) updateData.from = data.from
    if (data.to !== undefined) updateData.to = data.to
    if (data.description !== undefined) updateData.description = data.description
    if (data.hasDocument !== undefined) updateData.hasDocument = data.hasDocument
    if (data.documentPath !== undefined) updateData.documentPath = data.documentPath
    if (data.documentName !== undefined) updateData.documentName = data.documentName
    if (data.documentSize !== undefined) updateData.documentSize = data.documentSize
    if (data.documentType !== undefined) updateData.documentType = data.documentType
    
    // If file is being updated/added, set uploadedAt
    if (data.documentPath && data.documentPath !== existingLetter.documentPath) {
      updateData.uploadedAt = new Date()
    }
    
    // If file is being removed, clear all file metadata
    if (data.hasDocument === false) {
      updateData.documentPath = null
      updateData.documentName = null
      updateData.documentSize = null
      updateData.documentType = null
      updateData.uploadedAt = null
    }

    // Update letter
    const letter = await prisma.letter.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(letter)
  } catch (error) {
    console.error("Error updating letter:", error)
    return NextResponse.json(
      { error: "Failed to update letter" },
      { status: 500 }
    )
  }
}

// DELETE /api/letters/[id] - Delete letter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params for Next.js 15 compatibility
    const { id } = await params

    // Check if letter exists
    const existingLetter = await prisma.letter.findUnique({
      where: { id },
    })

    if (!existingLetter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 })
    }

    // Only allow deletion by admin or the creator
    if (session.user.role !== "ADMINISTRATOR" && existingLetter.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete letter
    await prisma.letter.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Letter deleted successfully" })
  } catch (error) {
    console.error("Error deleting letter:", error)
    return NextResponse.json(
      { error: "Failed to delete letter" },
      { status: 500 }
    )
  }
}
