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

    const where: any = {
      endTime: null, // Only active sessions
    };

    // Role-based filtering
    if (userRole === 'TASKER') {
      where.taskerId = userId;
    }

    const sessions = await db.workSession.findMany({
      where,
      include: {
        account: {
          select: {
            accountName: true,
            accountType: true,
            browserType: true,
          },
        },
        tasker: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Get active sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
