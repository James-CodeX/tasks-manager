import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'TASKER') {
      return NextResponse.json(
        { error: 'Unauthorized - Tasker role required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get('accountType') as 'OUTLIER' | 'HANDSHAKE' | null;
    const browserType = searchParams.get('browserType') as 'IX_BROWSER' | 'GOLOGIN' | 'MORELOGIN' | null;
    const search = searchParams.get('search');

    // Build where clause - taskers can only see their assigned accounts
    const where: any = {
      taskerId: parseInt(userId),
      isActive: true,
    };
    
    if (accountType) {
      where.accountType = accountType;
    }
    
    if (browserType) {
      where.browserType = browserType;
    }
    
    if (search) {
      where.accountName = { contains: search };
    }

    const accounts = await db.account.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Get my accounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}