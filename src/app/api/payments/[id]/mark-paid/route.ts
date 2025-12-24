import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const markPaidSchema = z.object({
  notes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Only managers can mark payments as paid' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notes } = markPaidSchema.parse(body);

    const payment = await db.paymentRecord.findUnique({
      where: { id: params.id },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'PAID') {
      return NextResponse.json(
        { error: 'Payment has already been marked as paid' },
        { status: 400 }
      );
    }

    if (payment.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot mark cancelled payment as paid' },
        { status: 400 }
      );
    }

    const updatedPayment = await db.paymentRecord.update({
      where: { id: params.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidBy: userId,
        notes: notes || payment.notes,
      },
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
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: 'payment_marked_paid',
        entityType: 'payment_record',
        entityId: params.id,
        changes: {
          status: 'PAID',
          paidAt: updatedPayment.paidAt?.toISOString(),
          notes,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Mark payment as paid error:', error);
    
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
