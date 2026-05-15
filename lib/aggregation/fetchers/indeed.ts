import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchIndeedJobs(): Promise<any[]> {
  const response = await axios.get('https://api.indeed.com/ads/apisearch?...'); // adjust URL as needed
  const jobs = response.data.results || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('Indeed', job.category || job.title),
    // ... other fields ...
  }));
}
