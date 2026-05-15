import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.gig.findMany({
    where: {
      category: { in: ['Other', 'unknown', ''] },
    },
    orderBy: { postedAt: 'desc' },
  });

  if (jobs.length === 0) {
    console.log('All jobs are categorized!');
    return;
  }

  console.log(`Found ${jobs.length} uncategorized jobs:`);
  for (const job of jobs) {
    console.log(
      `- [${job.id}] ${job.title} | Source: ${job.source} | Category: ${job.category || 'N/A'}`
    );
    if (job.description) {
      console.log(`  Desc: ${job.description.slice(0, 120).replace(/\n/g, ' ')}...`);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
