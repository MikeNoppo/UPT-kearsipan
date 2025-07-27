import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reception/stats - Get reception statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalReceptions,
      completeReceptions,
      partialReceptions,
      differentReceptions,
      recentReceptions,
    ] = await Promise.all([
      prisma.reception.count(),
      prisma.reception.count({ where: { status: 'COMPLETE' } }),
      prisma.reception.count({ where: { status: 'PARTIAL' } }),
      prisma.reception.count({ where: { status: 'DIFFERENT' } }),
      prisma.reception.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          receivedBy: {
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
            },
          },
        },
      }),
    ]);

    // Rumus perhitungan completion rate: (penerimaan lengkap / total penerimaan) * 100
    // Formula ini mengukur efektivitas penerimaan barang dalam persentase
    const completionRate = totalReceptions > 0 
      ? Math.round((completeReceptions / totalReceptions) * 100) 
      : 0;

    // Kalkulasi tanggal 7 hari yang lalu untuk analisis trend
    // Menggunakan manipulasi Date object dengan pengurangan hari
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const receptionTrends = await prisma.reception.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        status: true,
      },
    });

    const trends = {
      COMPLETE: receptionTrends.find(t => t.status === 'COMPLETE')?._count.status || 0,
      PARTIAL: receptionTrends.find(t => t.status === 'PARTIAL')?._count.status || 0,
      DIFFERENT: receptionTrends.find(t => t.status === 'DIFFERENT')?._count.status || 0,
    };

    return NextResponse.json({
      totalReceptions,
      completeReceptions,
      partialReceptions,
      differentReceptions,
      completionRate,
      trends,
      recentReceptions,
    });
  } catch (error) {
    console.error('Error fetching reception statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
