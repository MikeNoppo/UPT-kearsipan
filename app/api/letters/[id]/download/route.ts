import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// GET /api/letters/[id]/download - Download dokumen surat
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifikasi autentikasi
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get letter data
    const letter = await prisma.letter.findUnique({
      where: { id: params.id },
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

    // Use original filename for download, fallback to generated name
    const downloadFilename = letter.documentName || path.basename(letter.documentPath)

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': letter.documentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    )
  }
}
