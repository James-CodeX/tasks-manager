import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Only managers can export payments' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (status && ['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      where.status = status;
    }

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
          },
        },
      },
      orderBy: {
        periodStart: 'desc',
      },
    });

    // Generate CSV
    const headers = [
      'Payment ID',
      'Tasker Name',
      'Tasker Email',
      'Period Start',
      'Period End',
      'Total Hours',
      'Total Amount',
      'Status',
      'Paid At',
      'Paid By',
      'Notes',
    ];

    const rows = payments.map(payment => [
      payment.id,
      payment.tasker.fullName,
      payment.tasker.email,
      format(new Date(payment.periodStart), 'yyyy-MM-dd'),
      format(new Date(payment.periodEnd), 'yyyy-MM-dd'),
      payment.totalHours.toString(),
      payment.totalAmount.toString(),
      payment.status,
      payment.paidAt ? format(new Date(payment.paidAt), 'yyyy-MM-dd HH:mm') : '',
      payment.payer?.fullName || '',
      payment.notes || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payments-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
