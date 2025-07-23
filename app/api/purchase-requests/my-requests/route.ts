import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/purchase-requests/my-requests - Get current user's requests
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

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      requestedById: session.user.id,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [purchaseRequests, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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

    // Get summary stats for user's requests
    const [totalRequests, pendingRequests, approvedRequests, rejectedRequests] = await Promise.all([
      prisma.purchaseRequest.count({ where: { requestedById: session.user.id } }),
      prisma.purchaseRequest.count({ where: { requestedById: session.user.id, status: 'PENDING' } }),
      prisma.purchaseRequest.count({ where: { requestedById: session.user.id, status: 'APPROVED' } }),
      prisma.purchaseRequest.count({ where: { requestedById: session.user.id, status: 'REJECTED' } }),
    ]);

    return NextResponse.json({
      purchaseRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching user purchase requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
