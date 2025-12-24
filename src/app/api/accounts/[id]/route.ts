import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const updateAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').optional(),
  accountType: z.enum(['OUTLIER', 'HANDSHAKE']).optional(),
  browserType: z.enum(['IX_BROWSER', 'GOLOGIN', 'MORELOGIN']).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').optional(),
  taskerId: z.number().nullable().optional(),
});

const assignAccountSchema = z.object({
  taskerId: z.number().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Taskers can only access their assigned accounts
    if (userRole === 'TASKER') {
      const account = await db.account.findUnique({
        where: { id },
      });

      if (!account || account.taskerId !== parseInt(userId)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    const account = await db.account.findUnique({
      where: { id },
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

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Get account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Unauthorized - Manager role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData = updateAccountSchema.parse(body);

    // Get current account for audit
    const currentAccount = await db.account.findUnique({
      where: { id },
    });

    if (!currentAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if account name is being changed and if it's already taken
    if (updateData.accountName && updateData.accountName !== currentAccount.accountName) {
      const existingAccount = await db.account.findFirst({
        where: { 
          accountName: updateData.accountName,
          id: { not: id }
        },
      });

      if (existingAccount) {
        return NextResponse.json(
          { error: 'Account with this name already exists' },
          { status: 400 }
        );
      }
    }

    // If taskerId is provided, validate it
    if (updateData.taskerId !== undefined) {
      if (updateData.taskerId) {
        const tasker = await db.user.findUnique({
          where: { id: updateData.taskerId },
        });

        if (!tasker || tasker.role !== 'TASKER') {
          return NextResponse.json(
            { error: 'Invalid tasker selected' },
            { status: 400 }
          );
        }
      }
    }

    // Update account
    const updatedAccount = await db.account.update({
      where: { id },
      data: updateData,
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
        userId: parseInt(userId),
        action: 'account_updated',
        entityType: 'account',
        entityId: id,
        changes: {
          before: {
            accountName: currentAccount.accountName,
            accountType: currentAccount.accountType,
            browserType: currentAccount.browserType,
            hourlyRate: currentAccount.hourlyRate,
            taskerId: currentAccount.taskerId,
          },
          after: updateData,
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ account: updatedAccount });
  } catch (error) {
    console.error('Update account error:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Unauthorized - Manager role required' },
        { status: 403 }
      );
    }

    // Check if account exists
    const currentAccount = await db.account.findUnique({
      where: { id },
    });

    if (!currentAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Soft delete (deactivate)
    await db.account.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: parseInt(userId),
        action: 'account_deactivated',
        entityType: 'account',
        entityId: id,
        changes: {
          before: { isActive: currentAccount.isActive },
          after: { isActive: false },
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}