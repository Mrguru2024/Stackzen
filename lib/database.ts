import { createClient } from '@supabase/supabase-js';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Database abstraction layer
export class DatabaseService {
  private useSupabase: boolean;

  constructor(useSupabase?: boolean) {
    // Use environment variable to determine database choice
    // Can be overridden by passing explicit parameter
    this.useSupabase = useSupabase ?? process.env.USE_SUPABASE_FOR_SMART_SAVING === 'true';
  }

  // Smart Saving Rules
  async getSavingsRules(userId: string) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('savings_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    } else {
      return await prisma.savingsRule.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async createSavingsRule(userId: string, ruleData: any) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('savings_rules')
        .insert({
          user_id: userId,
          name: ruleData.name,
          type: ruleData.type,
          config: ruleData.config,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      return await prisma.savingsRule.create({
        data: {
          userId,
          name: ruleData.name,
          type: ruleData.type,
          config: ruleData.config,
          isActive: true,
        },
      });
    }
  }

  async updateSavingsRule(ruleId: string, ruleData: any) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('savings_rules')
        .update({
          name: ruleData.name,
          config: ruleData.config,
          is_active: ruleData.isActive,
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      return await prisma.savingsRule.update({
        where: { id: ruleId },
        data: {
          name: ruleData.name,
          config: ruleData.config,
          isActive: ruleData.isActive,
        },
      });
    }
  }

  // Smart Buckets
  async getSmartBuckets(userId: string) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('smart_buckets')
        .select(
          `
          *,
          allocations (*)
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    } else {
      return await prisma.smartBucket.findMany({
        where: { userId, isActive: true },
        include: {
          allocations: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    }
  }

  async createSmartBucket(userId: string, bucketData: any) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('smart_buckets')
        .insert({
          user_id: userId,
          name: bucketData.name,
          type: bucketData.type,
          target_amount: bucketData.targetAmount,
          current_amount: 0,
          color: bucketData.color,
          icon: bucketData.icon,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      return await prisma.smartBucket.create({
        data: {
          userId,
          name: bucketData.name,
          type: bucketData.type,
          targetAmount: bucketData.targetAmount,
          currentAmount: 0,
          color: bucketData.color,
          icon: bucketData.icon,
          isActive: true,
        },
      });
    }
  }

  // Savings Executions
  async createSavingsExecution(executionData: any) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('savings_executions')
        .insert({
          rule_id: executionData.ruleId,
          user_id: executionData.userId,
          amount: executionData.amount,
          description: executionData.description,
          status: 'completed',
          metadata: executionData.metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      return await prisma.savingsExecution.create({
        data: {
          ruleId: executionData.ruleId,
          userId: executionData.userId,
          amount: executionData.amount,
          description: executionData.description,
          status: 'completed',
          metadata: executionData.metadata,
        },
      });
    }
  }

  async getSavingsExecutions(userId: string, limit?: number) {
    if (this.useSupabase) {
      let query = supabase
        .from('savings_executions')
        .select('*')
        .eq('user_id', userId)
        .order('executed_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } else {
      return await prisma.savingsExecution.findMany({
        where: { userId },
        orderBy: { executedAt: 'desc' },
        take: limit,
      });
    }
  }

  // Analytics
  async getWeeklySummary(userId: string) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('savings_executions')
        .select('*')
        .eq('user_id', userId)
        .gte('executed_at', startOfWeek.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      const totalSaved = data.reduce((sum, exec) => sum + exec.amount, 0);
      const ruleBreakdown = data.reduce(
        (acc, exec) => {
          const ruleType = exec.metadata?.ruleType || 'unknown';
          acc[ruleType] = (acc[ruleType] || 0) + exec.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalSaved,
        ruleBreakdown,
        executionCount: data.length,
        averagePerDay: totalSaved / 7,
      };
    } else {
      const executions = await prisma.savingsExecution.findMany({
        where: {
          userId,
          executedAt: { gte: startOfWeek },
          status: 'completed',
        },
      });

      const totalSaved = executions.reduce((sum, exec) => sum + exec.amount, 0);
      const ruleBreakdown = executions.reduce(
        (acc, exec) => {
          const meta = exec.metadata as { ruleType?: string } | null | undefined;
          const ruleType = meta?.ruleType ?? 'unknown';
          acc[ruleType] = (acc[ruleType] || 0) + exec.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalSaved,
        ruleBreakdown,
        executionCount: executions.length,
        averagePerDay: totalSaved / 7,
      };
    }
  }

  // User Management
  async getUserByEmail(email: string) {
    if (this.useSupabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

      if (error) throw error;
      return data;
    } else {
      return await prisma.user.findUnique({
        where: { email },
      });
    }
  }

  /** Generic JSON-backed settings stored on `UserSettings.dashboardLayout`. */
  async getUserSetting(userId: string, key: string): Promise<unknown | null> {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { dashboardLayout: true },
    });
    const layout = (settings?.dashboardLayout as Record<string, unknown> | null) ?? {};
    const value = layout[key];
    return value === undefined ? null : value;
  }

  async setUserSetting(userId: string, key: string, value: unknown) {
    const existing = await prisma.userSettings.findUnique({
      where: { userId },
      select: { dashboardLayout: true },
    });
    const prev = (existing?.dashboardLayout as Record<string, unknown> | null) ?? {};
    const dashboardLayout = { ...prev, [key]: value } as Prisma.InputJsonValue;
    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, dashboardLayout },
      update: { dashboardLayout },
    });
  }

  // Get database type for debugging
  getDatabaseType() {
    return this.useSupabase ? 'Supabase' : 'Prisma';
  }
}

// Factory function to create database service
export function createDatabaseService(useSupabase?: boolean) {
  return new DatabaseService(useSupabase);
}

// Default export for convenience
export default createDatabaseService;
