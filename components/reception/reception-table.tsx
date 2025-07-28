"use client"

import { useMemo, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle } from "lucide-react"

interface Reception {
  id: string
  requestId?: string
  itemName: string
  requestedQuantity: number
  receivedQuantity: number
  unit: string
  supplier: string
  receiptDate: string
  status: "COMPLETE" | "PARTIAL" | "DIFFERENT"
  notes?: string
  createdAt: string
  updatedAt: string
  receivedBy: {
    id: string
    name: string
    username: string
  }
  item?: {
    id: string
    name: string
    category: string
    stock: number
    unit: string
  }
}

interface ReceptionTableProps {
  receptions: Reception[]
}

const ReceptionTable = memo(function ReceptionTable({ receptions }: ReceptionTableProps) {
  const getStatusBadge = useMemo(() => (status: string) => {
    switch (status) {
      case "COMPLETE":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Lengkap
          </Badge>
        )
      case "PARTIAL":
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            Sebagian
          </Badge>
        )
      case "DIFFERENT":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Berbeda
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penerimaan Barang</CardTitle>
        <CardDescription>Catatan semua barang yang telah diterima</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Permintaan</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead>Diminta</TableHead>
              <TableHead>Diterima</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Diterima Oleh</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receptions.map((reception) => (
              <TableRow key={reception.id}>
                <TableCell className="font-medium">{reception.requestId || "-"}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{reception.itemName}</div>
                    {reception.item && (
                      <div className="text-sm text-muted-foreground">
                        {reception.item.category} - Stock: {reception.item.stock}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {reception.requestedQuantity} {reception.unit}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {reception.receivedQuantity} {reception.unit}
                  </div>
                  {reception.requestedQuantity > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {Math.round((reception.receivedQuantity / reception.requestedQuantity) * 100)}% dari diminta
                    </div>
                  )}
                </TableCell>
                <TableCell>{reception.supplier}</TableCell>
                <TableCell>{reception.receivedBy.name}</TableCell>
                <TableCell>{new Date(reception.receiptDate).toLocaleDateString("id-ID")}</TableCell>
                <TableCell>{getStatusBadge(reception.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
})

export { ReceptionTable }
