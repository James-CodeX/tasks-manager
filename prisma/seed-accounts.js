const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAccounts() {
  console.log('Seeding accounts...');

  // Get manager and tasker users
  const manager = await prisma.user.findUnique({
    where: { email: 'manager@workertracking.com' },
  });

  const tasker = await prisma.user.findUnique({
    where: { email: 'tasker@workertracking.com' },
  });

  if (!manager || !tasker) {
    console.log('Manager or tasker not found. Please run db:seed first.');
    return;
  }

  // Create sample accounts
  const accounts = [
    {
      accountName: 'Outlier Account 1',
      accountType: 'OUTLIER',
      browserType: 'IX_BROWSER',
      hourlyRate: 15.50,
      taskerId: tasker.id,
      createdBy: manager.id,
    },
    {
      accountName: 'Handshake Account 1',
      accountType: 'HANDSHAKE',
      browserType: 'GOLOGIN',
      hourlyRate: 12.75,
      taskerId: null, // Unassigned
      createdBy: manager.id,
    },
    {
      accountName: 'Outlier Account 2',
      accountType: 'OUTLIER',
      browserType: 'MORELOGIN',
      hourlyRate: 18.00,
      taskerId: null, // Unassigned
      createdBy: manager.id,
    },
  ];

  for (const accountData of accounts) {
    const existingAccount = await prisma.account.findFirst({
      where: { accountName: accountData.accountName },
    });

    if (!existingAccount) {
      const account = await prisma.account.create({
        data: accountData,
      });
      console.log(`✓ Created account: ${account.accountName}`);
    } else {
      console.log(`✓ Account already exists: ${accountData.accountName}`);
    }
  }

  console.log('\nAccount seeding completed!');
}

seedAccounts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });