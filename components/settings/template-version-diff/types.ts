export interface ConflictResolution {
  field: string;
  sourceValue: any;
  targetValue: any;
  resolvedValue: any;
  resolvedBy: string;
  resolvedAt: string;
  resolutionType: 'source' | 'target' | 'custom';
  notes?: string;
}

export interface MergeHistory {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  sourceVersion: number;
  targetVersion: number;
  mergedAt: string;
  resolvedConflicts: Array<{
    field: string;
    resolution: any;
  }>;
  status: 'success' | 'failed';
  error?: string;
  conflictResolutions: ConflictResolution[];
  resolutionStrategy: 'manual' | 'auto';
  resolutionTime: number;
}

export interface BranchComparison {
  sourceBranch: string;
  targetBranch: string;
  commonAncestor: number;
  changes: Array<{
    field: string;
    sourceValue: any;
    targetValue: any;
    type: 'added' | 'removed' | 'modified' | 'unchanged';
  }>;
  stats: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

export interface BranchProtectionRule {
  branchName: string;
  requireReview: boolean;
  preventDirectChanges: boolean;
  allowedRoles: string[];
  requiredApprovals: number;
  autoDeleteAfterDays?: number;
}

export interface MergeAnalytics {
  totalMerges: number;
  successfulMerges: number;
  failedMerges: number;
  averageConflictsPerMerge: number;
  averageResolutionTime: number;
  mergeFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  conflictPatterns: Array<{
    field: string;
    frequency: number;
    commonResolution: string;
  }>;
  branchActivity: Array<{
    branch: string;
    mergesIn: number;
    mergesOut: number;
    conflictRate: number;
  }>;
  timeDistribution: Array<{
    period: string;
    merges: number;
    conflicts: number;
  }>;
  mergePredictions: {
    successProbability: number;
    estimatedConflicts: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
  };
  teamCollaboration: {
    activeContributors: number;
    contributorActivity: Array<{
      contributor: string;
      merges: number;
      conflicts: number;
      resolutionTime: number;
      successRate: number;
    }>;
    teamMetrics: {
      averageResolutionTime: number;
      conflictResolutionEfficiency: number;
      collaborationScore: number;
    };
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ContributorComparison {
  contributor1: string;
  contributor2: string;
  metrics: {
    mergeSuccessRate: {
      contributor1: number;
      contributor2: number;
    };
    averageResolutionTime: {
      contributor1: number;
      contributor2: number;
    };
    conflictResolutionEfficiency: {
      contributor1: number;
      contributor2: number;
    };
    conflictPatterns: Array<{
      field: string;
      frequency: number;
      resolutionPattern: string;
    }>;
    collaborationHistory: Array<{
      date: string;
      type: 'merge' | 'conflict' | 'review';
      description: string;
    }>;
  };
}

export interface MergeStrategyRecommendation {
  strategy: 'auto' | 'manual' | 'review' | 'scheduled';
  confidence: number;
  reasoning: string[];
  suggestedApproach: {
    steps: string[];
    estimatedTime: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  historicalSuccess: {
    strategy: string;
    successRate: number;
    averageTime: number;
  }[];
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  merges: number;
  conflicts: number;
  resolutionTime: number;
}

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
}

export interface ExportOptions {
  format: ExportFormat;
  includeCharts: boolean;
  dateRange: DateRange;
  selectedMetrics: string[];
  includeContributorData: boolean;
  includeConflictData: boolean;
  includeStrategyData: boolean;
}

export interface TeamPerformanceTrend {
  period: string;
  metrics: {
    totalMerges: number;
    successRate: number;
    averageResolutionTime: number;
    conflictRate: number;
    teamEfficiency: number;
  };
  contributors: Array<{
    name: string;
    activity: number;
    successRate: number;
    resolutionTime: number;
  }>;
}

export interface ConflictPrediction {
  probability: number;
  potentialConflicts: Array<{
    field: string;
    confidence: number;
    reason: string;
    suggestedResolution: string;
  }>;
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

export interface ChartFilter {
  metrics: string[];
  timeRange: DateRange;
  contributors: string[];
  branches: string[];
  conflictTypes: string[];
  resolutionTypes: string[];
}

export interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  options: ExportOptions;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TeamAlert {
  id: string;
  type: 'performance' | 'conflict' | 'efficiency' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
  assignedTo?: string;
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  type: 'numeric' | 'percentage' | 'duration' | 'boolean';
  formula: string;
  unit?: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface MergeStrategyInsight {
  id: string;
  type: 'success' | 'warning' | 'suggestion';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  dataPoints: Array<{
    metric: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  recommendations: string[];
  createdAt: string;
}

export interface TeamPerformanceInsight {
  id: string;
  category: 'efficiency' | 'collaboration' | 'quality' | 'custom';
  title: string;
  description: string;
  metrics: Array<{
    name: string;
    value: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  contributors: Array<{
    name: string;
    contribution: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  suggestions: string[];
  createdAt: string;
}

export interface FormulaBuilder {
  id: string;
  name: string;
  description: string;
  formula: string;
  variables: Array<{
    name: string;
    type: 'number' | 'boolean' | 'string' | 'date';
    source: 'metric' | 'constant' | 'calculation';
    value?: any;
  }>;
  operators: Array<{
    type: 'arithmetic' | 'logical' | 'comparison' | 'function';
    symbol: string;
    description: string;
  }>;
  validation: {
    required: string[];
    rules: Array<{
      condition: string;
      message: string;
    }>;
  };
}
