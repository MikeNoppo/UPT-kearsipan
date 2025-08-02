import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating reception
const createReceptionSchema = z.object({
  purchaseRequestId: z.string().optional(),
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
          purchaseRequest: {
            select: {
              id: true,
              requestNumber: true,
              requestedBy: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
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
        purchaseRequestId: validatedData.purchaseRequestId,
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

    // Update purchase request status to RECEIVED if linked to a purchase request
    if (validatedData.purchaseRequestId) {
      await prisma.purchaseRequest.update({
        where: { id: validatedData.purchaseRequestId },
        data: {
          status: 'RECEIVED',
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

// PUT /api/reception - Update reception
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Reception ID is required' },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = createReceptionSchema.partial().parse(updateData);

    // Check if reception exists
    const existingReception = await prisma.reception.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!existingReception) {
      return NextResponse.json(
        { error: 'Reception not found' },
        { status: 404 }
      );
    }

    // If itemId is being updated, check if the new item exists
    if (validatedData.itemId && validatedData.itemId !== existingReception.itemId) {
      const newItem = await prisma.inventoryItem.findUnique({
        where: { id: validatedData.itemId },
      });
      if (!newItem) {
        return NextResponse.json(
          { error: 'New inventory item not found' },
          { status: 404 }
        );
      }
    }

    // Update reception
    const updatedReception = await prisma.reception.update({
      where: { id },
      data: {
        ...validatedData,
        receiptDate: validatedData.receiptDate ? new Date(validatedData.receiptDate) : undefined,
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
        purchaseRequest: {
          select: {
            id: true,
            requestNumber: true,
            requestedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Handle stock updates if quantity or status changed
    if (existingReception.itemId && (
      validatedData.receivedQuantity !== undefined && validatedData.receivedQuantity !== existingReception.receivedQuantity ||
      validatedData.status && validatedData.status !== existingReception.status
    )) {
      const oldQuantity = existingReception.status === 'COMPLETE' ? existingReception.receivedQuantity : 0;
      const newQuantity = validatedData.status === 'COMPLETE' ? (validatedData.receivedQuantity || existingReception.receivedQuantity) : 0;
      const stockDifference = newQuantity - oldQuantity;

      if (stockDifference !== 0) {
        await prisma.inventoryItem.update({
          where: { id: existingReception.itemId },
          data: {
            stock: {
              increment: stockDifference,
            },
          },
        });

        // Create stock transaction record
        await prisma.stockTransaction.create({
          data: {
            type: stockDifference > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(stockDifference),
            description: `Reception update - ${stockDifference > 0 ? 'increased' : 'decreased'} stock`,
            itemId: existingReception.itemId,
            userId: session.user.id,
          },
        });
      }
    }

    return NextResponse.json(updatedReception);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating reception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/reception - Delete reception
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Reception ID is required' },
        { status: 400 }
      );
    }

    // Check if reception exists
    const existingReception = await prisma.reception.findUnique({
      where: { id },
    });

    if (!existingReception) {
      return NextResponse.json(
        { error: 'Reception not found' },
        { status: 404 }
      );
    }

    // Revert stock changes if reception was complete
    if (existingReception.itemId && existingReception.status === 'COMPLETE') {
      await prisma.inventoryItem.update({
        where: { id: existingReception.itemId },
        data: {
          stock: {
            decrement: existingReception.receivedQuantity,
          },
        },
      });

      // Create stock transaction record
      await prisma.stockTransaction.create({
        data: {
          type: 'OUT',
          quantity: existingReception.receivedQuantity,
          description: 'Reception deleted - stock reverted',
          itemId: existingReception.itemId,
          userId: session.user.id,
        },
      });
    }

    // Update purchase request status back to APPROVED if linked
    if (existingReception.purchaseRequestId) {
      await prisma.purchaseRequest.update({
        where: { id: existingReception.purchaseRequestId },
        data: {
          status: 'APPROVED',
        },
      });
    }

    // Delete reception
    await prisma.reception.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reception deleted successfully' });
  } catch (error) {
    console.error('Error deleting reception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
