"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

/**
 * Homepage/Landing Page - Halaman utama aplikasi
 * 
 * Fungsi utama:
 * - Melakukan redirect otomatis berdasarkan status login user
 * - Jika user sudah login -> redirect ke dashboard
 * - Jika user belum login -> redirect ke halaman signin
 * - Menampilkan loading screen sementara mengecek status autentikasi
 * 
 * Komponen ini berfungsi sebagai router utama aplikasi yang menentukan
 * halaman mana yang harus ditampilkan kepada user berdasarkan session mereka
 */
export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (session) {
      router.push("/dashboard")
    } else {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div>Loading...</div>
    </div>
  )
}
