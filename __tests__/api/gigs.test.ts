import { GET, POST } from '@/app/api/gigs/route';
import { createClient } from '@supabase/supabase-js';

// --- Custom Request class to ensure .url is always present ---
class MockRequest extends Request {
  constructor(url: string, options?: RequestInit) {
    super(url, options);
    // Ensure .url is always present (for Node.js compatibility)
    this.url = url;
  }
}

// --- Robust Supabase mock with full chain support ---
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({ from: jest.fn().mockReturnThis() })),
}));

describe('Gigs API', () => {
  let queryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder = (createClient as jest.Mock)();
    queryBuilder = queryBuilder.from('stackzen_gigs');
  });

  describe('GET /api/gigs', () => {
    it('returns list of gigs', async () => {
      const mockGigs = [
        {
          id: 1,
          title: 'Test Gig 1',
          description: 'Description 1',
          category: 'Development',
          budget: 1000,
          skills: ['JavaScript', 'React'],
          posted_by: 'user1',
        },
        {
          id: 2,
          title: 'Test Gig 2',
          description: 'Description 2',
          category: 'Design',
          budget: 2000,
          skills: ['UI/UX', 'Figma'],
          posted_by: 'user2',
        },
      ];

      queryBuilder.__setResolveValue({
        data: mockGigs,
        count: mockGigs.length,
        error: null,
      });

      const request = new MockRequest(
        'http://localhost:3000/api/gigs?page=1&limit=10&sortBy=created_at&sortOrder=desc'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        gigs: mockGigs,
        pagination: {
          total: mockGigs.length,
          pages: Math.ceil(mockGigs.length / 10),
          currentPage: 1,
          limit: 10,
        },
      });
    }, 10000);

    it('handles errors gracefully', async () => {
      queryBuilder.__setShouldReject(true);

      const request = new MockRequest('http://localhost:3000/api/gigs?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch gigs',
        details: 'Database error',
      });
    }, 10000);
  });

  describe('POST /api/gigs', () => {
    it('creates a new gig', async () => {
      queryBuilder.__setShouldReject(false);
      const newGig = {
        title: 'New Gig',
        description: 'New Description',
        category: 'Development',
        budget: 1500,
        skills: ['TypeScript', 'Next.js'],
        postedBy: 'user1',
      };

      queryBuilder.__setResolveValue({
        data: {
          title: newGig.title,
          description: newGig.description,
          category: newGig.category,
          budget: newGig.budget,
          skills: newGig.skills,
          posted_by: newGig.postedBy,
          id: 1,
        },
        error: null,
      });

      const request = new MockRequest('http://localhost:3000/api/gigs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGig),
      });

      const response = await POST(request);
      const data = await response.json();
      console.log('POST /api/gigs response:', data);
      expect(response.status).toBe(201);
      expect(data).toEqual({
        title: newGig.title,
        description: newGig.description,
        category: newGig.category,
        budget: newGig.budget,
        skills: newGig.skills,
        posted_by: newGig.postedBy,
        id: 1,
      });
    }, 10000);

    it('validates required fields', async () => {
      const request = new MockRequest('http://localhost:3000/api/gigs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Title is required',
      });
    }, 10000);

    it('handles database errors', async () => {
      const newGig = {
        title: 'New Gig',
        description: 'New Description',
        category: 'Development',
        budget: 1500,
        skills: ['TypeScript', 'Next.js'],
        posted_by: 'user1',
      };

      queryBuilder.__setShouldReject(true);

      const request = new MockRequest('http://localhost:3000/api/gigs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to create gig',
        details: 'Database error',
      });
    }, 10000);
  });
});
