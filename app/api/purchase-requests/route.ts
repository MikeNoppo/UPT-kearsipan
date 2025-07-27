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

// GET endpoint untuk mengambil semua permintaan pembelian
export async function GET(request: NextRequest) {
  try {
    // Verifikasi autentikasi user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parsing parameter query untuk pagination dan filter
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Rumus pagination offset
    const skip = (page - 1) * limit;

    // Build where clause dengan logic authorization
    const where: Record<string, unknown> = {};

    // Role-based access: Staff hanya lihat permintaan sendiri, Admin lihat semua
    if (session.user.role === 'STAFF') {
      where.requestedById = session.user.id;
    }

    // Filter berdasarkan status permintaan
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Filter pencarian teks multi-kolom menggunakan OR condition
    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { requestedBy: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Query database dengan join relasi menggunakan Promise.all untuk performa
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

// POST endpoint untuk membuat permintaan pembelian baru
export async function POST(request: NextRequest) {
  try {
    // Verifikasi autentikasi user session
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
