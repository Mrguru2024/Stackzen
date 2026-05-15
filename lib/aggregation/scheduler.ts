const cron = require('node-cron');
const { fetchRemoteOKWebGigs } = require('./fetchers/remoteok.ts');
const { fetchRemotiveGigs } = require('./fetchers/remotive.ts');
const { fetchProBloggerGigs } = require('./fetchers/problogger.ts');
// const { fetchCraigslistSFWritingGigs } = require('./fetchers/craigslist.ts');
// import { fetchFreelancerGigs } from './fetchFreelancerGigs';
// import more fetchers as needed

async function runAllFetchers() {
  try {
    console.log('[Scheduler] Running gig aggregation fetchers...');
    await fetchRemoteOKWebGigs();
    await fetchRemotiveGigs();
    await fetchProBloggerGigs();
    // await fetchCraigslistSFWritingGigs();
    // await fetchFreelancerGigs();
    // ...add more as needed
    console.log('[Scheduler] All fetchers completed successfully.');
  } catch (err) {
    console.error('[Scheduler] Error running fetchers:', err);
  }
}

// Run every 12 hours
cron.schedule('0 */12 * * *', async () => {
  await runAllFetchers();
});

// For manual run
if (require.main === module) {
  runAllFetchers();
}
