import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, Filter } from "lucide-react"

interface CorrespondenceFilterProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  typeFilter: string
  setTypeFilter: (value: string) => void
  onSearch: () => void
  onResetFilters: () => void
}

export function CorrespondenceFilter({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  onSearch,
  onResetFilters,
}: CorrespondenceFilterProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Filter Surat</CardTitle>
        <Button variant="outline" onClick={onResetFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Reset Filter
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Pencarian</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Cari nomor, perihal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={onSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Jenis Surat</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua jenis</SelectItem>
                <SelectItem value="INCOMING">Surat Masuk</SelectItem>
                <SelectItem value="OUTGOING">Surat Keluar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
