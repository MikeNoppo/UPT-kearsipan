"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Demo authentication - replace with real authentication
    if (username === "admin" && password === "admin123") {
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: "admin",
          role: "administrator",
          name: "Administrator",
        }),
      )
      router.push("/dashboard")
    } else if (username === "staff" && password === "staff123") {
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: "staff",
          role: "staff",
          name: "Staff Tata Usaha",
        }),
      )
      router.push("/dashboard")
    } else {
      setError("Username atau password salah")
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Masukkan username dan password Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
          <p>Demo accounts:</p>
          <p>Admin: admin / admin123</p>
          <p>Staff: staff / staff123</p>
        </div>
      </CardContent>
    </Card>
  )
}
