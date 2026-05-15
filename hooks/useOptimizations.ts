import { useEffect, useRef } from 'react';
import { MobileOptimizer } from '@/lib/mobile-optimization';
import { PerformanceOptimizer } from '@/lib/performance';

export function useOptimizations() {
  const elementRef = useRef<HTMLElement | null>(null);
  const { isMobile, isTablet, orientation } = MobileOptimizer.useResponsive();

  useEffect(() => {
    if (elementRef.current) {
      // Apply mobile optimizations
      MobileOptimizer.optimizeTouchEvents(elementRef.current);
      MobileOptimizer.optimizeScrolling(elementRef.current);

      // Setup gesture handling
      MobileOptimizer.setupGestureHandling(elementRef.current, {
        onSwipeLeft: () => console.log('Swiped left'),
        onSwipeRight: () => console.log('Swiped right'),
        onSwipeUp: () => console.log('Swiped up'),
        onSwipeDown: () => console.log('Swiped down'),
      });
    }
  }, []);

  // Get optimized styles
  const styles = MobileOptimizer.getMobileStyles();

  // Get optimized image source
  const getOptimizedImage = (src: string, width: number) => {
    return MobileOptimizer.getResponsiveImageSrc(src, width);
  };

  // Cache API response
  const cacheResponse = async (key: string, data: any) => {
    const optimizer = PerformanceOptimizer.getInstance();
    await optimizer.cacheApiResponse(key, data);
  };

  // Get cached response
  const getCachedResponse = async (key: string) => {
    const optimizer = PerformanceOptimizer.getInstance();
    return optimizer.getCachedApiResponse(key);
  };

  return {
    elementRef,
    isMobile,
    isTablet,
    orientation,
    styles,
    getOptimizedImage,
    cacheResponse,
    getCachedResponse,
  };
}
