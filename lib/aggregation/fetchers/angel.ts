import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchAngelListJobs(): Promise<any[]> {
  const response = await axios.get('https://api.angel.co/1/jobs?...'); // adjust URL as needed
  const jobs = response.data.jobs || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('AngelList', job.category || job.title),
    // ... other fields ...
  }));
}
