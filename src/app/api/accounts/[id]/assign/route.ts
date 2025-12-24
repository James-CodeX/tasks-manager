import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const assignAccountSchema = z.object({
  taskerId: z.string().nullable(),
});

// Middleware to check if user is manager
async function checkManagerRole(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (decoded.role !== 'MANAGER') {
    return null;
  }

  return decoded;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const decoded = await checkManagerRole(request);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Manager role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { taskerId } = assignAccountSchema.parse(body);

    // Check if account exists
    const account = await db.account.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // If assigning to a tasker, validate the tasker
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

    // Update account assignment
    const updatedAccount = await db.account.update({
      where: { id },
      data: { taskerId },
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
        action: 'account_assigned',
        entityType: 'account',
        entityId: id,
        changes: {
          before: { taskerId: account.taskerId },
          after: { taskerId },
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ account: updatedAccount });
  } catch (error) {
    console.error('Assign account error:', error);
    
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