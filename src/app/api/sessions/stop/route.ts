import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const stopSessionSchema = z.object({
  sessionId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'TASKER') {
      return NextResponse.json(
        { error: 'Only taskers can stop work sessions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sessionId } = stopSessionSchema.parse(body);

    // Get session
    const session = await db.workSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate tasker owns the session
    if (session.taskerId !== userId) {
      return NextResponse.json(
        { error: 'You can only stop your own sessions' },
        { status: 403 }
      );
    }

    // Check if session is already stopped
    if (session.endTime) {
      return NextResponse.json(
        { error: 'Session has already been stopped' },
        { status: 400 }
      );
    }

    const endTime = new Date();
    const startTime = new Date(session.startTime);
    
    // Calculate total hours (difference in milliseconds / 1000 / 60 / 60)
    const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    // Calculate total payment
    const totalPayment = totalHours * session.hourlyRate;

    // Update session
    const updatedSession = await db.workSession.update({
      where: { id: sessionId },
      data: {
        endTime,
        totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
        totalPayment: Math.round(totalPayment * 100) / 100,
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
        action: 'work_session_stopped',
        entityType: 'work_session',
        entityId: sessionId,
        changes: {
          endTime: endTime.toISOString(),
          totalHours: updatedSession.totalHours,
          totalPayment: updatedSession.totalPayment,
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Stop session error:', error);
    
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
