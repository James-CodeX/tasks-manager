import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Middleware to check if user is tasker
async function checkTaskerRole(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (decoded.role !== 'TASKER') {
    return null;
  }

  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await checkTaskerRole(request);
    
    if (!decoded) {
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
      taskerId: decoded.userId,
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