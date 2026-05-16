import axios from 'axios';
import { mapCategory } from '../category-mapping';

interface JobicyApiJob {
  id?: string | number;
  url?: string;
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  published_at?: string;
  company?: string;
}

export async function fetchJobicyJobs(): Promise<any[]> {
  console.log('[Jobicy] Fetching jobs...');
  try {
    const res = await axios.get('https://jobicy.com/api/v2/remote-jobs?count=100&geo=usa');
    const jobs: JobicyApiJob[] =
      res.data && Array.isArray(res.data.jobs) ? res.data.jobs : [];
    console.log(`[Jobicy] Jobs fetched: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log('[Jobicy] Sample job:', jobs[0]);
    }
    return jobs.map(job => ({
      id: job.id || job.url || Math.random().toString(),
      title: job.title || 'Untitled',
      description: job.description || '',
      url: job.url || '',
      source: 'Jobicy',
      category: mapCategory('Jobicy', job.category),
      tradeType: 'Job',
      location: job.location || '',
      postedAt: job.published_at || new Date().toISOString(),
      company: job.company ? { name: job.company } : undefined,
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Jobicy] Fetch error:', msg);
    return [];
  }
}
