import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search } from "lucide-react"

interface DistributionFilterProps {
  searchTerm: string
  setSearchTerm: (v: string) => void
  departmentFilter: string
  setDepartmentFilter: (v: string) => void
  departments: string[]
  handleSearch: () => void
  resetFilters: () => void
}

export function DistributionFilter({
  searchTerm,
  setSearchTerm,
  departmentFilter,
  setDepartmentFilter,
  departments,
  handleSearch,
  resetFilters,
}: DistributionFilterProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Filter Distribusi</CardTitle>
        <Button variant="outline" onClick={resetFilters}>
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
                placeholder="Cari nomor nota, barang, staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Departemen</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua departemen</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
