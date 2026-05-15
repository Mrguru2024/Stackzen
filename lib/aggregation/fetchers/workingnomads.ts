import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchWorkingNomadsJobs(): Promise<any[]> {
  const response = await axios.get('https://www.workingnomads.co/jobs/api?...'); // adjust URL as needed
  const jobs = response.data.jobs || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('WorkingNomads', job.category || job.title),
    // ... other fields ...
  }));
}
