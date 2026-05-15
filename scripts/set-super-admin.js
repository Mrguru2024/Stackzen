const { PrismaClient } = require('@prisma/client');
const _prisma = new PrismaClient();

async function main() {
  const _user = await prisma.user.update({
    where: { email: '5epmgllc@gmail.com' },
    data: { role: 'SUPER_ADMIN' },
  });
  console.log('User updated to SUPER_ADMIN:', user.email, user.role);
}

main().finally(() => prisma.$disconnect());
