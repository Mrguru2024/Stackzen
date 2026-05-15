import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GigsHub from './index.tsx';

const mockGigs = [
  {
    id: '1',
    title: 'Frontend Developer',
    description: 'Build React apps.',
    url: 'https://example.com/1',
    source: 'WeWorkRemotely',
    category: 'Web Dev / Tech',
    postedAt: '2024-06-01T12:00:00Z',
  },
  {
    id: '2',
    title: 'Copywriter',
    description: 'Write great copy.',
    url: 'https://example.com/2',
    source: 'ProBlogger',
    category: 'Copywriting',
    postedAt: '2024-06-02T12:00:00Z',
  },
];

global.fetch = jest.fn();

describe('GigsHub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', async () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<GigsHub />);
    expect(screen.getByText(/loading gigs/i)).toBeInTheDocument();
  });

  it('renders error state', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    render(<GigsHub />);
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch gigs/i)).toBeInTheDocument();
    });
  });

  it('renders empty state', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ gigs: [], pagination: { pages: 1 } }),
    });
    render(<GigsHub />);
    await waitFor(() => {
      expect(screen.getByText(/no gigs found/i)).toBeInTheDocument();
    });
  });

  it('renders gigs and pagination', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ gigs: mockGigs, pagination: { pages: 1 } }),
    });
    render(<GigsHub />);
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Copywriter')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });
  });

  it('filters by category', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gigs: mockGigs, pagination: { pages: 1 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gigs: [mockGigs[1]], pagination: { pages: 1 } }),
      });
    render(<GigsHub />);
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Copywriter')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/filter by category/i), {
      target: { value: 'Copywriting' },
    });
    await waitFor(() => {
      expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
      expect(screen.getByText('Copywriter')).toBeInTheDocument();
    });
  });
});
