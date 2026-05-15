const { aggregateAndStoreGigs, getRecentGigsFromDb } = require('../lib/aggregation/gig-sources');

async function main() {
  console.log('Running gig aggregation...');
  const gigs = await aggregateAndStoreGigs();
  console.log(`Aggregated and saved ${gigs.length} gigs.`);

  const dbGigs = await getRecentGigsFromDb(5);
  console.log('Sample gigs from DB:', dbGigs);
}

main().catch((err) => {
  console.error('Error running gig aggregation test:', err);
  process.exit(1);
}); 