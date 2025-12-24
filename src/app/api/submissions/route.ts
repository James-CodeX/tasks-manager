import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const submissionSchema = z.object({
  accountId: z.string(),
  taskId: z.string().min(1),
  screenshotUrl: z.string().url(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { accountId, taskId, screenshotUrl, notes } = submissionSchema.parse(body);

    // Get account details
    const account = await db.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Validate account type is HANDSHAKE
    if (account.accountType !== 'HANDSHAKE') {
      return NextResponse.json(
        { error: 'Only Handshake accounts require task submissions' },
        { status: 400 }
      );
    }

    // Validate tasker owns the account
    if (account.taskerId !== userId) {
      return NextResponse.json(
        { error: 'You can only submit tasks for your assigned accounts' },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!account.isActive) {
      return NextResponse.json(
        { error: 'Cannot submit tasks for inactive accounts' },
        { status: 400 }
      );
    }

    // Create submission
    const submission = await db.taskSubmission.create({
      data: {
        accountId,
        taskerId: userId,
        taskId,
        screenshotUrl,
        notes,
        submittedAt: new Date(),
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
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: 'task_submission_created',
        entityType: 'task_submission',
        entityId: submission.id,
        changes: {
          accountId,
          taskId,
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Submit task error:', error);
    
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
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    // Role-based filtering
    if (userRole === 'TASKER') {
      where.taskerId = userId;
    }

    // Status filter
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    // Account filter
    if (accountId) {
      where.accountId = accountId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) {
        where.submittedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.submittedAt.lte = new Date(endDate);
      }
    }

    const submissions = await db.taskSubmission.findMany({
      where,
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
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
