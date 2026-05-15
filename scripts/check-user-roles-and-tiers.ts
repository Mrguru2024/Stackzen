// @ts-nocheck
const { PrismaClient } = require('@prisma/client');

const _prisma = new PrismaClient();

async function main() {
  const _users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionLevel: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.table(
    users.map(u => ({
      Email: u.email,
      Name: u.name,
      Role: u.role,
      Subscription: u.subscriptionLevel,
      Created: u.createdAt.toISOString(),
      Updated: u.updatedAt.toISOString(),
    }))
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
