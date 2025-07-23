"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Shield } from "lucide-react"

interface UserInterface {
  id: string
  username: string
  name: string
  role: "administrator" | "staff"
  email: string
  createdAt: string
  lastLogin?: string
  status: "active" | "inactive"
}

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<UserInterface[]>([
    {
      id: "1",
      username: "admin",
      name: "Administrator",
      role: "administrator",
      email: "admin@unsrat.ac.id",
      createdAt: "2024-01-01",
      lastLogin: "2024-01-15",
      status: "active",
    },
    {
      id: "2",
      username: "staff",
      name: "Staff Tata Usaha",
      role: "staff",
      email: "staff@unsrat.ac.id",
      createdAt: "2024-01-02",
      lastLogin: "2024-01-14",
      status: "active",
    },
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserInterface | null>(null)
  const router = useRouter()

  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    role: "staff" as "administrator" | "staff",
    email: "",
    password: "",
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const user = JSON.parse(userData)
    if (user.role !== "administrator") {
      router.push("/dashboard")
      return
    }

    setCurrentUser(user)
  }, [router])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "administrator":
        return (
          <Badge variant="default">
            <Shield className="mr-1 h-3 w-3" />
            Administrator
          </Badge>
        )
      case "staff":
        return (
          <Badge variant="secondary">
            <Shield className="mr-1 h-3 w-3" />
            Staff
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Aktif</Badge>
      case "inactive":
        return <Badge variant="secondary">Tidak Aktif</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleAddUser = () => {
    const user: UserInterface = {
      id: Date.now().toString(),
      ...newUser,
      createdAt: new Date().toISOString().split("T")[0],
      status: "active",
    }

    setUsers([...users, user])
    setNewUser({ username: "", name: "", role: "staff", email: "", password: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditUser = () => {
    if (!editingUser) return

    setUsers(users.map((user) => (user.id === editingUser.id ? editingUser : user)))
    setEditingUser(null)
  }

  const handleDeleteUser = (id: string) => {
    if (id === currentUser?.id) {
      alert("Tidak dapat menghapus akun sendiri")
      return
    }
    setUsers(users.filter((user) => user.id !== id))
  }

  const toggleUserStatus = (id: string) => {
    if (id === currentUser?.id) {
      alert("Tidak dapat mengubah status akun sendiri")
      return
    }

    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, status: user.status === "active" ? "inactive" : "active" } : user,
      ),
    )
  }

  if (!currentUser) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
            <p className="text-muted-foreground">Kelola akun pengguna sistem</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah User Baru</DialogTitle>
                <DialogDescription>Buat akun pengguna baru untuk sistem</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: "administrator" | "staff") => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddUser}>Tambah User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total User</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrator</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "administrator").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "staff").length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar User</CardTitle>
            <CardDescription>Kelola semua akun pengguna sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("id-ID") : "Belum pernah login"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingUser({ ...user })}>
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Ubah informasi pengguna</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nama Lengkap</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value: "administrator" | "staff") =>
                      setEditingUser({ ...editingUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditUser}>Simpan Perubahan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
