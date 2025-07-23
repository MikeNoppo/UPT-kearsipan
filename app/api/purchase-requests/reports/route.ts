import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/purchase-requests/reports - Generate purchase request reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary'; // summary, detailed, trends
    const period = searchParams.get('period') || '30'; // days

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Build where clause based on user role
    const whereClause = session.user.role === 'STAFF' 
      ? { requestedById: session.user.id }
      : {};

    const periodWhereClause = {
      ...whereClause,
      requestDate: { gte: startDate },
    };

    if (reportType === 'summary') {
      const [
        totalRequests,
        periodRequests,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        avgProcessingTime,
      ] = await Promise.all([
        // Total requests all time
        prisma.purchaseRequest.count({ where: whereClause }),
        
        // Requests in period
        prisma.purchaseRequest.count({ where: periodWhereClause }),
        
        // Approved requests in period
        prisma.purchaseRequest.count({
          where: { ...periodWhereClause, status: 'APPROVED' },
        }),
        
        // Rejected requests in period
        prisma.purchaseRequest.count({
          where: { ...periodWhereClause, status: 'REJECTED' },
        }),
        
        // Pending requests
        prisma.purchaseRequest.count({
          where: { ...whereClause, status: 'PENDING' },
        }),
        
        // Average processing time
        prisma.purchaseRequest.findMany({
          where: {
            ...periodWhereClause,
            reviewDate: { not: null },
          },
          select: {
            requestDate: true,
            reviewDate: true,
          },
        }),
      ]);

      // Calculate average processing time in days
      const processingTimes = avgProcessingTime
        .filter(req => req.reviewDate)
        .map(req => {
          const diff = req.reviewDate!.getTime() - req.requestDate.getTime();
          return diff / (1000 * 60 * 60 * 24); // Convert to days
        });

      const avgProcessingDays = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      return NextResponse.json({
        reportType: 'summary',
        period: `${periodDays} days`,
        data: {
          totalRequests,
          periodRequests,
          approvedRequests,
          rejectedRequests,
          pendingRequests,
          approvalRate: (periodRequests - pendingRequests) > 0
            ? (approvedRequests / (periodRequests - pendingRequests)) * 100
            : 0,
          avgProcessingDays: Math.round(avgProcessingDays * 100) / 100,
        },
      });
    }

    if (reportType === 'detailed') {
      const requests = await prisma.purchaseRequest.findMany({
        where: periodWhereClause,
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
              stock: true,
            },
          },
        },
      });

      // Group by status
      const groupedByStatus = requests.reduce((acc, request) => {
        if (!acc[request.status]) {
          acc[request.status] = [];
        }
        acc[request.status].push(request);
        return acc;
      }, {} as Record<string, typeof requests>);

      return NextResponse.json({
        reportType: 'detailed',
        period: `${periodDays} days`,
        data: {
          requests,
          groupedByStatus,
          summary: {
            total: requests.length,
            pending: groupedByStatus.PENDING?.length || 0,
            approved: groupedByStatus.APPROVED?.length || 0,
            rejected: groupedByStatus.REJECTED?.length || 0,
          },
        },
      });
    }

    if (reportType === 'trends') {
      // Get daily trends for the period
      const dailyTrends = await prisma.$queryRaw`
        SELECT 
          DATE("requestDate") as date,
          COUNT(*)::integer as total,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END)::integer as pending,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END)::integer as approved,
          SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END)::integer as rejected
        FROM "purchase_requests"
        WHERE "requestDate" >= ${startDate}
        ${session.user.role === 'STAFF' ? 'AND "requestedById" = $1' : ''}
        GROUP BY DATE("requestDate")
        ORDER BY DATE("requestDate") ASC
      `;

      // Top requested items in period
      const topItems = await prisma.purchaseRequest.groupBy({
        by: ['itemName'],
        where: periodWhereClause,
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
      });

      return NextResponse.json({
        reportType: 'trends',
        period: `${periodDays} days`,
        data: {
          dailyTrends,
          topItems: topItems.map(item => ({
            itemName: item.itemName,
            requestCount: item._count.itemName,
            totalQuantity: item._sum.quantity || 0,
          })),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Error generating purchase request report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
