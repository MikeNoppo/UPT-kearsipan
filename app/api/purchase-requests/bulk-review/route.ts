import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for bulk review
const bulkReviewSchema = z.object({
  requestIds: z.array(z.string()).min(1, 'At least one request ID is required'),
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
});

// POST /api/purchase-requests/bulk-review - Bulk approve/reject requests (admin and staff)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = bulkReviewSchema.parse(body);

    // Check if all requests exist and are pending
    const existingRequests = await prisma.purchaseRequest.findMany({
      where: {
        id: { in: validatedData.requestIds },
        status: 'PENDING',
      },
    });

    if (existingRequests.length !== validatedData.requestIds.length) {
      return NextResponse.json(
        { error: 'Some requests not found or already reviewed' },
        { status: 400 }
      );
    }

    const status = validatedData.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Update all requests in a transaction
    const updatedRequests = await prisma.$transaction(
      validatedData.requestIds.map(id =>
        prisma.purchaseRequest.update({
          where: { id },
          data: {
            status,
            notes: validatedData.notes,
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
        })
      )
    );

    return NextResponse.json({
      message: `Successfully ${validatedData.action.toLowerCase()}ed ${updatedRequests.length} requests`,
      updatedRequests,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in bulk review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
