import { PrismaClient } from '@prisma/client';
import { mapCategory } from '../lib/aggregation/category-mapping';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.gig.findMany();
  let updated = 0;
  const updatedBySource: Record<string, number> = {};
  for (const job of jobs) {
    // Try to get the best tag/skill (if available)
    let tag = '';
    if (job.skills && Array.isArray(job.skills) && job.skills.length > 0) {
      tag = job.skills[0];
    } else if (typeof job.skills === 'string') {
      tag = job.skills;
    }
    const newCategory = mapCategory(job.source, tag, job.title, job.description);
    if (newCategory && newCategory !== job.category) {
      await prisma.gig.update({ where: { id: job.id }, data: { category: newCategory } });
      updated++;
      updatedBySource[job.source] = (updatedBySource[job.source] || 0) + 1;
    }
  }
  console.log(`Recategorized ${updated} jobs.`);
  Object.entries(updatedBySource).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
