import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const actualUser = await prisma.user.findUnique({
    where: { email: '5epmgllc@gmail.com' },
  });

  if (!actualUser) {
    console.warn('User with email 5epmgllc@gmail.com not found. No quotes seeded.');
    return;
  }

  await prisma.user.update({
    where: { email: '5epmgllc@gmail.com' },
    data: { subscriptionLevel: 'PRO' },
  });

  const adminEmail = '5epmgllc@gmail.com';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'SUPER_ADMIN', subscriptionLevel: 'PRO' },
    create: {
      email: adminEmail,
      name: 'Anthony Mrguru Feaster',
      password: await hash('changeme123', 12),
      role: 'SUPER_ADMIN',
      subscriptionLevel: 'PRO',
      isTrialActive: false,
      trialExpiresAt: new Date(),
    },
  });

  await prisma.quote.deleteMany();

  await prisma.quote.createMany({
    data: [
      {
        userId: actualUser.id,
        title: 'Website Redesign Quote',
        content: 'Redesign of client website with modern UI/UX.',
        status: 'draft',
      },
      {
        userId: actualUser.id,
        title: 'SEO Optimization Quote',
        content: 'Comprehensive SEO audit and optimization for e-commerce site.',
        status: 'sent',
      },
      {
        userId: actualUser.id,
        title: 'Mobile App Development Quote',
        content: 'Development of a cross-platform mobile app for food delivery.',
        status: 'accepted',
      },
    ],
  });

  console.log('Seeded mock quotes for your user!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
