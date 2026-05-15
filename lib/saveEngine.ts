import { createDatabaseService } from '@/lib/database';

export interface RoundUpConfig {
  enabled: boolean;
  goalId?: string;
  maxAmount?: number;
}

export interface AutoSaverConfig {
  enabled: boolean;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  goalId?: string;
}

export interface BudgetSaverConfig {
  enabled: boolean;
  categories: { name: string; cap: number }[];
  goalId?: string;
}

export interface TriggerSaveConfig {
  enabled: boolean;
  triggers: { keyword: string; amount: number }[];
  goalId?: string;
}

export interface IncomeSplitConfig {
  enabled: boolean;
  splits: { bucket: string; percentage: number }[];
}

export class SaveEngine {
  private userId: string;
  private db: ReturnType<typeof createDatabaseService>;

  constructor(userId: string, useSupabase: boolean = false) {
    this.userId = userId;
    this.db = createDatabaseService(useSupabase);
  }

  // Round-up savings logic
  async calculateRoundUp(transactionAmount: number): Promise<number> {
    const roundUp = Math.ceil(transactionAmount) - transactionAmount;
    return Math.min(roundUp, 5); // Cap at $5 per transaction
  }

  async executeRoundUp(transactionAmount: number, description?: string): Promise<void> {
    const roundUpAmount = await this.calculateRoundUp(transactionAmount);
    if (roundUpAmount > 0) {
      await this.createSavingsExecution('roundup', roundUpAmount, description);
    }
  }

  // Auto-saver logic
  async executeAutoSaver(): Promise<void> {
    const autoSaverRule = await this.getRuleByType('auto');
    if (!autoSaverRule || !autoSaverRule.isActive) return;

    const config = autoSaverRule.config as AutoSaverConfig;
    if (config.enabled) {
      await this.createSavingsExecution('auto', config.amount, 'Auto-saver');
    }
  }

  // Budget saver logic
  async executeBudgetSaver(category: string, spentAmount: number): Promise<void> {
    const budgetRule = await this.getRuleByType('budget');
    if (!budgetRule || !budgetRule.isActive) return;

    const config = budgetRule.config as BudgetSaverConfig;
    const categoryConfig = config.categories.find(c => c.name === category);

    if (categoryConfig && spentAmount < categoryConfig.cap) {
      const surplus = categoryConfig.cap - spentAmount;
      await this.createSavingsExecution('budget', surplus, `Budget surplus: ${category}`);
    }
  }

  // Trigger save logic
  async executeTriggerSave(merchant: string, amount: number): Promise<void> {
    const triggerRule = await this.getRuleByType('trigger');
    if (!triggerRule || !triggerRule.isActive) return;

    const config = triggerRule.config as TriggerSaveConfig;
    const trigger = config.triggers.find(t =>
      merchant.toLowerCase().includes(t.keyword.toLowerCase())
    );

    if (trigger) {
      await this.createSavingsExecution('trigger', trigger.amount, `Trigger: ${merchant}`);
    }
  }

  // Income splitter logic
  async executeIncomeSplit(incomeAmount: number): Promise<void> {
    const splitRule = await this.getRuleByType('income_split');
    if (!splitRule || !splitRule.isActive) return;

    const config = splitRule.config as IncomeSplitConfig;

    for (const split of config.splits) {
      const _splitAmount = (incomeAmount * split.percentage) / 100;
      await this.allocateToBucket(split.bucket, _splitAmount, 'Income split');
    }
  }

  // Helper methods
  private async getRuleByType(type: string) {
    const rules = await this.db.getSavingsRules(this.userId);
    return rules.find(rule => rule.type === type);
  }

  private async createSavingsExecution(
    ruleType: string,
    amount: number,
    description?: string
  ): Promise<void> {
    const rule = await this.getRuleByType(ruleType);
    if (!rule) return;

    await this.db.createSavingsExecution({
      ruleId: rule.id,
      userId: this.userId,
      amount,
      description,
      metadata: {
        ruleType,
        executedAt: new Date().toISOString(),
      },
    });
  }

  private async allocateToBucket(
    bucketName: string,
    amount: number,
    source: string
  ): Promise<void> {
    const buckets = await this.db.getSmartBuckets(this.userId);
    let bucket = buckets.find(b => b.name === bucketName);

    if (!bucket) {
      bucket = await this.db.createSmartBucket(this.userId, {
        name: bucketName,
        type: bucketName.toLowerCase(),
      });
    }

    // Create allocation
    await this.db.createSavingsExecution({
      ruleId: 'manual', // For bucket allocations
      userId: this.userId,
      amount,
      description: `Allocated to ${bucketName} from ${source}`,
      metadata: {
        ruleType: 'bucket_allocation',
        bucketId: bucket.id,
        source,
      },
    });
  }

  // Analytics and reporting
  async getWeeklySummary(): Promise<any> {
    return await this.db.getWeeklySummary(this.userId);
  }

  async getBucketStatus(): Promise<any[]> {
    return await this.db.getSmartBuckets(this.userId);
  }
}
