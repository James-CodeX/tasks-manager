import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const generatePaymentSchema = z.object({
  taskerId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Only managers can generate payments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { taskerId, periodStart, periodEnd } = generatePaymentSchema.parse(body);

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    // Validate dates
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if tasker exists
    const tasker = await db.user.findUnique({
      where: { id: taskerId },
    });

    if (!tasker || tasker.role !== 'TASKER') {
      return NextResponse.json(
        { error: 'Tasker not found' },
        { status: 404 }
      );
    }

    // Check for existing payment record
    const existingPayment = await db.paymentRecord.findUnique({
      where: {
        taskerId_periodStart_periodEnd: {
          taskerId,
          periodStart: startDate,
          periodEnd: endDate,
        },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment record already exists for this period' },
        { status: 400 }
      );
    }

    // Get all completed work sessions in the period
    const sessions = await db.workSession.findMany({
      where: {
        taskerId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        endTime: {
          not: null,
        },
      },
      include: {
        account: {
          select: {
            accountName: true,
          },
        },
      },
    });

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'No completed work sessions found in this period' },
        { status: 400 }
      );
    }

    // Calculate totals
    const totalHours = sessions.reduce((sum, session) => sum + (session.totalHours || 0), 0);
    const totalAmount = sessions.reduce((sum, session) => sum + (session.totalPayment || 0), 0);

    // Create payment record
    const payment = await db.paymentRecord.create({
      data: {
        taskerId,
        periodStart: startDate,
        periodEnd: endDate,
        totalHours: Math.round(totalHours * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
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
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: 'payment_generated',
        entityType: 'payment_record',
        entityId: payment.id,
        changes: {
          taskerId,
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
          totalHours,
          totalAmount,
          sessionCount: sessions.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      payment,
      sessionCount: sessions.length,
    });
  } catch (error) {
    console.error('Generate payment error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
