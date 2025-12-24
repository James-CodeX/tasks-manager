import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'TASKER') {
      return NextResponse.json(
        { error: 'This endpoint is for taskers only' },
        { status: 403 }
      );
    }

    const submissions = await db.taskSubmission.findMany({
      where: {
        taskerId: userId,
      },
      include: {
        account: {
          select: {
            accountName: true,
            accountType: true,
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
    console.error('Get my submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
