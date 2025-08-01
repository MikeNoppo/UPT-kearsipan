import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

interface ArchiveFilterProps {
  searchTerm: string
  categoryFilter: string
  retentionFilter: string  // Filter berdasarkan status retensi
  categories: string[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onRetentionChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
}

export function ArchiveFilter({
  searchTerm,
  categoryFilter,
  retentionFilter,
  categories,
  onSearchChange,
  onCategoryChange,
  onRetentionChange,
  onSearch,
  onReset,
}: ArchiveFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Arsip</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Pencarian</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Cari kode, judul, lokasi..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={onSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status Retensi</Label>
            <Select value={retentionFilter} onValueChange={onRetentionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="active">Aktif (dalam masa retensi)</SelectItem>
                <SelectItem value="expired">Kadaluarsa (lewat masa retensi)</SelectItem>
                <SelectItem value="near_expiry">Mendekati kadaluarsa (30 hari)</SelectItem>
                <SelectItem value="destroyed">Sudah dimusnahkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onReset}>
            <Filter className="mr-2 h-4 w-4" />
            Reset Filter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
