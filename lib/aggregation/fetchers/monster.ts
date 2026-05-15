import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { mapCategory } from '../category-mapping';

export async function fetchMonsterGigs() {
  const MONSTER_CLIENT_ID = process.env.MONSTER_CLIENT_ID;
  const MONSTER_CLIENT_SECRET = process.env.MONSTER_CLIENT_SECRET;
  if (!MONSTER_CLIENT_ID || !MONSTER_CLIENT_SECRET) {
    throw new Error('Monster API credentials not set in environment variables');
  }

  console.log('[Monster] Fetching jobs...');

  try {
    // 1. Get OAuth2 access token
    const tokenRes = await axios.post(
      'https://api.monster.io/oauth/v1/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'A', // Adjust scope as needed
        client_id: MONSTER_CLIENT_ID,
        client_secret: MONSTER_CLIENT_SECRET,
      }),
      {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }
    );
    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error('Failed to obtain Monster access token');

    // 2. Fetch jobs feed with required query params
    const jobsRes = await axios.get('https://api.monster.io/adtech-job-distributor/v1/feed', {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'text',
      params: {
        country: 'US',
        category: 'JPW',
      },
    });

    let jobs = [];
    const rawType = typeof jobsRes.data;
    const rawSample = jobsRes.data?.slice?.(0, 200) || jobsRes.data;
    console.log('[Monster] Raw response type:', rawType);
    if (typeof jobsRes.data === 'string' && jobsRes.data.trim().startsWith('<?xml')) {
      console.log('[Monster] Detected XML response. Parsing...');
      try {
        const parsed = await parseStringPromise(jobsRes.data, { explicitArray: false });
        // Correct path: jobfeed.jobs.job (array) or jobfeed.jobs (single job)
        const jobfeed = parsed && parsed.jobfeed;
        if (jobfeed && jobfeed.jobs) {
          if (Array.isArray(jobfeed.jobs.job)) {
            jobs = jobfeed.jobs.job;
          } else if (jobfeed.jobs.job) {
            jobs = [jobfeed.jobs.job];
          } else if (Array.isArray(jobfeed.jobs)) {
            jobs = jobfeed.jobs;
          } else {
            jobs = [jobfeed.jobs];
          }
        } else {
          jobs = [];
        }
        console.log(`[Monster] Parsed XML jobs count: ${jobs.length}`);
      } catch (err) {
        const msg =
          typeof err === 'object' && err && 'message' in err ? (err as any).message : String(err);
        console.error('[Monster] Failed to parse XML:', msg);
        return [];
      }
    } else {
      // Try JSON parse if not already an object
      if (typeof jobsRes.data === 'string') {
        try {
          const json = JSON.parse(jobsRes.data);
          jobs = json.jobs || json || [];
        } catch (err) {
          const msg =
            typeof err === 'object' && err && 'message' in err ? (err as any).message : String(err);
          console.error('[Monster] Failed to parse JSON:', msg);
          return [];
        }
      } else {
        jobs = jobsRes.data.jobs || jobsRes.data || [];
      }
      console.log(`[Monster] Parsed JSON jobs count: ${jobs.length}`);
    }
    if (jobs.length > 0) {
      console.log('[Monster] Sample job:', jobs[0]);
    } else {
      console.log('[Monster] No jobs found in Monster response. Raw sample:', rawSample);
    }
    // Map to normalized job format
    return jobs.map(function (job: any) {
      return {
        id: job.refCode || job.id || job.jobId || job.guid || Math.random().toString(),
        title: job.title || 'Untitled',
        description: job.description || '',
        url: job.url || '',
        source: 'Monster',
        category: mapCategory('Monster', job.category),
        tradeType: 'Job',
        location: [job.city, job.state, job.country].filter(Boolean).join(', '),
        postedAt: job.postedDate || new Date().toISOString(),
        company: job.company ? { name: job.company } : undefined,
        postalCode: job.postalCode,
        cpc: job.cpc,
        // Add more fields as needed
      };
    });
  } catch (err) {
    const msg =
      typeof err === 'object' && err && 'message' in err ? (err as any).message : String(err);
    console.error('[Monster] Fetch error:', msg);
    return [];
  }
}
