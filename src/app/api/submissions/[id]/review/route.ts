import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
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
        { error: 'Only managers can review submissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, notes } = reviewSchema.parse(body);

    const submission = await db.taskSubmission.findUnique({
      where: { id: params.id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Submission has already been reviewed' },
        { status: 400 }
      );
    }

    const updatedSubmission = await db.taskSubmission.update({
      where: { id: params.id },
      data: {
        status,
        notes,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        account: {
          select: {
            accountName: true,
            accountType: true,
          },
        },
        tasker: {
          select: {
            fullName: true,
            email: true,
          },
        },
        reviewer: {
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
        action: `task_submission_${status.toLowerCase()}`,
        entityType: 'task_submission',
        entityId: params.id,
        changes: {
          status,
          notes,
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Review submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
