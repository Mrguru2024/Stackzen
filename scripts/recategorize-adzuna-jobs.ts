import { PrismaClient } from '@prisma/client';
import { mapCategory } from '../lib/aggregation/category-mapping';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.gig.findMany({ where: { source: 'Adzuna' } });
  let updated = 0;
  for (const job of jobs) {
    // Try to get the best tag (if available)
    let tag = '';
    if (job.skills && Array.isArray(job.skills) && job.skills.length > 0) {
      tag = job.skills[0];
    } else if (typeof job.skills === 'string') {
      tag = job.skills;
    }
    const newCategory = mapCategory('Adzuna', tag, job.title, job.description);
    if (newCategory && newCategory !== job.category) {
      await prisma.gig.update({ where: { id: job.id }, data: { category: newCategory } });
      updated++;
    }
  }
  console.log(`Recategorized ${updated} Adzuna jobs.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
