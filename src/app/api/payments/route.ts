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
    const status = searchParams.get('status');
    const taskerId = searchParams.get('taskerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    // Role-based filtering
    if (userRole === 'TASKER') {
      where.taskerId = userId;
    } else if (taskerId) {
      where.taskerId = taskerId;
    }

    // Status filter
    if (status && ['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      where.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      where.periodStart = {};
      if (startDate) {
        where.periodStart.gte = new Date(startDate);
      }
      if (endDate) {
        where.periodStart.lte = new Date(endDate);
      }
    }

    const payments = await db.paymentRecord.findMany({
      where,
      include: {
        tasker: {
          select: {
            fullName: true,
            email: true,
          },
        },
        payer: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        periodStart: 'desc',
      },
    });

    // Calculate totals
    const totals = payments.reduce(
      (acc, payment) => {
        acc.totalHours += payment.totalHours;
        acc.totalAmount += payment.totalAmount;
        if (payment.status === 'PENDING') {
          acc.pendingAmount += payment.totalAmount;
        } else if (payment.status === 'PAID') {
          acc.paidAmount += payment.totalAmount;
        }
        return acc;
      },
      { totalHours: 0, totalAmount: 0, pendingAmount: 0, paidAmount: 0 }
    );

    return NextResponse.json({
      payments,
      totals: {
        totalHours: Math.round(totals.totalHours * 100) / 100,
        totalAmount: Math.round(totals.totalAmount * 100) / 100,
        pendingAmount: Math.round(totals.pendingAmount * 100) / 100,
        paidAmount: Math.round(totals.paidAmount * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
