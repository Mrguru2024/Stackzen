import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchEuropeLanguageJobs(): Promise<any[]> {
  const response = await axios.get('https://www.europelanguagejobs.com/api/jobs?...'); // adjust URL as needed
  const jobs = response.data.jobs || [];
  return jobs.map((job: any) => ({
    ...job,
    category: mapCategory('EuropeLanguageJobs', job.category || job.title),
    // ... other fields ...
  }));
}
