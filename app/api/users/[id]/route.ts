import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can access user data." },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can update users." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { username, name, email, role, status, password } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prevent admin from changing their own status to inactive
    if (params.id === session.user.id && status === "INACTIVE") {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role && !["ADMINISTRATOR", "STAFF"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMINISTRATOR or STAFF" },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be ACTIVE or INACTIVE" },
        { status: 400 }
      )
    }

    // Check if username is taken by another user
    if (username && username !== existingUser.username) {
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username }
      })

      if (existingUserByUsername) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 }
        )
      }
    }

    // Check if email is taken by another user
    if (email && email !== existingUser.email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUserByEmail) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (username) updateData.username = username
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (status) updateData.status = status

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can delete users." },
        { status: 403 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check if user has related data that would prevent deletion
    const userRelations = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        purchaseRequests: true,
        reviewedRequests: true,
        receivedItems: true,
        distributedItems: true,
        createdLetters: true,
        archivedItems: true,
        stockTransactions: true,
      }
    })

    const hasRelatedData = userRelations && (
      userRelations.purchaseRequests.length > 0 ||
      userRelations.reviewedRequests.length > 0 ||
      userRelations.receivedItems.length > 0 ||
      userRelations.distributedItems.length > 0 ||
      userRelations.createdLetters.length > 0 ||
      userRelations.archivedItems.length > 0 ||
      userRelations.stockTransactions.length > 0
    )

    if (hasRelatedData) {
      // Instead of deleting, deactivate the user
      const deactivatedUser = await prisma.user.update({
        where: { id: params.id },
        data: { status: "INACTIVE" },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        }
      })

      return NextResponse.json({
        message: "User has related data and has been deactivated instead of deleted",
        user: deactivatedUser
      })
    }

    // Delete user if no related data
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
