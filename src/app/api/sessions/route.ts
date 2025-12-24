import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status'); // 'active' or 'completed'

    const where: any = {};

    // Role-based filtering
    if (userRole === 'TASKER') {
      where.taskerId = userId;
    }

    // Account filter
    if (accountId) {
      where.accountId = accountId;
    }

    // Status filter
    if (status === 'active') {
      where.endTime = null;
    } else if (status === 'completed') {
      where.endTime = { not: null };
    }

    // Date range filter
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    const sessions = await db.workSession.findMany({
      where,
      include: {
        account: {
          select: {
            accountName: true,
            accountType: true,
            browserType: true,
          },
        },
        tasker: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Calculate totals
    const totals = sessions.reduce(
      (acc, session) => {
        if (session.totalHours) {
          acc.totalHours += session.totalHours;
        }
        if (session.totalPayment) {
          acc.totalPayment += session.totalPayment;
        }
        return acc;
      },
      { totalHours: 0, totalPayment: 0 }
    );

    return NextResponse.json({
      sessions,
      totals: {
        totalHours: Math.round(totals.totalHours * 100) / 100,
        totalPayment: Math.round(totals.totalPayment * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
