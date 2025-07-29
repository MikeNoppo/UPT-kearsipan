import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating reception
const updateReceptionSchema = z.object({
  requestId: z.string().optional(),
  itemName: z.string().min(1, 'Item name is required').optional(),
  requestedQuantity: z.number().min(1, 'Requested quantity must be at least 1').optional(),
  receivedQuantity: z.number().min(0, 'Received quantity must be at least 0').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  receiptDate: z.string().datetime('Invalid date format').optional(),
  status: z.enum(['COMPLETE', 'PARTIAL', 'DIFFERENT']).optional(),
  notes: z.string().optional(),
  itemId: z.string().optional(),
});

// GET /api/reception/[id] - Get specific reception
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reception = await prisma.reception.findUnique({
      where: { id: params.id },
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

    if (!reception) {
      return NextResponse.json(
        { error: 'Reception not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reception);
  } catch (error) {
    console.error('Error fetching reception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/reception/[id] - Update reception
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateReceptionSchema.parse(body);

    const existingReception = await prisma.reception.findUnique({
      where: { id: params.id },
    });

    if (!existingReception) {
      return NextResponse.json(
        { error: 'Reception not found' },
        { status: 404 }
      );
    }

    // Check if item exists (if itemId provided)
    if (validatedData.itemId) {
      const existingItem = await prisma.inventoryItem.findUnique({
        where: { id: validatedData.itemId },
      });

      if (!existingItem) {
        return NextResponse.json(
          { error: 'Inventory item not found' },
          { status: 404 }
        );
      }
    }

    // Handle inventory stock updates if quantity or status changed
    const oldQuantity = existingReception.receivedQuantity;
    const oldStatus = existingReception.status;
    const newQuantity = validatedData.receivedQuantity ?? oldQuantity;
    const newStatus = validatedData.status ?? oldStatus;

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    if (validatedData.receiptDate) {
      updateData.receiptDate = new Date(validatedData.receiptDate);
    }

    // Copy other fields if provided
    Object.keys(validatedData).forEach(key => {
      if (key !== 'receiptDate' && validatedData[key as keyof typeof validatedData] !== undefined) {
        updateData[key] = validatedData[key as keyof typeof validatedData];
      }
    });

    const updatedReception = await prisma.reception.update({
      where: { id: params.id },
      data: updateData,
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

    // Update inventory stock if linked item and relevant changes
    if (existingReception.itemId) {
      // Kalkulasi selisih kuantitas: quantity baru - quantity lama
      const quantityDiff = newQuantity - oldQuantity;
      const statusChanged = oldStatus !== newStatus;

      if (quantityDiff !== 0 || statusChanged) {
        // Logika perhitungan perubahan stok berdasarkan status
        // Formula kompleks untuk menentukan penambahan/pengurangan stok yang tepat
        let stockChange = 0;

        if (oldStatus === 'COMPLETE' && newStatus !== 'COMPLETE') {
          // Was complete, now not complete - remove old quantity
          stockChange = -oldQuantity;
        } else if (oldStatus !== 'COMPLETE' && newStatus === 'COMPLETE') {
          // Wasn't complete, now complete - add new quantity
          stockChange = newQuantity;
        } else if (oldStatus === 'COMPLETE' && newStatus === 'COMPLETE') {
          // Both complete - just the difference
          stockChange = quantityDiff;
        }

        if (stockChange !== 0) {
          await prisma.inventoryItem.update({
            where: { id: existingReception.itemId },
            data: {
              stock: {
                increment: stockChange,
              },
            },
          });

          // Create stock transaction record
          await prisma.stockTransaction.create({
            data: {
              type: stockChange > 0 ? 'IN' : 'OUT',
              // Rumus nilai absolut: Math.abs() untuk mendapatkan nilai positif
              quantity: Math.abs(stockChange),
              description: `Reception update`,
              itemId: existingReception.itemId,
              userId: session.user.id,
            },
          });
        }
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

// DELETE /api/reception/[id] - Delete reception
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete receptions
    if (session.user.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingReception = await prisma.reception.findUnique({
      where: { id: params.id },
    });

    if (!existingReception) {
      return NextResponse.json(
        { error: 'Reception not found' },
        { status: 404 }
      );
    }

    // If reception was complete and linked to inventory, reverse the stock
    if (existingReception.status === 'COMPLETE' && existingReception.itemId) {
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
          description: `Reception deleted`,
          itemId: existingReception.itemId,
          userId: session.user.id,
        },
      });
    }

    await prisma.reception.delete({
      where: { id: params.id },
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
