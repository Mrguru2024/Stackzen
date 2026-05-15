require('dotenv').config();
const { fetchMonsterGigs } = require('../lib/aggregation/fetchers/monster.js');

fetchMonsterGigs().then((jobs) => {
  console.log('Fetched jobs:', jobs.length);
  if (jobs.length > 0) {
    console.log('Sample job:', jobs[0]);
  }
  process.exit(0);
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
}); 