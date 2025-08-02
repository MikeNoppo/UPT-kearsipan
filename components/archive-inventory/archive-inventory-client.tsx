"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import type { Archive, ArchiveStats, CreateArchiveData } from "@/types/archive"
import { enrichArchiveWithStatus } from "@/lib/archive-utils"
import { ArchiveStatsCards } from "./archive-stats-cards"
import { ArchiveFilter } from "./archive-filter"
import { ArchivesTable } from "./archives-table"
import { AddArchiveDialog } from "./add-archive-dialog"
import { EditArchiveDialog } from "./edit-archive-dialog"

interface ArchiveInventoryClientProps {
  initialArchives: Archive[]
  initialStats: ArchiveStats | null
  initialTotalPages: number
}

export function ArchiveInventoryClient({
  initialArchives,
  initialStats,
  initialTotalPages,
}: ArchiveInventoryClientProps) {
  const { data: session } = useSession()
  const [archives, setArchives] = useState<Archive[]>(initialArchives.map(enrichArchiveWithStatus))
  const [archiveStats, setArchiveStats] = useState<ArchiveStats | null>(initialStats)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingArchive, setEditingArchive] = useState<Archive | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [retentionFilter, setRetentionFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const { toast } = useToast()

  // Data form untuk arsip baru
  const [newArchive, setNewArchive] = useState<CreateArchiveData>({
    code: "",
    title: "",
    category: "",
    creationDate: new Date().toISOString().split('T')[0],
    retentionPeriod: 5,
    location: "",
    description: "",
    notes: "",
  })

  // Mengambil data arsip dengan filter dan pagination
  const fetchArchives = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && categoryFilter !== "all" && { category: categoryFilter }),
        ...(retentionFilter && retentionFilter !== "all" && { retention: retentionFilter }),
      })

      const response = await fetch(`/api/archives?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch archives")
      }
      const data = await response.json()
      const enrichedArchives = data.archives.map(enrichArchiveWithStatus)
      setArchives(enrichedArchives)
      setTotalPages(data.pagination.pages)
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch archives",
        variant: "destructive",
      })
    }
  }, [currentPage, searchTerm, categoryFilter, retentionFilter, toast])

  // Mengambil statistik arsip
  const fetchArchiveStats = async () => {
    try {
      const response = await fetch("/api/archives/stats?period=month")
      if (!response.ok) {
        throw new Error("Failed to fetch archive statistics")
      }
      const data = await response.json()
      setArchiveStats(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch archive statistics",
        variant: "destructive",
      })
    }
  }

  // Reload arsip saat filter berubah
  useEffect(() => {
    if (session) {
      fetchArchives()
    }
  }, [fetchArchives, session])

  // Menambah arsip baru
  const handleAddArchive = async () => {
    if (!newArchive.code || !newArchive.title || !newArchive.category || 
        !newArchive.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/archives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newArchive,
          creationDate: new Date(newArchive.creationDate).toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create archive")
      }

      const createdArchive = await response.json()
      setArchives([createdArchive, ...archives])
      
      // Reset form
      setNewArchive({
        code: "",
        title: "",
        category: "",
        creationDate: new Date().toISOString().split('T')[0],
        retentionPeriod: 5,
        location: "",
        description: "",
        notes: "",
      })
      setIsAddDialogOpen(false)
      await fetchArchiveStats()
      await fetchArchives()
      
      toast({
        title: "Success",
        description: "Archive created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create archive",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditArchive = async () => {
    if (!editingArchive) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/archives/${editingArchive.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: editingArchive.code,
          title: editingArchive.title,
          category: editingArchive.category,
          creationDate: new Date(editingArchive.creationDate).toISOString(),
          retentionPeriod: editingArchive.retentionPeriod,
          location: editingArchive.location,
          description: editingArchive.description,
          notes: editingArchive.notes,
          destructionDate: editingArchive.destructionDate ? new Date(editingArchive.destructionDate).toISOString() : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update archive")
      }

      const updatedArchive = await response.json()
      const enrichedArchive = enrichArchiveWithStatus(updatedArchive)
      setArchives(archives.map((archive) => 
        archive.id === updatedArchive.id ? enrichedArchive : archive
      ))
      setEditingArchive(null)
      await fetchArchiveStats()
      await fetchArchives()
      
      toast({
        title: "Success",
        description: "Archive updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update archive",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteArchive = async (id: string) => {
    if (!confirm("Are you sure you want to delete this archive?")) {
      return
    }

    try {
      const response = await fetch(`/api/archives/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete archive")
      }

      setArchives(archives.filter((archive) => archive.id !== id))
      await fetchArchiveStats()
      await fetchArchives()
      
      toast({
        title: "Success",
        description: "Archive deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete archive",
        variant: "destructive",
      })
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchArchives()
  }

  const resetFilters = () => {
    setSearchTerm("")
    setCategoryFilter("all")
    setRetentionFilter("all")
    setCurrentPage(1)
  }

  const categories = [...new Set(archives.map(a => a.category))].filter(Boolean)

  const canDeleteArchive = (archive: Archive) => {
    return session?.user.role === "ADMINISTRATOR" || archive.archivedBy.id === session?.user.id
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventaris Arsip</h1>
          <p className="text-muted-foreground">Kelola inventaris dokumen arsip dengan sistem retensi</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Arsip
        </Button>
      </div>

      {/* Statistics Cards */}
      <ArchiveStatsCards stats={archiveStats} />

      {/* Filters */}
      <ArchiveFilter
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        retentionFilter={retentionFilter}
        categories={categories}
        onSearchChange={setSearchTerm}
        onCategoryChange={setCategoryFilter}
        onRetentionChange={setRetentionFilter}
        onSearch={handleSearch}
        onReset={resetFilters}
      />

      {/* Archives Table */}
      <ArchivesTable
        archives={archives}
        currentPage={currentPage}
        totalPages={totalPages}
        onEdit={setEditingArchive}
        onDelete={handleDeleteArchive}
        onPageChange={setCurrentPage}
        canDelete={canDeleteArchive}
      />

      {/* Add Dialog */}
      <AddArchiveDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        archive={newArchive}
        onArchiveChange={setNewArchive}
        onSubmit={handleAddArchive}
        isSubmitting={isSubmitting}
      />

      {/* Edit Dialog */}
      <EditArchiveDialog
        archive={editingArchive}
        onClose={() => setEditingArchive(null)}
        onArchiveChange={setEditingArchive}
        onSubmit={handleEditArchive}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
