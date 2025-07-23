import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/purchase-requests/export - Export purchase requests data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json or csv
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Record<string, unknown> = {};

    // Only staff can export their own requests, admins can export all
    if (session.user.role === 'STAFF') {
      where.requestedById = session.user.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.requestDate = {} as Record<string, Date>;
      if (startDate) {
        (where.requestDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.requestDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const purchaseRequests = await prisma.purchaseRequest.findMany({
      where,
      orderBy: { requestDate: 'desc' },
      include: {
        requestedBy: {
          select: {
            name: true,
            username: true,
          },
        },
        reviewedBy: {
          select: {
            name: true,
            username: true,
          },
        },
        item: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = [
        'ID',
        'Item Name',
        'Quantity',
        'Unit',
        'Reason',
        'Status',
        'Requested By',
        'Request Date',
        'Reviewed By',
        'Review Date',
        'Notes',
      ];

      const csvRows = purchaseRequests.map((request) => [
        request.id,
        request.itemName,
        request.quantity,
        request.unit,
        request.reason,
        request.status,
        request.requestedBy.name,
        request.requestDate.toISOString().split('T')[0],
        request.reviewedBy?.name || '',
        request.reviewDate?.toISOString().split('T')[0] || '',
        request.notes || '',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row: (string | number)[]) => row.map((field: string | number) => `"${field}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="purchase-requests-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      data: purchaseRequests,
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: purchaseRequests.length,
        filters: {
          status,
          startDate,
          endDate,
        },
        exportedBy: {
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
        },
      },
    });
  } catch (error) {
    console.error('Error exporting purchase requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
