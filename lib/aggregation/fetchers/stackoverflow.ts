import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchStackOverflowJobs(): Promise<any[]> {
  const response = await axios.get('https://stackoverflow.com/jobs/feed?...'); // adjust URL as needed
  const jobs = response.data.jobs || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('StackOverflow', job.category || job.title),
    // ... other fields ...
  }));
}
