import { MobileOptimizer } from '@/lib/mobile-optimization';
import { renderHook, act } from '@testing-library/react';
import { useResponsive } from '@/hooks/useResponsive';
jest.mock('@/hooks/useResponsive', () => ({ useResponsive: jest.fn() }));

describe('MobileOptimizer', () => {
  let _optimizer: MobileOptimizer;

  beforeEach(() => {
    _optimizer = MobileOptimizer.getInstance();
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1024 });
    Object.defineProperty(window, 'innerHeight', { value: 768 });
  });

  it('should be a singleton', () => {
    const instance1 = MobileOptimizer.getInstance();
    const instance2 = MobileOptimizer.getInstance();
    expect(_instance1).toBe(_instance2);
  });

  it('should detect mobile device', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(true);
  });

  it('should detect tablet device', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768 });
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isTablet).toBe(true);
  });

  it('should detect orientation changes', () => {
    Object.defineProperty(window, 'innerWidth', { value: 812 });
    Object.defineProperty(window, 'innerHeight', { value: 375 });
    const { result } = renderHook(() => useResponsive());
    expect(result.current.orientation).toBe('landscape');

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 812 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.orientation).toBe('portrait');
  });

  it('should optimize touch events', () => {
    const element = document.createElement('div');
    MobileOptimizer.optimizeTouchEvents(_element);
    expect(_element.style.touchAction).toBe('manipulation');
    expect(_element.style.webkitTapHighlightColor).toBe('transparent');
  });

  it('should optimize scrolling', () => {
    const element = document.createElement('div');
    MobileOptimizer.optimizeScrolling(_element);
    expect(_element.style.overscrollBehavior).toBe('contain');
    expect(_element.style.webkitOverflowScrolling).toBe('touch');
  });

  it('should handle swipe gestures', () => {
    const element = document.createElement('div');
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();

    MobileOptimizer.setupGestureHandling(_element, {
      onSwipeLeft: _onSwipeLeft,
      onSwipeRight: _onSwipeRight,
    });

    // Simulate swipe left
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 0 }],
    });
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 0, clientY: 0 }],
    });

    _element.dispatchEvent(_touchStart);
    _element.dispatchEvent(_touchEnd);

    expect(_onSwipeLeft).toHaveBeenCalled();
    expect(_onSwipeRight).not.toHaveBeenCalled();
  });

  it('should get mobile-specific styles', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    const styles = MobileOptimizer.getMobileStyles();
    expect(_styles.fontSize).toBe('16px');
    expect(_styles.padding).toBe('16px');
  });
});
