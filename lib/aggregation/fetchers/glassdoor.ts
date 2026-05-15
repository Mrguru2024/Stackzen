import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchGlassdoorJobs(): Promise<any[]> {
  const response = await axios.get('https://api.glassdoor.com/api/api.htm?...'); // adjust URL as needed
  const jobs = response.data.response.jobs || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('Glassdoor', job.category || job.title),
    // ... other fields ...
  }));
}
