import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase, LETTERS_BUCKET } from "@/lib/supabase"
import path from "path"

// GET /api/letters/[id]/download - Download dokumen surat
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

    // If stored path is a full public URL, derive relative path after bucket
    let storagePath: string
    if (letter.documentPath.includes('/storage/v1/object/public/')) {
      const afterPublic = letter.documentPath.split('/storage/v1/object/public/')[1]
      const parts = afterPublic.split('/')
      parts.shift() // remove bucket name
      storagePath = parts.join('/')
    } else {
      // maybe already relative or full path without domain
      storagePath = letter.documentPath.replace(/^https?:\/\/[^/]+\//, '')
      // Ensure we only pass the path relative to bucket (letters/...)
      storagePath = storagePath.replace(/^files\//, '') // remove bucket name if present
      if (!storagePath.startsWith('letters/')) {
        // Assume stored like letters/filename
        const filename = path.basename(letter.documentPath)
        storagePath = `letters/${filename}`
      }
    }

    const { data, error } = await supabase.storage.from(LETTERS_BUCKET).download(storagePath)
    if (error || !data) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 })
    }
    const arrayBuffer = await data.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

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
