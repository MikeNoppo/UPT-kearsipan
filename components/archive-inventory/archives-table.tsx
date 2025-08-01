import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, AlertTriangle } from "lucide-react"
import type { Archive } from "@/types/archive"

interface ArchivesTableProps {
  archives: Archive[]
  currentPage: number
  totalPages: number
  onEdit: (archive: Archive) => void
  onDelete: (id: string) => void
  onPageChange: (page: number) => void
  canDelete: (archive: Archive) => boolean
}

export function ArchivesTable({
  archives,
  currentPage,
  totalPages,
  onEdit,
  onDelete,
  onPageChange,
  canDelete,
}: ArchivesTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PERMANENT":
        return <Badge variant="default">Permanen</Badge>
      case "SCHEDULED_DESTRUCTION":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Dijadwalkan Musnah
          </Badge>
        )
      case "UNDER_REVIEW":
        return <Badge variant="secondary">Dalam Review</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Arsip</CardTitle>
        <CardDescription>Kelola semua dokumen arsip dalam inventaris</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Arsip</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tanggal Pembuatan</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Masa Retensi</TableHead>
              <TableHead>Diarsipkan Oleh</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archives.map((archive) => (
              <TableRow key={archive.id}>
                <TableCell className="font-medium">{archive.code}</TableCell>
                <TableCell>{archive.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{archive.category}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(archive.creationDate).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>{archive.location}</TableCell>
                <TableCell>{getStatusBadge(archive.status)}</TableCell>
                <TableCell>{archive.retentionPeriod} tahun</TableCell>
                <TableCell>{archive.archivedBy.name}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEdit({ ...archive })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {canDelete(archive) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(archive.id)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
