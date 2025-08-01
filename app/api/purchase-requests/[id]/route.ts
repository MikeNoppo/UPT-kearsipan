import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating purchase request
const updatePurchaseRequestSchema = z.object({
  itemName: z.string().min(1, 'Item name is required').optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  reason: z.string().min(1, 'Reason is required').optional(),
  notes: z.string().optional(),
  itemId: z.string().optional(),
});

// Validation schema for reviewing purchase request (admin and staff)
const reviewPurchaseRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
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
    
    // Check if this is a review action (admin and staff can approve)
    if ('status' in body && (body.status === 'APPROVED' || body.status === 'REJECTED')) {
      // Both ADMINISTRATOR and STAFF can approve/reject requests
      if (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'STAFF') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const reviewData = reviewPurchaseRequestSchema.parse(body);

      // Check if purchase request exists and is pending
      const existingRequest = await prisma.purchaseRequest.findUnique({
        where: { id: params.id },
      });

      if (!existingRequest) {
        return NextResponse.json(
          { error: 'Purchase request not found' },
          { status: 404 }
        );
      }

      if (existingRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Purchase request has already been reviewed' },
          { status: 400 }
        );
      }

      const updatedRequest = await prisma.purchaseRequest.update({
        where: { id: params.id },
        data: {
          status: reviewData.status,
          notes: reviewData.notes,
          reviewedById: session.user.id,
          reviewDate: new Date(),
        },
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
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              stock: true,
            },
          },
        },
      });

      return NextResponse.json(updatedRequest);
    }

    // Regular update (staff can only update their own pending requests)
    const validatedData = updatePurchaseRequestSchema.parse(body);

    const existingRequest = await prisma.purchaseRequest.findUnique({
      where: { id: params.id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Staff can only update their own pending requests
    if (
      session.user.role === 'STAFF' &&
      (existingRequest.requestedById !== session.user.id ||
        existingRequest.status !== 'PENDING')
    ) {
      return NextResponse.json(
        { error: 'Cannot update this purchase request' },
        { status: 403 }
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

    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: params.id },
      data: validatedData,
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
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            stock: true,
          },
        },
      },
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
