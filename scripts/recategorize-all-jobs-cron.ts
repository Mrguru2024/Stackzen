import { execSync } from 'child_process';
import { notifyOnCronFailure } from '../lib/notify';

async function main() {
  const now = new Date().toISOString();
  console.log(`[${now}] Running recategorization of all jobs...`);
  try {
    execSync('npx tsx scripts/recategorize-all-jobs.ts', { stdio: 'inherit' });
    console.log(`[${now}] Recategorization complete.`);
  } catch (err) {
    console.error(`[${now}] Error during recategorization:`, err?.message || err);
    await notifyOnCronFailure('recategorize-all-jobs-cron', err);
    process.exit(1);
  }
  process.exit(0);
}

main();
