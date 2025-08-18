import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating purchase request
const updatePurchaseRequestSchema = z.object({
  itemName: z.string().min(1, 'Item name is required').optional(), // legacy single-item
  quantity: z.number().min(1, 'Quantity must be at least 1').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  reason: z.string().min(1, 'Reason is required').optional(),
  notes: z.string().optional(),
  itemId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED','RECEIVED']).optional(),
  items: z.array(z.object({
    id: z.string().optional(), // existing item id
    itemName: z.string().min(1),
    quantity: z.number().min(1),
    unit: z.string().min(1),
    itemId: z.string().optional(),
    _action: z.enum(['add','update','delete']).optional(),
  })).optional(),
});

// GET /api/purchase-requests/[id] - Get specific purchase request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id: params.id },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
  item: { select: { id: true, name: true, category: true, stock: true, unit: true } },
  items: { select: { id: true, itemName: true, quantity: true, unit: true, itemId: true } },
      },
    });

    if (!purchaseRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Staff can only view their own requests, admins can view all
    if (
      session.user.role === 'STAFF' &&
      purchaseRequest.requestedById !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(purchaseRequest);
  } catch (error) {
    console.error('Error fetching purchase request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/purchase-requests/[id] - Update purchase request
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
    
    // Regular update with possible status change
    const validatedData = updatePurchaseRequestSchema.parse(body);

    const existingRequest = await prisma.purchaseRequest.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Authorization logic:
    // - Admin can edit any request and change status
    // - Staff can only edit their own requests and change status for their own requests
    const isAdmin = session.user.role === 'ADMINISTRATOR';
    const isOwner = session.user.id === existingRequest.requestedById;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Cannot update this purchase request' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    // Basic fields can be updated by owner or admin
    if (validatedData.itemName !== undefined) updateData.itemName = validatedData.itemName;
    if (validatedData.quantity !== undefined) updateData.quantity = validatedData.quantity;
    if (validatedData.unit !== undefined) updateData.unit = validatedData.unit;
    if (validatedData.reason !== undefined) updateData.reason = validatedData.reason;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.itemId !== undefined) updateData.itemId = validatedData.itemId;
    
    // Status can be updated by admin (any request) or staff (own request)
    if (validatedData.status !== undefined && (isAdmin || isOwner)) {
      updateData.status = validatedData.status;
      
      // If status is being set to APPROVED or REJECTED, set reviewer info
      if (validatedData.status === 'APPROVED' || validatedData.status === 'REJECTED') {
        updateData.reviewedById = session.user.id;
        updateData.reviewDate = new Date();
      }
    }

    // Check if item exists (if itemId provided)
    if (updateData.itemId) {
      const existingItem = await prisma.inventoryItem.findUnique({
        where: { id: updateData.itemId },
      });

      if (!existingItem) {
        return NextResponse.json(
          { error: 'Inventory item not found' },
          { status: 404 }
        );
      }
    }

    // Items modification only allowed while PENDING
    if (validatedData.items && validatedData.items.length && existingRequest.status === 'PENDING') {
      const adds = validatedData.items.filter(i => i._action === 'add' || (!i.id && !i._action));
      const updates = validatedData.items.filter(i => i.id && (i._action === 'update' || !i._action));
      const deletes = validatedData.items.filter(i => i.id && i._action === 'delete');

      const inventoryIds = [...adds, ...updates].map(i => i.itemId).filter((v): v is string => !!v);
      if (inventoryIds.length) {
        const found = await prisma.inventoryItem.findMany({ where: { id: { in: inventoryIds } } });
        const foundSet = new Set(found.map(f => f.id));
        const missing = inventoryIds.filter(id => !foundSet.has(id));
        if (missing.length) {
          return NextResponse.json({ error: 'Some inventory items not found', missing }, { status: 404 });
        }
      }

      await prisma.$transaction(async (tx) => {
        if (Object.keys(updateData).length) {
          await tx.purchaseRequest.update({ where: { id: params.id }, data: updateData });
        }
        for (const a of adds) {
          await tx.purchaseRequestItem.create({ data: {
            purchaseRequestId: params.id,
            itemName: a.itemName,
            quantity: a.quantity,
            unit: a.unit,
            itemId: a.itemId,
          }});
        }
        for (const u of updates) {
          await tx.purchaseRequestItem.update({ where: { id: u.id! }, data: {
            itemName: u.itemName,
            quantity: u.quantity,
            unit: u.unit,
            itemId: u.itemId,
          }});
        }
        for (const d of deletes) {
          await tx.purchaseRequestItem.delete({ where: { id: d.id! } });
        }
      });
    } else if (Object.keys(updateData).length) {
      await prisma.purchaseRequest.update({ where: { id: params.id }, data: updateData });
    }

    const updatedRequest = await prisma.purchaseRequest.findUnique({
      where: { id: params.id },
      include: {
        requestedBy: { select: { id: true, name: true, username: true } },
        reviewedBy: { select: { id: true, name: true, username: true } },
        item: { select: { id: true, name: true, category: true, stock: true } },
        items: { select: { id: true, itemName: true, quantity: true, unit: true, itemId: true } },
      }
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating purchase request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/purchase-requests/[id] - Delete purchase request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingRequest = await prisma.purchaseRequest.findUnique({
      where: { id: params.id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Staff can only delete their own pending requests
    // Admins can delete any request
    if (
      session.user.role === 'STAFF' &&
      (existingRequest.requestedById !== session.user.id ||
        existingRequest.status !== 'PENDING')
    ) {
      return NextResponse.json(
        { error: 'Cannot delete this purchase request' },
        { status: 403 }
      );
    }

    await prisma.purchaseRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Purchase request deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
