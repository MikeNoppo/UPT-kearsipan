import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET endpoint untuk mengambil semua data pengguna
export async function GET() {
  try {
    // Verifikasi session dan authorization level administrator
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can access user data." },
        { status: 403 }
      )
    }

    // Query semua user dengan select fields tertentu untuk keamanan
    const users = await prisma.user.findMany({
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
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST endpoint untuk membuat pengguna baru
export async function POST(request: NextRequest) {
  try {
    // Verifikasi session dan authorization level administrator
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can create users." },
        { status: 403 }
      )
    }

    // Parse request body dari client
    const body = await request.json()
    const { username, name, email, password, role } = body

    // Validasi field yang wajib diisi
    if (!username || !name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validasi enum role yang diizinkan
    if (!["ADMINISTRATOR", "STAFF"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMINISTRATOR or STAFF" },
        { status: 400 }
      )
    }

    // Cek duplikasi username dalam database
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      )
    }

    // Cek duplikasi email dalam database
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Hash password menggunakan bcrypt untuk keamanan
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user baru dengan data yang sudah divalidasi
    const newUser = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        role,
        status: "ACTIVE"
      },
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

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
