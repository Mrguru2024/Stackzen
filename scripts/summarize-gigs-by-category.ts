import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Group by category and count jobs
  const results = await prisma.gig.groupBy({
    by: ['category'],
    _count: { category: true },
  });

  console.log('--- Job Counts by Category ---');
  results.forEach(r => {
    console.log(`${r.category}: ${r._count.category}`);
  });

  // Optionally, show the most recent job for each category
  for (const r of results) {
    const latest = await prisma.gig.findFirst({
      where: { category: r.category },
      orderBy: { postedAt: 'desc' },
    });
    if (latest) {
      console.log(`Latest for ${r.category}: ${latest.title} (${latest.postedAt})`);
    }
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
