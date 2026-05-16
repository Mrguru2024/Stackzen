import { useEffect, useState } from 'react';

export class MobileOptimizer {
  private static instance: MobileOptimizer;
  private isMobile: boolean = false;
  private isTablet: boolean = false;
  private orientation: 'portrait' | 'landscape' = 'portrait';

  private constructor() {
    this.updateDeviceInfo();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.updateDeviceInfo.bind(this));
      window.addEventListener('orientationchange', this.updateDeviceInfo.bind(this));
    }
  }

  static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  private updateDeviceInfo() {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    this.isMobile = width < 768;
    this.isTablet = width >= 768 && width < 1024;
    this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  getResponsiveState(): {
    isMobile: boolean;
    isTablet: boolean;
    orientation: 'portrait' | 'landscape';
  } {
    this.updateDeviceInfo();
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      orientation: this.orientation,
    };
  }

  // Touch event optimization
  static optimizeTouchEvents(element: HTMLElement): void {
    element.style.touchAction = 'manipulation';
    element.style.setProperty('-webkit-tap-highlight-color', 'transparent');
  }

  // Responsive image loading
  static getResponsiveImageSrc(src: string, width: number): string {
    const cdnService = (window as any).cdnService;
    if (cdnService) {
      return cdnService.optimizeImage(src, { width });
    }
    return src;
  }

  // Mobile-specific styles
  static getMobileStyles(): Record<string, string> {
    return {
      fontSize: this.getInstance().isMobile ? '14px' : '16px',
      padding: this.getInstance().isMobile ? '12px' : '16px',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      overscrollBehavior: 'contain',
    };
  }

  // Optimize scrolling
  static optimizeScrolling(element: HTMLElement): void {
    element.style.overscrollBehavior = 'contain';
    element.style.setProperty('-webkit-overflow-scrolling', 'touch');
  }

  // Handle mobile gestures
  static setupGestureHandling(
    element: HTMLElement,
    callbacks: {
      onSwipeLeft?: () => void;
      onSwipeRight?: () => void;
      onSwipeUp?: () => void;
      onSwipeDown?: () => void;
    }
  ): void {
    let startX: number;
    let startY: number;
    const _threshold = 50;

    element.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    element.addEventListener('touchend', e => {
      const _endX = e.changedTouches[0].clientX;
      const _endY = e.changedTouches[0].clientY;
      const _deltaX = _endX - startX;
      const _deltaY = _endY - startY;

      if (Math.abs(_deltaX) > Math.abs(_deltaY)) {
        if (_deltaX > _threshold && callbacks.onSwipeRight) {
          callbacks.onSwipeRight();
        } else if (_deltaX < -_threshold && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft();
        }
      } else {
        if (_deltaY > _threshold && callbacks.onSwipeDown) {
          callbacks.onSwipeDown();
        } else if (_deltaY < -_threshold && callbacks.onSwipeUp) {
          callbacks.onSwipeUp();
        }
      }
    });
  }
}

// Hook for responsive components
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const _optimizer = MobileOptimizer.getInstance();
    const _updateState = () => {
      const { isMobile, isTablet, orientation } = _optimizer.getResponsiveState();
      setIsMobile(isMobile);
      setIsTablet(isTablet);
      setOrientation(orientation);
    };

    _updateState();
    window.addEventListener('resize', _updateState);
    window.addEventListener('orientationchange', _updateState);

    return () => {
      window.removeEventListener('resize', _updateState);
      window.removeEventListener('orientationchange', _updateState);
    };
  }, []);

  return { isMobile, isTablet, orientation };
}
