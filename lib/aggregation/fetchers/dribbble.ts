import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchDribbbleJobs(): Promise<any[]> {
  const response = await axios.get('https://api.dribbble.com/v2/jobs?...'); // adjust URL as needed
  const jobs = response.data || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('Dribbble', job.category || job.title),
    // ... other fields ...
  }));
}
