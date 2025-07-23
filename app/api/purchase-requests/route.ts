import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating purchase request
const createPurchaseRequestSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  reason: z.string().min(1, 'Reason is required'),
  itemId: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/purchase-requests - Get all purchase requests
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

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Only staff can see their own requests, admins can see all
    if (session.user.role === 'STAFF') {
      where.requestedById = session.user.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { requestedBy: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [purchaseRequests, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.purchaseRequest.count({ where }),
    ]);

    return NextResponse.json({
      purchaseRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/purchase-requests - Create new purchase request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPurchaseRequestSchema.parse(body);

    // Check if item exists in inventory (if itemId provided)
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

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        itemName: validatedData.itemName,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        reason: validatedData.reason,
        notes: validatedData.notes,
        requestedById: session.user.id,
        itemId: validatedData.itemId,
      },
      include: {
        requestedBy: {
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

    return NextResponse.json(purchaseRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating purchase request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
