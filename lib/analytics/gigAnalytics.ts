import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface GigAnalytics {
  totalGigs: number;
  activeGigs: number;
  totalApplications: number;
  averageApplicationsPerGig: number;
  popularCategories: Array<{ category: string; count: number }>;
  averageBudget: number;
  completionRate: number;
  topSkills: Array<{ skill: string; count: number }>;
}

export async function getGigAnalytics(userId?: string): Promise<GigAnalytics> {
  const whereClause = userId ? { posted_by: userId } : {};

  // Get total and active gigs
  const { count: totalGigs } = await supabase
    .from('stackzen_gigs')
    .select('*', { count: 'exact', head: true })
    .match(whereClause);

  const { count: activeGigs } = await supabase
    .from('stackzen_gigs')
    .select('*', { count: 'exact', head: true })
    .match({ ...whereClause, status: 'ACTIVE' });

  // Get total applications
  const { count: totalApplications } = await supabase
    .from('gig_applications')
    .select('*', { count: 'exact', head: true })
    .match({ gig_id: whereClause.posted_by });

  // Get popular categories
  const { data: categories } = await supabase
    .from('stackzen_gigs')
    .select('category')
    .match(whereClause);

  const categoryCounts =
    categories?.reduce(
      (acc, gig) => {
        acc[gig.category] = (acc[gig.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  const popularCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get average budget
  const { data: budgetStats } = await supabase
    .from('stackzen_gigs')
    .select('budget')
    .match(whereClause);

  const averageBudget = budgetStats?.length
    ? budgetStats.reduce((sum, gig) => sum + gig.budget, 0) / budgetStats.length
    : 0;

  // Get completion rate
  const { count: completedGigs } = await supabase
    .from('stackzen_gigs')
    .select('*', { count: 'exact', head: true })
    .match({ ...whereClause, status: 'COMPLETED' });

  // Get top skills
  const { data: skills } = await supabase.from('stackzen_gigs').select('skills').match(whereClause);

  const skillCounts =
    skills?.reduce(
      (acc, gig) => {
        gig.skills.forEach((skill: string) => {
          acc[skill] = (acc[skill] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  const topSkills = Object.entries(skillCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalGigs: totalGigs || 0,
    activeGigs: activeGigs || 0,
    totalApplications: totalApplications || 0,
    averageApplicationsPerGig: totalGigs ? (totalApplications || 0) / totalGigs : 0,
    popularCategories,
    averageBudget,
    completionRate: totalGigs ? ((completedGigs || 0) / totalGigs) * 100 : 0,
    topSkills,
  };
}

export async function getGigRecommendations(userId: string) {
  // Get user's skills and preferences
  const { data: user } = await supabase
    .from('users')
    .select('skills, favorite_gig_ids')
    .eq('id', userId)
    .single();

  if (!user) return [];

  // Get gigs that match user's skills
  const { data: recommendedGigs } = await supabase
    .from('stackzen_gigs')
    .select('*')
    .eq('status', 'ACTIVE')
    .contains('skills', user.skills || [])
    .not('id', 'in', user.favorite_gig_ids || [])
    .order('created_at', { ascending: false })
    .limit(10);

  return recommendedGigs || [];
}
