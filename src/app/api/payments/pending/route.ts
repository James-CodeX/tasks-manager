import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Only managers can view pending payments' },
        { status: 403 }
      );
    }

    const payments = await db.paymentRecord.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        tasker: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        periodEnd: 'asc',
      },
    });

    const totalAmount = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);

    return NextResponse.json({
      payments,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
