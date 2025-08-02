import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET endpoint untuk mengambil permintaan pembelian yang sudah disetujui 
// tapi belum ada penerimaan barangnya (available for reception)
export async function GET(request: NextRequest) {
  try {
    // Verifikasi autentikasi user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil purchase requests yang statusnya APPROVED (belum RECEIVED)
    const availablePurchaseRequests = await prisma.purchaseRequest.findMany({
      where: {
        status: 'APPROVED',
      },
      orderBy: { reviewDate: 'desc' },
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

    return NextResponse.json({
      purchaseRequests: availablePurchaseRequests,
      total: availablePurchaseRequests.length,
    });
  } catch (error) {
    console.error('Error fetching available purchase requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
