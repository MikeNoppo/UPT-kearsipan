import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, Edit, Trash2, Eye } from "lucide-react"
import type { Letter } from "@/types/letter"
import type { Session } from "next-auth"

interface CorrespondenceTableProps {
  letters: Letter[]
  session: Session | null
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onEditLetter: (letter: Letter) => void
  onDeleteLetter: (id: string) => void
  onViewDocument: (letter: Letter) => void
  onDownloadDocument: (letter: Letter) => void
}

export function CorrespondenceTable({
  letters,
  session,
  currentPage,
  totalPages,
  onPageChange,
  onEditLetter,
  onDeleteLetter,
  onViewDocument,
  onDownloadDocument,
}: CorrespondenceTableProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INCOMING":
        return (
          <Badge variant="default">
            <Download className="mr-1 h-3 w-3" />
            Masuk
          </Badge>
        )
      case "OUTGOING":
        return (
          <Badge variant="secondary">
            <Upload className="mr-1 h-3 w-3" />
            Keluar
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Surat</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor Surat</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Perihal</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Asal/Tujuan</TableHead>
              <TableHead>Dokumen</TableHead>
              <TableHead>Dibuat Oleh</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {letters.map((letter) => (
              <TableRow key={letter.id}>
                <TableCell className="font-medium">{letter.number}</TableCell>
                <TableCell>{new Date(letter.date).toLocaleDateString("id-ID")}</TableCell>
                <TableCell>{letter.subject}</TableCell>
                <TableCell>{getTypeBadge(letter.type)}</TableCell>
                <TableCell>{letter.from || letter.to || "-"}</TableCell>
                <TableCell>
                  {letter.hasDocument ? (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDocument(letter)}
                        className="h-8 px-2"
                        title="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownloadDocument(letter)}
                        className="h-8 px-2"
                        title={`Download: ${letter.documentName || 'document'}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>{letter.createdBy.name}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditLetter({ ...letter })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {(session?.user.role === "ADMINISTRATOR" || letter.createdBy.id === session?.user.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteLetter(letter.id)}
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
