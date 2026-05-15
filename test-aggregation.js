const path = require('path');

async function testAggregation() {
  try {
    // Dynamic import to handle TypeScript modules
    const { aggregateAndStoreGigs, getRecentGigsFromDb } = await import(
      './lib/aggregation/gig-sources.ts'
    );

    console.log('Running gig aggregation...');
    const gigs = await aggregateAndStoreGigs();
    console.log(`✅ Aggregated and saved ${gigs.length} gigs.`);

    if (gigs.length > 0) {
      console.log('Sample gig:', gigs[0]);
    }

    const dbGigs = await getRecentGigsFromDb(5);
    console.log(`📊 Found ${dbGigs.length} gigs in database.`);

    if (dbGigs.length > 0) {
      console.log('Sample DB gig:', dbGigs[0]);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAggregation();
