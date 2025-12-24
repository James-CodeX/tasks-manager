import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Only managers can view pending submissions' },
        { status: 403 }
      );
    }

    const submissions = await db.taskSubmission.findMany({
      where: {
        status: 'PENDING',
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
      orderBy: {
        submittedAt: 'asc',
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Get pending submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
