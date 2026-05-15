import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchCareerjetJobs(): Promise<any[]> {
  const CAREERJET_API_KEY = process.env.CAREERJET_API_KEY;
  if (!CAREERJET_API_KEY) {
    console.error('[Careerjet] API key not set in environment variables');
    return [];
  }
  console.log('[Careerjet] Fetching jobs...');
  try {
    // Example: Fetch jobs from Careerjet API (replace with real endpoint/params)
    const res = await axios.get('https://api.careerjet.net/v1/jobs', {
      auth: { username: CAREERJET_API_KEY, password: '' },
      params: { locale_code: 'en_US', keywords: '', location: '', page: 1 },
    });
    const jobs = res.data && Array.isArray(res.data.jobs) ? res.data.jobs : [];
    console.log(`[Careerjet] Jobs fetched: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log('[Careerjet] Sample job:', jobs[0]);
    }
    return jobs.map(job => ({
      id: job.id || job.url || Math.random().toString(),
      title: job.title || 'Untitled',
      description: job.description || '',
      url: job.url || '',
      source: 'Careerjet',
      category: mapCategory('Careerjet', job.category),
      tradeType: 'Job',
      location: job.locations || '',
      postedAt: job.date || new Date().toISOString(),
      company: job.company ? { name: job.company } : undefined,
    }));
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.error('[Careerjet] Fetch error:', msg);
    return [];
  }
}
