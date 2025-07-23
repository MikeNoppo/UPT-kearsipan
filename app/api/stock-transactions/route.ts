import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, type, quantity, description, userId } = body

    if (!itemId || !type || !quantity || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Start a transaction to update stock and create transaction record
    const result = await prisma.$transaction(async (tx) => {
      // Get current item
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId }
      })

      if (!item) {
        throw new Error('Item not found')
      }

      // Calculate new stock
      const newStock = type === 'IN' 
        ? item.stock + parseInt(quantity)
        : item.stock - parseInt(quantity)

      if (newStock < 0) {
        throw new Error('Insufficient stock')
      }

      // Update item stock
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { stock: newStock }
      })

      // Create transaction record
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
