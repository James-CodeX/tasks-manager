import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  accountType: z.enum(['OUTLIER', 'HANDSHAKE']),
  browserType: z.enum(['IX_BROWSER', 'GOLOGIN', 'MORELOGIN']),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  taskerId: z.number().nullable().optional(),
});

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
    const accountType = searchParams.get('accountType') as 'OUTLIER' | 'HANDSHAKE' | null;
    const browserType = searchParams.get('browserType') as 'IX_BROWSER' | 'GOLOGIN' | 'MORELOGIN' | null;
    const assigned = searchParams.get('assigned'); // 'true', 'false', or null
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (accountType) {
      where.accountType = accountType;
    }
    
    if (browserType) {
      where.browserType = browserType;
    }
    
    if (assigned === 'true') {
      where.taskerId = { not: null };
    } else if (assigned === 'false') {
      where.taskerId = null;
    }
    
    if (search) {
      where.accountName = { contains: search };
    }

    // Taskers can only see their assigned accounts
    if (userRole === 'TASKER') {
      where.taskerId = parseInt(userId);
    }

    const accounts = await db.account.findMany({
      where,
      include: {
        tasker: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
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
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || userRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Unauthorized - Manager role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { accountName, accountType, browserType, hourlyRate, taskerId } = createAccountSchema.parse(body);

    // Check if account name already exists
    const existingAccount = await db.account.findFirst({
      where: { accountName },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account with this name already exists' },
        { status: 400 }
      );
    }

    // If taskerId is provided, check if tasker exists and is a tasker
    if (taskerId) {
      const tasker = await db.user.findUnique({
        where: { id: taskerId },
      });

      if (!tasker || tasker.role !== 'TASKER') {
        return NextResponse.json(
          { error: 'Invalid tasker selected' },
          { status: 400 }
        );
      }
    }

    // Create account
    const account = await db.account.create({
      data: {
        accountName,
        accountType,
        browserType,
        hourlyRate,
        taskerId,
        createdBy: parseInt(userId),
      },
      include: {
        tasker: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'account_created',
        entityType: 'account',
        entityId: account.id,
        changes: {
          accountName,
          accountType,
          browserType,
          hourlyRate,
          taskerId,
          createdBy: decoded.userId,
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Create account error:', error);
    
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