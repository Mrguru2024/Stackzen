import axios from 'axios';
import { mapCategory } from '../category-mapping';

export async function fetchFreelancerGigs(): Promise<any[]> {
  const API_KEY = process.env.FREELANCER_API_KEY;
  if (!API_KEY) throw new Error('Freelancer API key not set in environment variables');
  const url = 'https://www.freelancer.com/api/projects/0.1/projects/all/?limit=20&job_details=true';
  const response = await axios.get(url, {
    headers: { 'Freelancer-Api-Key': API_KEY },
  });
  if (!response.data?.result?.projects) return [];
  return response.data.result.projects.map((proj: any) => ({
    id: String(proj.id),
    title: proj.title,
    description: proj.description,
    url: `https://www.freelancer.com/projects/${proj.seo_url}`,
    postedAt: new Date(proj.submitdate * 1000).toISOString(),
    source: 'Freelancer',
    category: mapCategory('Freelancer', proj.category || proj.title),
    tradeType: 'Freelance',
    location: proj.location?.country?.name || 'Remote',
  }));
}
