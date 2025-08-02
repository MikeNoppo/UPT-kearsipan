import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"

interface DistributionItem {
  id: string
  itemName: string
  quantity: number
  unit: string
  itemId?: string
}

interface Distribution {
  id: string
  noteNumber: string
  staffName: string
  department: string
  distributionDate: string
  purpose: string
  createdAt: string
  distributedBy: {
    id: string
    name: string
    username: string
  }
  items: DistributionItem[]
}

interface DistributionsTableProps {
  distributions: Distribution[]
  session: { user?: { name?: string; role?: string } } | null
  setEditingDistribution: (dist: Distribution) => void
  handleDeleteDistribution: (id: string) => void
}

export function DistributionsTable({
  distributions,
  session,
  setEditingDistribution,
  handleDeleteDistribution,
}: DistributionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nomor Nota</TableHead>
          <TableHead>Barang</TableHead>
          <TableHead>Staff Penerima</TableHead>
          <TableHead>Departemen</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Didistribusi Oleh</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {distributions.map((distribution) => (
          <TableRow key={distribution.id}>
            <TableCell className="font-medium">{distribution.noteNumber}</TableCell>
            <TableCell>
              <div className="space-y-1">
                {distribution.items.map((item, index) => (
                  <div key={index} className="text-sm">
                    {item.itemName} ({item.quantity} {item.unit})
                  </div>
                ))}
              </div>
            </TableCell>
            <TableCell>{distribution.staffName}</TableCell>
            <TableCell>
              <Badge variant="outline">{distribution.department}</Badge>
            </TableCell>
            <TableCell>
              {new Date(distribution.distributionDate).toLocaleDateString("id-ID")}
            </TableCell>
            <TableCell>{distribution.distributedBy.name}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditingDistribution({ ...distribution })}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {session?.user?.role === "ADMINISTRATOR" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDistribution(distribution.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
