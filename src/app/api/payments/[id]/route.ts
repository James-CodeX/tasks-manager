import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payment = await db.paymentRecord.findUnique({
      where: { id: params.id },
      include: {
        tasker: {
          select: {
            id: true,
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
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Taskers can only view their own payments
    if (userRole === 'TASKER' && payment.taskerId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get related work sessions
    const sessions = await db.workSession.findMany({
      where: {
        taskerId: payment.taskerId,
        startTime: {
          gte: payment.periodStart,
          lte: payment.periodEnd,
        },
        endTime: {
          not: null,
        },
      },
      include: {
        account: {
          select: {
            accountName: true,
            accountType: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({
      payment,
      sessions,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
