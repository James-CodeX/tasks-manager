import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a default manager account
  const managerEmail = 'manager@workertracking.com';
  const managerPassword = 'manager123';
  const managerName = 'System Manager';

  // Check if manager already exists
  const existingManager = await prisma.user.findUnique({
    where: { email: managerEmail },
  });

  if (!existingManager) {
    const passwordHash = await hashPassword(managerPassword);
    
    const manager = await prisma.user.create({
      data: {
        email: managerEmail,
        passwordHash,
        fullName: managerName,
        role: 'MANAGER',
      },
    });

    console.log(`✓ Created manager account: ${manager.email}`);
    console.log(`  Password: ${managerPassword}`);
  } else {
    console.log('✓ Manager account already exists');
  }

  // Create a sample tasker account
  const taskerEmail = 'tasker@workertracking.com';
  const taskerPassword = 'tasker123';
  const taskerName = 'Sample Tasker';

  const existingTasker = await prisma.user.findUnique({
    where: { email: taskerEmail },
  });

  if (!existingTasker) {
    const passwordHash = await hashPassword(taskerPassword);
    
    const tasker = await prisma.user.create({
      data: {
        email: taskerEmail,
        passwordHash,
        fullName: taskerName,
        role: 'TASKER',
      },
    });

    console.log(`✓ Created tasker account: ${tasker.email}`);
    console.log(`  Password: ${taskerPassword}`);
  } else {
    console.log('✓ Tasker account already exists');
  }

  console.log('\nDatabase seeding completed!');
  console.log('\nLogin credentials:');
  console.log('Manager: manager@workertracking.com / manager123');
  console.log('Tasker: tasker@workertracking.com / tasker123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });