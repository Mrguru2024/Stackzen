import React from 'react';
import { useState, useEffect } from 'react';
import { useOptimizations } from '@/hooks/useOptimizations';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  onImageClick?: (image: string) => void;
}

export function OptimizedImageGallery({ images, onImageClick }: ImageGalleryProps) {
  const { elementRef, isMobile, styles, getOptimizedImage, cacheResponse, getCachedResponse } =
    useOptimizations();

  const [optimizedImages, setOptimizedImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = isMobile ? 4 : 6;

  useEffect(() => {
    const loadOptimizedImages = async () => {
      // Try to get from cache first
      const cachedImages = await getCachedResponse('gallery-images');
      if (cachedImages) {
        setOptimizedImages(cachedImages);
        return;
      }

      // Optimize images
      const optimized = await Promise.all(
        images.map(async image => {
          const width = isMobile ? 400 : 800;
          return getOptimizedImage(image, width);
        })
      );

      // Cache the results
      await cacheResponse('gallery-images', optimized);
      setOptimizedImages(optimized);
    };

    loadOptimizedImages();
  }, [images, isMobile, getCachedResponse, getOptimizedImage, cacheResponse]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentPage < Math.ceil(images.length / imagesPerPage)) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'right' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const currentImages = optimizedImages.slice(
    (currentPage - 1) * imagesPerPage,
    currentPage * imagesPerPage
  );

  return (
    <div
      ref={elementRef as React.Ref<HTMLDivElement>}
      className="relative w-full overflow-hidden"
      style={{
        ...styles,
        touchAction: 'pan-y pinch-zoom',
      }}
    >
      <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3">
        {currentImages.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => onImageClick?.(image)}
          >
            <Image
              src={image}
              alt={`Gallery image ${index + 1}`}
              fill
              sizes={isMobile ? '50vw' : '33vw'}
              className="rounded-lg object-cover"
              loading={index < 4 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {currentPage > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 transform rounded-full bg-black/50 p-2 text-white"
          onClick={() => handleSwipe('right')}
          aria-label="Previous page"
        >
          ←
        </button>
      )}

      {currentPage < Math.ceil(images.length / imagesPerPage) && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 transform rounded-full bg-black/50 p-2 text-white"
          onClick={() => handleSwipe('left')}
          aria-label="Next page"
        >
          →
        </button>
      )}

      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: Math.ceil(images.length / imagesPerPage) }).map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full ${
              currentPage === index + 1 ? 'bg-black' : 'bg-gray-300'
            }`}
            onClick={() => setCurrentPage(index + 1)}
            aria-label={`Go to page ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
