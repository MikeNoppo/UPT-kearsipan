import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema (legacy single-item OR new multi-items). At least one of itemName or items must be provided.
const purchaseRequestItemSchema = z.object({
  itemName: z.string().min(1),
  quantity: z.number().min(1),
  unit: z.string().min(1),
  itemId: z.string().optional(),
});

const createPurchaseRequestSchema = z.object({
  // Legacy fields (single item)
  itemName: z.string().min(1, 'Item name is required').optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  itemId: z.string().optional(),
  // New multi-items array
  items: z.array(purchaseRequestItemSchema).optional(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
}).refine(data => {
  // Valid if legacy single-item present OR items array with length
  const legacyComplete = !!(data.itemName && data.quantity && data.unit);
  const hasItemsArray = Array.isArray(data.items) && data.items.length > 0;
  return legacyComplete || hasItemsArray;
}, { message: 'Provide either single item fields or items[] array with at least one item.' });

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

    // Role-based access: Baik Staff maupun Admin dapat melihat semua permintaan pembelian
    // Tidak ada pembatasan berdasarkan user ID - semua permintaan dapat dilihat

    // Filter berdasarkan status permintaan
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Filter pencarian teks: cari di kolom request utama dan juga pada items anak
    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } }, // legacy
        { reason: { contains: search, mode: 'insensitive' } },
        { requestedBy: { name: { contains: search, mode: 'insensitive' } } },
        { items: { some: { itemName: { contains: search, mode: 'insensitive' } } } },
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
          item: { // legacy single-item linkage
            select: { id: true, name: true, category: true, stock: true },
          },
          items: { // multi items
            select: { id: true, itemName: true, quantity: true, unit: true, itemId: true }
          }
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

    // Validate existence of referenced inventory items (single or multi)
    const inventoryIdsToCheck: string[] = [];
    if (validatedData.itemId) inventoryIdsToCheck.push(validatedData.itemId);
    if (validatedData.items) {
      validatedData.items.forEach(i => { if (i.itemId) inventoryIdsToCheck.push(i.itemId); });
    }
    if (inventoryIdsToCheck.length) {
      const existing = await prisma.inventoryItem.findMany({ where: { id: { in: inventoryIdsToCheck } } });
      const existingIds = new Set(existing.map(e => e.id));
      const missing = inventoryIdsToCheck.filter(id => !existingIds.has(id));
      if (missing.length) {
        return NextResponse.json({ error: 'Some inventory items not found', missing }, { status: 404 });
      }
    }

    // Generate request number with sequential numbering: PR-YYYY-MM-XXX
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    let purchaseRequest;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        // Get the latest request number for current year-month to determine next sequence
        const latestRequest = await prisma.purchaseRequest.findFirst({
          where: {
            requestNumber: {
              startsWith: `PR-${year}-${month}-`,
            },
          },
          orderBy: {
            requestNumber: 'desc',
          },
        });

        let nextSequence = 1;
        if (latestRequest) {
          // Extract sequence number from the latest request number
          const latestSequence = latestRequest.requestNumber.split('-')[3];
          nextSequence = parseInt(latestSequence) + 1;
        }

        const sequenceNumber = String(nextSequence).padStart(3, '0');
        const requestNumber = `PR-${year}-${month}-${sequenceNumber}`;

        purchaseRequest = await prisma.purchaseRequest.create({
          data: {
            requestNumber,
            // Legacy single-item fields (optional if multi used)
            itemName: validatedData.itemName ?? '',
            quantity: validatedData.quantity ?? 0,
            unit: validatedData.unit ?? '',
            reason: validatedData.reason,
            notes: validatedData.notes,
            requestedById: session.user.id,
            itemId: validatedData.itemId,
            items: validatedData.items && validatedData.items.length ? {
              create: validatedData.items.map(it => ({
                itemName: it.itemName,
                quantity: it.quantity,
                unit: it.unit,
                itemId: it.itemId,
              }))
            } : undefined,
          },
          include: {
            requestedBy: { select: { id: true, name: true, username: true } },
            item: { select: { id: true, name: true, category: true, stock: true } },
            items: { select: { id: true, itemName: true, quantity: true, unit: true, itemId: true } }
          },
        });

        // If successful, break out of retry loop
        break;
      } catch (dbError: any) {
        // If it's a unique constraint error, retry with new sequence number
        if (dbError.code === 'P2002' && dbError.meta?.target?.includes('requestNumber')) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('Unable to generate unique request number after multiple attempts');
          }
          // Add small delay to reduce race condition likelihood
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        // If it's a different error, throw it
        throw dbError;
      }
    }

    if (!purchaseRequest) {
      throw new Error('Failed to create purchase request');
    }

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

// DELETE /api/purchase-requests - Delete purchase request
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
        { error: 'Purchase request ID is required' },
        { status: 400 }
      );
    }

    // Check if purchase request exists
    const existingRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: { id: true, role: true },
        },
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Authorization check: Only admin or the requester can delete
    const canDelete = 
      session.user.role === 'ADMIN' || 
      session.user.id === existingRequest.requestedById;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this request' },
        { status: 403 }
      );
    }

    // Check if request can be deleted (only PENDING, REJECTED, or APPROVED requests)
    // RECEIVED requests cannot be deleted as they may have inventory implications
    if (!['PENDING', 'REJECTED', 'APPROVED'].includes(existingRequest.status)) {
      return NextResponse.json(
        { error: 'Cannot delete received requests' },
        { status: 400 }
      );
    }

    // Check if there are any related receptions
    const relatedReceptions = await prisma.reception.findMany({
      where: { purchaseRequestId: id },
    });

    if (relatedReceptions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete request that has related receptions' },
        { status: 400 }
      );
    }

    // Delete purchase request
    await prisma.purchaseRequest.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Purchase request deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting purchase request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
