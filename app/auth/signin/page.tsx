"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Sign In Page - Halaman login/autentikasi sistem
 * 
 * Fungsi utama:
 * - Menyediakan form login untuk user masuk ke sistem
 * - Validasi credentials user (username & password)
 * - Redirect ke dashboard setelah login berhasil
 * - Menampilkan error message jika login gagal
 * 
 * Proses autentikasi:
 * 1. User input username dan password
 * 2. Sistem validasi credentials dengan database
 * 3. Jika valid, create session dan redirect ke dashboard
 * 4. Jika invalid, tampilkan pesan error
 * 
 * Fitur keamanan:
 * - Password hashing untuk security
 * - Session management dengan NextAuth
 * - CSRF protection
 * - Rate limiting untuk prevent brute force
 * 
 * UI/UX:
 * - Form yang user-friendly dan responsive
 * - Loading state saat proses autentikasi
 * - Error handling dengan pesan yang jelas
 * - Desain konsisten dengan brand sistem
 */

export default function SignInPage() {
  // State untuk form login dan handling error
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Handler untuk proses login/autentikasi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Username atau password salah")
      } else {
        // Get session to verify login
        const session = await getSession()
        if (session) {
          router.push("/dashboard")
        }
      }
    } catch {
      setError("Terjadi kesalahan saat login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Login Sistem Kearsipan UPT
          </CardTitle>
          <CardDescription className="text-center">
            Masukkan username dan password Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">Demo Credentials:</p>
            <div className="text-sm text-blue-700 mt-2">
              <p><strong>Admin:</strong> username: admin, password: password123</p>
              <p><strong>Staff:</strong> username: staff, password: password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
