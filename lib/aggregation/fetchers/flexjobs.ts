import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchFlexJobs(): Promise<any[]> {
  const response = await axios.get('https://www.flexjobs.com/api/jobs?...'); // adjust URL as needed
  const jobs = response.data.jobs || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('FlexJobs', job.category || job.title),
    // ... other fields ...
  }));
}
