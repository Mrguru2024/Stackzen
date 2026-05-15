import { cache } from './redis';

export class CacheInvalidation {
  // Invalidate user-related caches
  static async invalidateUserCaches(userId: string) {
    const patterns = [
      `user:${userId}`,
      `user_settings:${userId}`,
      `income_summary:${userId}:*`,
      `expenses:${userId}:*`,
      `services:${userId}`,
      `bookings:${userId}:*`,
      `invoices:${userId}:*`,
      `goals:${userId}`,
      `challenges:${userId}`,
      `investments:${userId}`,
      `cards:${userId}:*`,
      `savings:${userId}`,
      `budget:${userId}:*`,
      `gigs:${userId}:*`,
    ];

    await Promise.all(patterns.map(pattern => cache.deletePattern(pattern)));
  }

  // Invalidate service-related caches
  static async invalidateServiceCaches(userId?: string) {
    const patterns = ['services:*', ...(userId ? [`services:*:${userId}`] : [])];

    await Promise.all(patterns.map(pattern => cache.deletePattern(pattern)));
  }

  // Invalidate booking-related caches
  static async invalidateBookingCaches(userId?: string) {
    const patterns = ['bookings:*', ...(userId ? [`bookings:${userId}:*`] : [])];

    await Promise.all(patterns.map(pattern => cache.deletePattern(pattern)));
  }

  // Invalidate income-related caches
  static async invalidateIncomeCaches(userId?: string) {
    const patterns = ['income_summary:*', ...(userId ? [`income_summary:${userId}:*`] : [])];

    await Promise.all(patterns.map(pattern => cache.deletePattern(pattern)));
  }

  // Invalidate expense-related caches
  static async invalidateExpenseCaches(userId?: string) {
    const patterns = ['expenses:*', ...(userId ? [`expenses:${userId}:*`] : [])];

    await Promise.all(patterns.map(pattern => cache.deletePattern(pattern)));
  }

  // Invalidate invoice-related caches
  static async invalidateInvoiceCaches(userId?: string) {
    const patterns = ['invoices:*', ...(userId ? [`invoices:${userId}:*`] : [])];

    await Promise.all(patterns.map(pattern => cache.deletePattern(pattern)));
  }

  // Invalidate all caches (use with caution)
  static async invalidateAllCaches() {
    await cache.clear();
  }

  // Invalidate caches by pattern
  static async invalidateByPattern(pattern: string) {
    await cache.deletePattern(pattern);
  }
}
