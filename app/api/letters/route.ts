import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for letters
const createLetterSchema = z.object({
  number: z.string().min(1, "Letter number is required"),
  date: z.string().min(1, "Date is required"),
  subject: z.string().min(1, "Subject is required"),
  type: z.enum(["INCOMING", "OUTGOING"]),
  from: z.string().optional(),
  to: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["RECEIVED", "SENT", "DRAFT"]).default("DRAFT"),
  hasDocument: z.boolean().default(false),
  documentPath: z.string().optional(),
})

// GET endpoint untuk mengambil semua surat dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    // Verifikasi autentikasi user session
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parsing parameter query dari URL untuk pagination dan filter
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const status = searchParams.get("status") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    // Rumus pagination: skip = (halaman - 1) * limit
    // Formula untuk menentukan offset data dalam pagination database
    const skip = (page - 1) * limit

    // Build where clause untuk filtering database
    const where: any = {}

    // Filter pencarian teks di multiple kolom menggunakan OR
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { from: { contains: search, mode: "insensitive" } },
        { to: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter berdasarkan jenis surat (INCOMING/OUTGOING)
    if (type) {
      where.type = type
    }

    // Filter berdasarkan status surat
    if (status) {
      where.status = status
    }

    // Filter berdasarkan rentang tanggal dengan conditional logic
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      }
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate),
      }
    }

    // Query surat dengan pagination menggunakan Promise.all untuk performa
    const [letters, totalCount] = await Promise.all([
      prisma.letter.findMany({
        where,
        include: {
          createdBy: {
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
      prisma.letter.count({ where }),
    ])

    // Rumus menghitung total halaman: Math.ceil(total / limit) 
    // Formula ceiling untuk membulatkan ke atas dan menampung semua data
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      letters,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching letters:", error)
    return NextResponse.json(
      { error: "Failed to fetch letters" },
      { status: 500 }
    )
  }
}

// POST endpoint untuk membuat surat baru
export async function POST(request: NextRequest) {
  try {
    // Verifikasi autentikasi dan validasi user ID
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body dari client
    const body = await request.json()

    // Validasi input menggunakan Zod schema
    const validationResult = createLetterSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Cek duplikasi nomor surat dalam database
    const existingLetter = await prisma.letter.findUnique({
      where: { number: data.number },
    })

    if (existingLetter) {
      return NextResponse.json(
        { error: "Letter number already exists" },
        { status: 409 }
      )
    }

    // Set default status based on type
    let defaultStatus = data.status
    if (!data.status || data.status === "DRAFT") {
      defaultStatus = data.type === "INCOMING" ? "RECEIVED" : "SENT"
    }

    // Create letter
    const letter = await prisma.letter.create({
      data: {
        number: data.number,
        date: new Date(data.date),
        subject: data.subject,
        type: data.type,
        from: data.from,
        to: data.to,
        description: data.description,
        status: defaultStatus,
        hasDocument: data.hasDocument,
        documentPath: data.documentPath,
        createdById: session.user.id,
      },
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

    return NextResponse.json(letter, { status: 201 })
  } catch (error) {
    console.error("Error creating letter:", error)
    return NextResponse.json(
      { error: "Failed to create letter" },
      { status: 500 }
    )
  }
}
