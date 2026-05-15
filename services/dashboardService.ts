import { apiService } from './apiService';
import type { DashboardData } from '@hooks/useDashboardData';

/**
 * Dashboard service for handling dashboard-related API calls
 */
class DashboardService {
  /**
   * Fetch dashboard data
   * @returns Promise with dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    return apiService.get<DashboardData>('/dashboard');
  }

  /**
   * Fetch summary metrics
   * @returns Promise with summary metrics
   */
  async getSummaryMetrics() {
    return apiService.get('/dashboard/metrics');
  }

  /**
   * Fetch recent transactions
   * @param limit - Number of transactions to fetch
   * @returns Promise with recent transactions
   */
  async getRecentTransactions(limit: number = 10) {
    return apiService.get(`/dashboard/transactions?limit=${limit}`);
  }

  /**
   * Fetch upcoming bills
   * @returns Promise with upcoming bills
   */
  async getUpcomingBills() {
    return apiService.get('/dashboard/bills');
  }

  /**
   * Fetch savings progress
   * @returns Promise with savings progress data
   */
  async getSavingsProgress() {
    return apiService.get('/dashboard/savings-progress');
  }
}

export const dashboardService = new DashboardService();
