import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchReedJobs(): Promise<any[]> {
  const response = await axios.get('https://www.reed.co.uk/api/1.0/search?...'); // adjust URL as needed
  const jobs = response.data.results || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('Reed', job.category || job.title),
    // ... other fields ...
  }));
}
