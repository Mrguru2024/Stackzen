import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OptimizedImageGallery } from './OptimizedImageGallery';
import { useOptimizations } from '@/hooks/useOptimizations';

// Mock the useOptimizations hook
jest.mock('@/hooks/useOptimizations');

const mockUseOptimizations = {
  optimizedImages: [],
  isLoading: false,
  error: null,
  optimizeImage: jest.fn(),
};

const mockImages = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
  'https://example.com/image3.jpg',
];
const handleImageClick = jest.fn();
const cachedImages = mockImages.map(url => `${url}?optimized=true`);

describe('OptimizedImageGallery', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
    'https://example.com/image4.jpg',
    'https://example.com/image5.jpg',
    'https://example.com/image6.jpg',
    'https://example.com/image7.jpg',
    'https://example.com/image8.jpg',
  ];

  const mockUseOptimizations = {
    elementRef: { current: null },
    isMobile: false,
    styles: {},
    getOptimizedImage: jest.fn(url => Promise.resolve(url)),
    cacheResponse: jest.fn(),
    getCachedResponse: jest.fn(),
  };

  beforeEach(() => {
    (useOptimizations as jest.Mock).mockReturnValue(mockUseOptimizations);
  });

  it('renders the gallery with images', async () => {
    render(<OptimizedImageGallery images={mockImages} />);

    // Check if images are rendered
    const images = await screen.findAllByRole('img');
    expect(images).toHaveLength(6); // Default desktop view shows 6 images
  });

  it('handles mobile view correctly', async () => {
    (useOptimizations as jest.Mock).mockReturnValue({
      ...mockUseOptimizations,
      isMobile: true,
    });

    render(<OptimizedImageGallery images={mockImages} />);

    // Check if images are rendered with mobile layout
    const images = await screen.findAllByRole('img');
    expect(images).toHaveLength(4); // Mobile view shows 4 images
  });

  it('handles image click callback', async () => {
    render(<OptimizedImageGallery images={mockImages} onImageClick={handleImageClick} />);

    const images = await screen.findAllByRole('img');
    fireEvent.click(images[0]);

    expect(handleImageClick).toHaveBeenCalledWith(mockImages[0]);
  });

  it('handles pagination correctly', async () => {
    render(<OptimizedImageGallery images={mockImages} />);

    // Check if pagination dots are rendered
    const _paginationDots = screen.getAllByRole('button', { name: /go to page/i });
    expect(_paginationDots).toHaveLength(Math.ceil(mockImages.length / 6));

    // Click next page button
    const _nextButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(_nextButton);

    // Check if images are updated
    const images = await screen.findAllByRole('img');
    expect(images).toHaveLength(2); // Should show remaining 2 images
  });

  it('uses cached images when available', async () => {
    (useOptimizations as jest.Mock).mockReturnValue({
      ...mockUseOptimizations,
      getCachedResponse: jest.fn().mockResolvedValue(cachedImages),
    });

    render(<OptimizedImageGallery images={mockImages} />);

    // Verify that getCachedResponse was called
    expect(mockUseOptimizations.getCachedResponse).toHaveBeenCalledWith('gallery-images');

    // Verify that images are rendered from cache
    const images = await screen.findAllByRole('img');
    expect(images).toHaveLength(6);
  });

  it('optimizes and caches images when no cache is available', async () => {
    (useOptimizations as jest.Mock).mockReturnValue({
      ...mockUseOptimizations,
      getCachedResponse: jest.fn().mockResolvedValue(null),
    });

    render(<OptimizedImageGallery images={mockImages} />);

    // Verify that getOptimizedImage was called for each image
    expect(mockUseOptimizations.getOptimizedImage).toHaveBeenCalledTimes(mockImages.length);

    // Verify that cacheResponse was called
    expect(mockUseOptimizations.cacheResponse).toHaveBeenCalled();
  });
});
