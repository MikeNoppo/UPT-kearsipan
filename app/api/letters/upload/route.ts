import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { saveUploadedFile } from "@/lib/upload"

// POST /api/letters/upload - Upload file untuk surat
export async function POST(request: NextRequest) {
  try {
    // Verifikasi autentikasi
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Save file and get metadata
    const fileData = await saveUploadedFile(file)

    return NextResponse.json({
      success: true,
      ...fileData
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Upload failed" 
      },
      { status: 400 }
    )
  }
}
