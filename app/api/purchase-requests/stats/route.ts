import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/purchase-requests/stats - Get purchase request statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause based on user role
    const whereClause = session.user.role === 'STAFF' 
      ? { requestedById: session.user.id }
      : {};

    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      requestsByMonth,
      topRequestedItems,
    ] = await Promise.all([
      // Total requests
      prisma.purchaseRequest.count({ where: whereClause }),
      
      // Pending requests
      prisma.purchaseRequest.count({
        where: { ...whereClause, status: 'PENDING' },
      }),
      
      // Approved requests
      prisma.purchaseRequest.count({
        where: { ...whereClause, status: 'APPROVED' },
      }),
      
      // Rejected requests
      prisma.purchaseRequest.count({
        where: { ...whereClause, status: 'REJECTED' },
      }),
      
      // Requests by month (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "requestDate") as month,
          COUNT(*)::integer as count,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END)::integer as pending,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END)::integer as approved,
          SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END)::integer as rejected
        FROM "purchase_requests"
        ${session.user.role === 'STAFF' ? 'WHERE "requestedById" = $1' : ''}
        WHERE "requestDate" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "requestDate")
        ORDER BY month DESC
      `,
      
      // Top requested items
      prisma.purchaseRequest.groupBy({
        by: ['itemName'],
        where: whereClause,
        _count: {
          itemName: true,
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _count: {
            itemName: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Recent activity (last 10 requests)
    const recentActivity = await prisma.purchaseRequest.findMany({
      where: whereClause,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        itemName: true,
        quantity: true,
        unit: true,
        status: true,
        requestDate: true,
        requestedBy: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    });

    // Rumus approval rate: (request disetujui / total yang direview) * 100
    // Formula untuk menghitung persentase tingkat persetujuan permintaan
    let approvalRate = null;
    if (session.user.role === 'ADMINISTRATOR') {
      const totalReviewed = approvedRequests + rejectedRequests;
      approvalRate = totalReviewed > 0 ? (approvedRequests / totalReviewed) * 100 : 0;
    }

    const stats = {
      summary: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
        approvalRate,
      },
      requestsByMonth,
      topRequestedItems: topRequestedItems.map(item => ({
        itemName: item.itemName,
        requestCount: item._count.itemName,
        totalQuantity: item._sum.quantity || 0,
      })),
      recentActivity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching purchase request statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
