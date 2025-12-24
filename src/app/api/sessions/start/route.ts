import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const startSessionSchema = z.object({
  accountId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'TASKER') {
      return NextResponse.json(
        { error: 'Only taskers can start work sessions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { accountId } = startSessionSchema.parse(body);

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

    // Validate tasker owns the account
    if (account.taskerId !== userId) {
      return NextResponse.json(
        { error: 'You can only start sessions for your assigned accounts' },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!account.isActive) {
      return NextResponse.json(
        { error: 'Cannot start session for inactive account' },
        { status: 400 }
      );
    }

    // Check for existing active session for this account
    const activeSession = await db.workSession.findFirst({
      where: {
        accountId,
        endTime: null,
      },
    });

    if (activeSession) {
      return NextResponse.json(
        { error: 'An active session already exists for this account' },
        { status: 400 }
      );
    }

    // Create new session with current hourly rate
    const session = await db.workSession.create({
      data: {
        accountId,
        taskerId: userId,
        startTime: new Date(),
        hourlyRate: account.hourlyRate,
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
        action: 'work_session_started',
        entityType: 'work_session',
        entityId: session.id,
        changes: {
          accountId,
          hourlyRate: account.hourlyRate,
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Start session error:', error);
    
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
