import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// GET /api/letters/[id]/preview - Preview dokumen surat dalam browser
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifikasi autentikasi
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params for Next.js 15 compatibility
    const { id } = await params

    // Get letter data
    const letter = await prisma.letter.findUnique({
      where: { id },
      select: {
        id: true,
        documentPath: true,
        documentName: true,
        documentSize: true,
        documentType: true,
        hasDocument: true
      }
    })

    if (!letter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 })
    }

    if (!letter.hasDocument || !letter.documentPath) {
      return NextResponse.json({ error: "No document available" }, { status: 404 })
    }

    // Construct file path - remove leading slash if present
    const cleanPath = letter.documentPath.startsWith('/') 
      ? letter.documentPath.substring(1) 
      : letter.documentPath
    const filePath = path.join('./public', cleanPath)

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found on server" }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Determine MIME type for proper browser handling
    let contentType = letter.documentType || 'application/octet-stream'
    
    // Ensure proper MIME types for preview
    if (letter.documentName) {
      const ext = path.extname(letter.documentName).toLowerCase()
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf'
          break
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg'
          break
        case '.png':
          contentType = 'image/png'
          break
        case '.gif':
          contentType = 'image/gif'
          break
        case '.webp':
          contentType = 'image/webp'
          break
      }
    }

    // Return file with preview-optimized headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline', // inline instead of attachment for preview
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour for performance
        'X-Frame-Options': 'SAMEORIGIN', // Security: only allow embedding in same origin
        'X-Content-Type-Options': 'nosniff', // Security: prevent MIME type sniffing
      }
    })

  } catch (error) {
    console.error("Preview error:", error)
    return NextResponse.json(
      { error: "Preview failed" },
      { status: 500 }
    )
  }
}
