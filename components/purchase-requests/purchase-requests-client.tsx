"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { CreateRequestDialog } from "@/components/purchase-requests/create-request-dialog"
import { StatsCards } from "@/components/purchase-requests/stats-cards"
import { RequestsTable } from "@/components/purchase-requests/requests-table"
import { useToast } from "@/hooks/use-toast"

interface PurchaseRequest {
  id: string
  itemName: string
  quantity: number
  unit: string
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED" | "RECEIVED"
  notes?: string
  requestDate: string
  reviewDate?: string
  createdAt: string
  updatedAt: string
  requestedBy: {
    id: string
    name: string
    username: string
  }
  reviewedBy?: {
    id: string
    name: string
    username: string
  }
  item?: {
    id: string
    name: string
    category: string
    stock: number
  }
}

export function PurchaseRequestsClient() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Mengambil daftar permintaan pembelian dari API
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/purchase-requests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchase requests')
      }

      const data = await response.json()
      setRequests(data.purchaseRequests || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        title: "Error",
        description: "Failed to load purchase requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Load permintaan saat session tersedia
  useEffect(() => {
    if (session) {
      fetchRequests()
    }
  }, [session, fetchRequests])

  if (status === 'loading' || loading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Permintaan Pembelian</h1>
          <p className="text-muted-foreground">Kelola permintaan pembelian barang</p>
        </div>
        <CreateRequestDialog onRequestCreated={fetchRequests} />
      </div>

      <StatsCards requests={requests} />

      <RequestsTable 
        requests={requests}
        userRole={session.user.role}
        userId={session.user.id}
        onRequestUpdated={fetchRequests}
      />
    </div>
  )
}
