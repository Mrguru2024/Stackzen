const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Total Monster jobs
  const total = await prisma.gig.count({ where: { source: 'Monster' } });
  console.log(`Total Monster jobs: ${total}`);

  // 5 most recent Monster jobs
  const recent = await prisma.gig.findMany({
    where: { source: 'Monster' },
    orderBy: { postedAt: 'desc' },
    take: 5,
    select: { id: true, title: true, category: true, postedAt: true },
  });
  console.log('\n5 most recent Monster jobs:');
  recent.forEach((job: any) => {
    console.log(
      `- [${job.category}] ${job.title} (id: ${job.id}, posted: ${job.postedAt.toISOString()})`
    );
  });

  // Count per category
  const byCategory = await prisma.gig.groupBy({
    by: ['category'],
    where: { source: 'Monster' },
    _count: { category: true },
  });
  console.log('\nMonster jobs by category:');
  byCategory.forEach((row: any) => {
    console.log(`- ${row.category}: ${row._count.category}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
