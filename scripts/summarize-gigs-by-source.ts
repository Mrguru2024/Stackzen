import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Group by source and count jobs
  const results = await prisma.gig.groupBy({
    by: ['source'],
    _count: { source: true },
  });

  console.log('--- Job Counts by Source ---');
  results.forEach(r => {
    console.log(`${r.source}: ${r._count.source}`);
  });

  // Optionally, show the most recent job for each source
  for (const r of results) {
    const latest = await prisma.gig.findFirst({
      where: { source: r.source },
      orderBy: { postedAt: 'desc' },
    });
    if (latest) {
      console.log(`Latest for ${r.source}: ${latest.title} (${latest.postedAt})`);
    }
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
