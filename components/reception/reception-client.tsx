"use client"

import { useState, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { ReceptionStatsCards } from "./reception-stats"
import { ReceptionTable } from "./reception-table"
import { AddReceptionDialog } from "./add-reception-dialog"
import { SearchBar } from "./search-bar"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface ReceptionStats {
  totalReceptions: number
  completeReceptions: number
  partialReceptions: number
  differentReceptions: number
  completionRate: number
}

interface InventoryItem {
  id: string
  name: string
  stock: number
  unit: string
}

interface ReceptionClientProps {
  initialReceptions: Reception[]
  initialStats: ReceptionStats
  initialInventory: InventoryItem[]
}

export function ReceptionClient({ 
  initialReceptions, 
  initialStats, 
  initialInventory 
}: ReceptionClientProps) {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [receptions, setReceptions] = useState<Reception[]>(initialReceptions)
  const [inventory] = useState<InventoryItem[]>(initialInventory) // Make inventory immutable for performance
  const [stats, setStats] = useState<ReceptionStats>(initialStats)
  const [searchTerm, setSearchTerm] = useState("")

  // Memoized filtered receptions for better performance
  const filteredReceptions = useMemo(() => {
    if (!searchTerm) return receptions
    
    const lowercaseSearch = searchTerm.toLowerCase()
    return receptions.filter(
      (reception) =>
        reception.itemName.toLowerCase().includes(lowercaseSearch) ||
        reception.supplier.toLowerCase().includes(lowercaseSearch) ||
        (reception.requestId && reception.requestId.toLowerCase().includes(lowercaseSearch)),
    )
  }, [receptions, searchTerm])

  // Optimized stats fetching with useCallback
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/reception/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const data = await response.json()
      setStats({
        totalReceptions: data.totalReceptions,
        completeReceptions: data.completeReceptions,
        partialReceptions: data.partialReceptions,
        differentReceptions: data.differentReceptions,
        completionRate: data.completionRate,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  const handleReceptionAdded = useCallback((newReception: Reception) => {
    setReceptions(prev => [newReception, ...prev])
    fetchStats() // Refresh stats
  }, [fetchStats])

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Please sign in to access this page</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Penerimaan Barang</h1>
          <p className="text-muted-foreground">Catat barang yang diterima dan perbarui stok inventaris</p>
        </div>
        <AddReceptionDialog 
          inventory={inventory} 
          onReceptionAdded={handleReceptionAdded}
        />
      </div>

      <ReceptionStatsCards stats={stats} />

      <SearchBar onSearchChange={handleSearchChange} />

      <ReceptionTable receptions={filteredReceptions} />
    </div>
  )
}
