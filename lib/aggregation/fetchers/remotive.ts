import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchRemotiveJobs(): Promise<any[]> {
  const response = await axios.get('https://remotive.io/api/remote-jobs?...'); // adjust URL as needed
  const jobs = response.data.jobs || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('Remotive', job.category || job.title),
    // ... other fields ...
  }));
}
