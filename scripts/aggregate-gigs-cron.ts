import { aggregateAndStoreGigs } from '../lib/aggregation/gig-sources';
import { PrismaClient } from '@prisma/client';
import { mapCategory } from '../lib/aggregation/category-mapping';
import { notifyOnCronFailure } from '../lib/notify';

async function main() {
  const now = new Date().toISOString();
  console.log(`[${now}] Running gig aggregation...`);
  try {
    const gigs = await aggregateAndStoreGigs();
    console.log(`[${now}] Aggregation complete. Total gigs saved: ${gigs.length}`);
  } catch (err: any) {
    console.error(`[${now}] Error during aggregation:`, err?.message || err);
    await notifyOnCronFailure('aggregate-gigs-cron', err);
    process.exit(1);
  }

  // Cleanup: Re-categorize jobs with source: 'unknown'
  const prisma = new PrismaClient();
  try {
    const unknowns = await prisma.gig.findMany({ where: { source: 'unknown' } });
    let updated = 0;
    for (const job of unknowns) {
      // Try to infer category from title/description
      const newCategory = mapCategory('unknown', job.title + ' ' + (job.description || ''));
      if (newCategory && newCategory !== job.category) {
        await prisma.gig.update({ where: { id: job.id }, data: { category: newCategory } });
        updated++;
      }
    }
    if (updated > 0) {
      console.log(`[${now}] Re-categorized ${updated} 'unknown' jobs.`);
    }
    await prisma.$disconnect();
  } catch (err: any) {
    console.error(`[${now}] Error during unknown job cleanup:`, err?.message || err);
    await notifyOnCronFailure('aggregate-gigs-cron (unknown job cleanup)', err);
    process.exit(1);
  }
  process.exit(0);
}

main();
