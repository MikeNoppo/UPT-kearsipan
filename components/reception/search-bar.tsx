"use client"

import { useState, memo, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  onSearchChange: (searchTerm: string) => void
  placeholder?: string
}

const SearchBar = memo(function SearchBar({ onSearchChange, placeholder = "Cari penerimaan barang..." }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearchChange = useMemo(() => (value: string) => {
    setSearchTerm(value)
    onSearchChange(value)
  }, [onSearchChange])

  return (
    <div className="flex items-center space-x-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  )
})

export { SearchBar }
