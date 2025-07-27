import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        stockTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: {
                name: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Logika penentuan status stok berdasarkan perbandingan matematika
    // Formula: stock <= 0 = 'critical', stock <= minStock = 'low', sisanya = 'normal'
    // Menggunakan operator perbandingan untuk klasifikasi otomatis
    const itemsWithStatus = items.map(item => ({
      ...item,
      status: item.stock <= 0 ? 'critical' : item.stock <= item.minStock ? 'low' : 'normal'
    }))

    return NextResponse.json(itemsWithStatus)
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, unit, stock, minStock } = body

    if (!name || !category || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        unit,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0
      }
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}
