import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST endpoint untuk membuat transaksi stok (IN/OUT)
export async function POST(request: NextRequest) {
  try {
    // Parse request body dari client
    const body = await request.json()
    const { itemId, type, quantity, description, userId } = body

    // Validasi field yang wajib diisi
    if (!itemId || !type || !quantity || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Database transaction untuk memastikan konsistensi data
    const result = await prisma.$transaction(async (tx) => {
      // Query item inventaris yang akan diupdate
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId }
      })

      if (!item) {
        throw new Error('Item not found')
      }

      // Rumus kalkulasi stok baru berdasarkan jenis transaksi
      // Formula: IN = stok + quantity, OUT = stok - quantity
      const newStock = type === 'IN' 
        ? item.stock + parseInt(quantity)
        : item.stock - parseInt(quantity)

      // Validasi matematika: stok tidak boleh negatif
      if (newStock < 0) {
        throw new Error('Insufficient stock')
      }

      // Update stok item di database
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { stock: newStock }
      })

      // Create record transaksi untuk audit trail
      const transaction = await tx.stockTransaction.create({
        data: {
          itemId,
          type,
          quantity: parseInt(quantity),
          description,
          userId
        },
        include: {
          item: true,
          user: {
            select: {
              name: true,
              username: true
            }
          }
        }
      })

      return transaction
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating stock transaction:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create stock transaction' 
    }, { status: 500 })
  }
}
