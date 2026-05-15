jest.mock('@supabase/supabase-js', () => {
  const mockSupabase = {};
  ['from', 'select', 'match', 'eq', 'single', 'contains', 'not', 'order', 'limit'].forEach(
    method => {
      mockSupabase[method] = jest.fn(() => mockSupabase);
    }
  );
  return {
    createClient: () => mockSupabase,
    __mockSupabase: mockSupabase,
  };
});

import { getGigAnalytics, getGigRecommendations } from '@/lib/analytics/gigAnalytics';

describe('Gig Analytics', () => {
  let mockSupabase;
  beforeEach(() => {
    mockSupabase = require('@supabase/supabase-js').__mockSupabase;
    jest.clearAllMocks();
  });

  describe('getGigAnalytics', () => {
    it('returns correct analytics for user', async () => {
      mockSupabase.select.mockImplementationOnce(() => mockSupabase);
      mockSupabase.match.mockResolvedValueOnce({ count: 10 }); // totalGigs
      mockSupabase.select.mockImplementationOnce(() => mockSupabase);
      mockSupabase.match.mockResolvedValueOnce({ count: 5 }); // activeGigs
      mockSupabase.select.mockImplementationOnce(() => mockSupabase);
      mockSupabase.match.mockResolvedValueOnce({ count: 20 }); // totalApplications
      mockSupabase.select.mockImplementationOnce(() => mockSupabase);
      mockSupabase.match.mockResolvedValueOnce({
        data: [
          { category: 'Web Development' },
          { category: 'Web Development' },
          { category: 'Mobile Development' },
        ],
      }); // categories
      mockSupabase.select.mockImplementationOnce(() => mockSupabase);
      mockSupabase.match.mockResolvedValueOnce({
        data: [{ budget: 1000 }, { budget: 2000 }, { budget: 3000 }],
      }); // budgetStats
      mockSupabase.select.mockImplementationOnce(() => mockSupabase);
      mockSupabase.match.mockResolvedValueOnce({ count: 3 }); // completedGigs
      mockSupabase.select.mockImplementationOnce(() => mockSupabase);
      mockSupabase.match.mockResolvedValueOnce({
        data: [
          { skills: ['React', 'TypeScript'] },
          { skills: ['React', 'Node.js'] },
          { skills: ['TypeScript', 'Node.js'] },
        ],
      }); // skills

      const result = await getGigAnalytics('user123');

      expect(_result).toEqual({
        totalGigs: 10,
        activeGigs: 5,
        totalApplications: 20,
        averageApplicationsPerGig: 2,
        popularCategories: [
          { category: 'Web Development', count: 2 },
          { category: 'Mobile Development', count: 1 },
        ],
        averageBudget: 2000,
        completionRate: 30,
        topSkills: [
          { skill: 'React', count: 2 },
          { skill: 'TypeScript', count: 2 },
          { skill: 'Node.js', count: 2 },
        ],
      });
    });

    it('returns zero values when user has no gigs', async () => {
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.match.mockResolvedValue({ count: 0, data: [] });

      const result = await getGigAnalytics('user123');

      expect(_result).toEqual({
        totalGigs: 0,
        activeGigs: 0,
        totalApplications: 0,
        averageApplicationsPerGig: 0,
        popularCategories: [],
        averageBudget: 0,
        completionRate: 0,
        topSkills: [],
      });
    });
  });

  describe('getGigRecommendations', () => {
    it('returns recommended gigs based on user skills', async () => {
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockImplementation(() => mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: {
          skills: ['React', 'TypeScript'],
          favorite_gig_ids: ['gig1', 'gig2'],
        },
      });
      mockSupabase.contains.mockImplementation(() => mockSupabase);
      mockSupabase.not.mockImplementation(() => mockSupabase);
      mockSupabase.order.mockImplementation(() => mockSupabase);
      mockSupabase.limit.mockResolvedValue({
        data: [
          { id: 'gig3', title: 'React Developer', skills: ['React', 'TypeScript'] },
          { id: 'gig4', title: 'Full Stack Developer', skills: ['React', 'Node.js'] },
        ],
      });

      const result = await getGigRecommendations('user123');

      expect(_result).toEqual([
        { id: 'gig3', title: 'React Developer', skills: ['React', 'TypeScript'] },
        { id: 'gig4', title: 'Full Stack Developer', skills: ['React', 'Node.js'] },
      ]);
    });

    it('returns empty array when user not found', async () => {
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockImplementation(() => mockSupabase);
      mockSupabase.single.mockResolvedValue({ data: null });

      const result = await getGigRecommendations('user123');

      expect(_result).toEqual([]);
    });
  });
});
