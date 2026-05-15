import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchZipRecruiterJobs(): Promise<any[]> {
  const response = await axios.get('https://api.ziprecruiter.com/jobs/v1?...'); // adjust URL as needed
  const jobs = response.data.jobs || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('ZipRecruiter', job.category || job.title),
    // ... other fields ...
  }));
}
