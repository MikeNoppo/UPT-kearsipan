import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating reception
const createReceptionSchema = z.object({
  requestId: z.string().optional(),
  itemName: z.string().min(1, 'Item name is required'),
  requestedQuantity: z.number().min(1, 'Requested quantity must be at least 1'),
  receivedQuantity: z.number().min(0, 'Received quantity must be at least 0'),
  unit: z.string().min(1, 'Unit is required'),
  receiptDate: z.string().datetime('Invalid date format'),
  status: z.enum(['COMPLETE', 'PARTIAL', 'DIFFERENT']),
  notes: z.string().optional(),
  itemId: z.string().optional(),
});

// GET /api/reception - Get all receptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Rumus pagination: skip = (halaman - 1) * limit
    // Formula untuk menentukan berapa data yang dilewati dalam pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { receivedBy: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [receptions, total] = await Promise.all([
      prisma.reception.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          receivedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              stock: true,
              unit: true,
            },
          },
        },
      }),
      prisma.reception.count({ where }),
    ]);

    return NextResponse.json({
      receptions,
      pagination: {
        page,
        limit,
        total,
        // Rumus menghitung total halaman: Math.ceil(total / limit)
        // Formula ceiling untuk membulatkan ke atas agar semua data tertampung
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching receptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reception - Create new reception
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReceptionSchema.parse(body);

    // itemId harus ada untuk proses penerimaan barang
    if (!validatedData.itemId) {
      return NextResponse.json(
        { error: 'Barang harus sudah terdaftar di inventory sebelum penerimaan.' },
        { status: 400 }
      );
    }

    // Check if item exists in inventory
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: validatedData.itemId },
    });
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const reception = await prisma.reception.create({
      data: {
        requestId: validatedData.requestId,
        itemName: validatedData.itemName,
        requestedQuantity: validatedData.requestedQuantity,
        receivedQuantity: validatedData.receivedQuantity,
        unit: validatedData.unit,
        receiptDate: new Date(validatedData.receiptDate),
        status: validatedData.status,
        notes: validatedData.notes,
        receivedById: session.user.id,
        itemId: validatedData.itemId,
      },
      include: {
        receivedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            stock: true,
            unit: true,
          },
        },
      },
    });

    // Update inventory stock if item is linked and status is COMPLETE
    if (validatedData.itemId && validatedData.status === 'COMPLETE') {
      await prisma.inventoryItem.update({
        where: { id: validatedData.itemId },
        data: {
          stock: {
            increment: validatedData.receivedQuantity,
          },
        },
      });

      // Create stock transaction record
      await prisma.stockTransaction.create({
        data: {
          type: 'IN',
          quantity: validatedData.receivedQuantity,
          description: `Reception from inventory reception`,
          itemId: validatedData.itemId,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(reception, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating reception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
