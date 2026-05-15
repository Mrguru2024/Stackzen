import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchGitHubJobs(): Promise<any[]> {
  const response = await axios.get('https://jobs.github.com/positions.json?...'); // adjust URL as needed
  const jobs = response.data || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('GitHub', job.category || job.title),
    // ... other fields ...
  }));
}
