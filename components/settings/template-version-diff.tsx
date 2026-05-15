import React from 'react';
import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/ui/icons';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  TemplateVersion,
  exportTemplate,
  importTemplate,
  validateTemplateExport,
} from '@/lib/import';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Icons } from '@/components/ui/icons';
import { VersionComparison } from './template-version-diff/VersionComparison';
import { MergeAnalytics } from './template-version-diff/MergeAnalytics';
import { BranchManagement } from './template-version-diff/BranchManagement';
import { TeamAlerts } from './template-version-diff/TeamAlerts';
import { ExportDialog } from './template-version-diff/ExportDialog';
import { TemplateVersionDiff } from './template-version-diff/TemplateVersionDiff';
import type { SavedTemplate, TemplateVersion } from '@/lib/import';

interface ConflictResolution {
  field: string;
  sourceValue: any;
  targetValue: any;
  resolvedValue: any;
  resolvedBy: string;
  resolvedAt: string;
  resolutionType: 'source' | 'target' | 'custom';
  notes?: string;
}

interface MergeHistory {
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
  resolutionTime: number; // in milliseconds
}

interface BranchComparison {
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

interface BranchProtectionRule {
  branchName: string;
  requireReview: boolean;
  preventDirectChanges: boolean;
  allowedRoles: string[];
  requiredApprovals: number;
  autoDeleteAfterDays?: number;
}

interface MergeAnalytics {
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

interface DateRange {
  start: Date;
  end: Date;
}

interface ContributorComparison {
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
    commonConflicts: Array<{
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

interface MergeStrategyRecommendation {
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

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface TimeSeriesData {
  date: string;
  merges: number;
  conflicts: number;
  resolutionTime: number;
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
}

interface ExportOptions {
  format: ExportFormat;
  includeCharts: boolean;
  dateRange: DateRange;
  selectedMetrics: string[];
  includeContributorData: boolean;
  includeConflictData: boolean;
  includeStrategyData: boolean;
}

interface TeamPerformanceTrend {
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

interface ConflictPrediction {
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

interface ChartFilter {
  metrics: string[];
  timeRange: DateRange;
  contributors: string[];
  branches: string[];
  conflictTypes: string[];
  resolutionTypes: string[];
}

interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  options: ExportOptions;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface TeamAlert {
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

interface CustomMetric {
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

interface MergeStrategyInsight {
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

interface TeamPerformanceInsight {
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

interface FormulaBuilder {
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

interface TemplateVersionDiffProps {
  versions: TemplateVersion[];
  onRestore: (version: number) => Promise<void>;
  isRestoring: boolean;
  onAddTag?: (version: number, tag: string) => Promise<void>;
  onRemoveTag?: (version: number, tag: string) => Promise<void>;
  onAddNote?: (version: number, note: string) => Promise<void>;
  onImport?: (template: SavedTemplate, versions: TemplateVersion[]) => Promise<void>;
  onBranch?: (version: number, branchName: string) => Promise<void>;
  onMerge?: (
    sourceVersion: number,
    targetVersion: number,
    resolutions?: Record<string, any>
  ) => Promise<void>;
  onDeleteBranch?: (branchName: string) => Promise<void>;
  onRenameBranch?: (oldName: string, newName: string) => Promise<void>;
  onArchiveBranch?: (branchName: string) => Promise<void>;
  onUnarchiveBranch?: (branchName: string) => Promise<void>;
  mergeHistory?: MergeHistory[];
  template: SavedTemplate;
  onCompareBranches?: (sourceBranch: string, targetBranch: string) => Promise<BranchComparison>;
  onUpdateProtectionRule?: (rule: BranchProtectionRule) => Promise<void>;
  onDeleteProtectionRule?: (branchName: string) => Promise<void>;
  protectionRules?: BranchProtectionRule[];
  userRole?: string;
  onAddResolutionNote?: (mergeId: string, field: string, note: string) => Promise<void>;
  mergeAnalytics?: MergeAnalytics;
  onExportAnalytics?: (options: ExportOptions) => Promise<void>;
  onCompareContributors?: (
    contributor1: string,
    contributor2: string
  ) => Promise<ContributorComparison>;
  onGetMergeStrategyRecommendation?: (
    sourceBranch: string,
    targetBranch: string,
    contributors: string[]
  ) => Promise<MergeStrategyRecommendation>;
  chartData?: {
    mergeFrequency: TimeSeriesData[];
    conflictPatterns: ChartData[];
    contributorActivity: ChartData[];
    successRates: ChartData[];
  };
  onGetTeamPerformanceTrends?: (dateRange: DateRange) => Promise<TeamPerformanceTrend[]>;
  onPredictConflicts?: (sourceBranch: string, targetBranch: string) => Promise<ConflictPrediction>;
  onFilterCharts?: (filter: ChartFilter) => Promise<void>;
  onSaveExportTemplate?: (template: ExportTemplate) => Promise<void>;
  onLoadExportTemplate?: (templateId: string) => Promise<ExportTemplate>;
  onDeleteExportTemplate?: (templateId: string) => Promise<void>;
  exportTemplates?: ExportTemplate[];
  onCreateTeamAlert?: (alert: Omit<TeamAlert, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  onUpdateTeamAlert?: (alertId: string, status: TeamAlert['status']) => Promise<void>;
  teamAlerts?: TeamAlert[];
  onCreateCustomMetric?: (
    metric: Omit<CustomMetric, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onUpdateCustomMetric?: (metricId: string, metric: Partial<CustomMetric>) => Promise<void>;
  onDeleteCustomMetric?: (metricId: string) => Promise<void>;
  customMetrics?: CustomMetric[];
  onGetMergeStrategyInsights?: () => Promise<MergeStrategyInsight[]>;
  onGetTeamPerformanceInsights?: () => Promise<TeamPerformanceInsight[]>;
  onCreateFormula?: (formula: Omit<FormulaBuilder, 'id'>) => Promise<void>;
  onUpdateFormula?: (formulaId: string, updates: Partial<FormulaBuilder>) => Promise<void>;
  onDeleteFormula?: (formulaId: string) => Promise<void>;
  mergeStrategyInsights?: MergeStrategyInsight[];
  teamPerformanceInsights?: TeamPerformanceInsight[];
  formulaBuilders?: FormulaBuilder[];
}

export function TemplateVersionDiff({
  versions,
  onRestore,
  isRestoring,
  onAddTag,
  onRemoveTag,
  onAddNote,
  onImport,
  onBranch,
  onMerge,
  onDeleteBranch,
  onRenameBranch,
  onArchiveBranch,
  onUnarchiveBranch,
  mergeHistory = [],
  template,
  onCompareBranches,
  onUpdateProtectionRule,
  onDeleteProtectionRule,
  protectionRules = [],
  userRole,
  onAddResolutionNote,
  mergeAnalytics,
  onExportAnalytics,
  onCompareContributors,
  onGetMergeStrategyRecommendation,
  chartData,
  onGetTeamPerformanceTrends,
  onPredictConflicts,
  onFilterCharts,
  onSaveExportTemplate,
  onLoadExportTemplate,
  onDeleteExportTemplate,
  exportTemplates = [],
  onCreateTeamAlert,
  onUpdateTeamAlert,
  teamAlerts = [],
  onCreateCustomMetric,
  onUpdateCustomMetric,
  onDeleteCustomMetric,
  customMetrics = [],
  onGetMergeStrategyInsights,
  onGetTeamPerformanceInsights,
  onCreateFormula,
  onUpdateFormula,
  onDeleteFormula,
  mergeStrategyInsights = [],
  teamPerformanceInsights = [],
  formulaBuilders = [],
}: TemplateVersionDiffProps) {
  const { toast } = useToast();
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<'day' | 'week' | 'month' | 'all'>('all');
  const [newTag, setNewTag] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedVersionForTag, setSelectedVersionForTag] = useState<number | null>(null);
  const [selectedVersionForNote, setSelectedVersionForNote] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedSourceVersion, setSelectedSourceVersion] = useState<number | null>(null);
  const [selectedTargetVersion, setSelectedTargetVersion] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedVersionForBranch, setSelectedVersionForBranch] = useState<number | null>(null);
  const [showMergePreview, setShowMergePreview] = useState(false);
  const [conflicts, setConflicts] = useState<
    Array<{
      field: string;
      sourceValue: any;
      targetValue: any;
      resolution: any;
    }>
  >([]);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRenamingBranch, setIsRenamingBranch] = useState(false);
  const [branchToRename, setBranchToRename] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [branchToArchive, setBranchToArchive] = useState<string | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isComparingBranches, setIsComparingBranches] = useState(false);
  const [branchComparison, setBranchComparison] = useState<BranchComparison | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedSourceBranch, setSelectedSourceBranch] = useState<string | null>(null);
  const [selectedTargetBranch, setSelectedTargetBranch] = useState<string | null>(null);
  const [isUpdatingProtection, setIsUpdatingProtection] = useState(false);
  const [protectionDialogOpen, setProtectionDialogOpen] = useState(false);
  const [selectedBranchForProtection, setSelectedBranchForProtection] = useState<string | null>(
    null
  );
  const [protectionRule, setProtectionRule] = useState<Partial<BranchProtectionRule>>({});
  const [selectedMerge, setSelectedMerge] = useState<MergeHistory | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [selectedFieldForNote, setSelectedFieldForNote] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    end: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedContributors, setSelectedContributors] = useState<[string, string] | null>(null);
  const [contributorComparison, setContributorComparison] = useState<ContributorComparison | null>(
    null
  );
  const [isComparingContributors, setIsComparingContributors] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategyRecommendation | null>(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false);
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: {
      id: 'json',
      name: 'JSON',
      extension: 'json',
      mimeType: 'application/json',
    },
    includeCharts: true,
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date(),
    },
    selectedMetrics: ['merges', 'conflicts', 'resolutionTime'],
    includeContributorData: true,
    includeConflictData: true,
    includeStrategyData: true,
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [teamTrends, setTeamTrends] = useState<TeamPerformanceTrend[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [conflictPrediction, setConflictPrediction] = useState<ConflictPrediction | null>(null);
  const [isPredictingConflicts, setIsPredictingConflicts] = useState(false);
  const [trendsDialogOpen, setTrendsDialogOpen] = useState(false);
  const [predictionDialogOpen, setPredictionDialogOpen] = useState(false);
  const [chartFilter, setChartFilter] = useState<ChartFilter>({
    metrics: ['merges', 'conflicts', 'resolutionTime'],
    timeRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date(),
    },
    contributors: [],
    branches: [],
    conflictTypes: [],
    resolutionTypes: [],
  });
  const [isFilteringCharts, setIsFilteringCharts] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedExportTemplate, setSelectedExportTemplate] = useState<ExportTemplate | null>(null);
  const [exportTemplateDialogOpen, setExportTemplateDialogOpen] = useState(false);
  const [newExportTemplate, setNewExportTemplate] = useState<Partial<ExportTemplate>>({});
  const [teamAlertsDialogOpen, setTeamAlertsDialogOpen] = useState(false);
  const [customMetricsDialogOpen, setCustomMetricsDialogOpen] = useState(false);
  const [newCustomMetric, setNewCustomMetric] = useState<Partial<CustomMetric>>({});
  const [selectedCustomMetric, setSelectedCustomMetric] = useState<CustomMetric | null>(null);
  const [mergeInsightsDialogOpen, setMergeInsightsDialogOpen] = useState(false);
  const [teamInsightsDialogOpen, setTeamInsightsDialogOpen] = useState(false);
  const [formulaBuilderDialogOpen, setFormulaBuilderDialogOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<FormulaBuilder | null>(null);
  const [newFormula, setNewFormula] = useState<Partial<FormulaBuilder>>({});

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Get all unique tags from versions
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    versions.forEach(version => {
      version.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [versions]);

  // Get all unique branches
  const branches = useMemo(() => {
    const branchSet = new Set<string>();
    versions.forEach(version => {
      if (version.branch) {
        branchSet.add(version.branch);
      }
    });
    return Array.from(branchSet);
  }, [versions]);

  // Get latest version for each branch
  const latestBranchVersions = useMemo(() => {
    const latest: Record<string, TemplateVersion> = {};
    versions.forEach(version => {
      if (version.branch) {
        if (!latest[version.branch] || version.version > latest[version.branch].version) {
          latest[version.branch] = version;
        }
      }
    });
    return latest;
  }, [versions]);

  // Filter versions based on search query, tags, and date range
  const filteredVersions = useMemo(() => {
    return versions.filter(version => {
      const matchesSearch = searchQuery
        ? version.changes.some(
            change =>
              change.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
              change.oldValue?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
              change.newValue?.toString().toLowerCase().includes(searchQuery.toLowerCase())
          )
        : true;

      const matchesTag = filterTag ? version.tags?.includes(filterTag) : true;

      const matchesDateRange = (() => {
        const versionDate = new Date(version.createdAt);
        const now = new Date();
        switch (filterDateRange) {
          case 'day':
            return versionDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return versionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return versionDate >= monthAgo;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesTag && matchesDateRange;
    });
  }, [versions, searchQuery, filterTag, filterDateRange]);

  // Get active and archived branches
  const { activeBranches, archivedBranches } = useMemo(() => {
    const active: string[] = [];
    const archived: string[] = [];
    branches.forEach(branch => {
      const latestVersion = latestBranchVersions[branch];
      if (latestVersion.isArchived) {
        archived.push(branch);
      } else {
        active.push(branch);
      }
    });
    return { activeBranches: active, archivedBranches: archived };
  }, [branches, latestBranchVersions]);

  const handleVersionSelect = (version: number) => {
    if (!selectedVersions) {
      setSelectedVersions([version, version]);
    } else if (selectedVersions[0] === version) {
      setSelectedVersions(null);
    } else {
      setSelectedVersions([selectedVersions[0], version]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions) {
      setIsComparing(true);
    }
  };

  const handleRestore = async (version: number) => {
    await onRestore(version);
    setSelectedVersions(null);
    setIsComparing(false);
  };

  const handleAddTag = async (version: number) => {
    if (!newTag.trim() || !onAddTag) return;

    setIsAddingTag(true);
    try {
      await onAddTag(version, newTag.trim());
      setNewTag('');
      setSelectedVersionForTag(null);
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleAddNote = async (version: number) => {
    if (!newNote.trim() || !onAddNote) return;

    setIsAddingNote(true);
    try {
      await onAddNote(version, newNote.trim());
      setNewNote('');
      setSelectedVersionForNote(null);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportTemplate(template, versions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: 'Template has been exported successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImport) return;

    setIsImporting(true);
    try {
      const { template: importedTemplate, versions: importedVersions } = await importTemplate(file);
      await onImport(importedTemplate, importedVersions);

      toast({
        title: 'Import successful',
        description: 'Template has been imported successfully.',
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Failed to import template. Please check the file format.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateBranch = async (version: number) => {
    if (!newBranchName.trim() || !onBranch) return;

    setIsCreatingBranch(true);
    try {
      await onBranch(version, newBranchName.trim());
      setNewBranchName('');
      setSelectedVersionForBranch(null);

      toast({
        title: 'Branch created',
        description: `Created new branch '${newBranchName}' from version ${version}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to create branch',
        description: 'Please try again with a different branch name.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedSourceVersion || !selectedTargetVersion || !onMerge) return;

    setIsMerging(true);
    try {
      // Create resolutions object from conflicts
      const resolutions = conflicts.reduce(
        (acc, conflict) => ({
          ...acc,
          [conflict.field]: conflict.resolution,
        }),
        {}
      );

      await onMerge(selectedSourceVersion, selectedTargetVersion, resolutions);
      setMergeDialogOpen(false);
      setSelectedSourceVersion(null);
      setSelectedTargetVersion(null);
      setConflicts([]);
      setHasConflicts(false);

      toast({
        title: 'Merge successful',
        description: 'Changes have been merged successfully.',
      });
    } catch (error) {
      toast({
        title: 'Merge failed',
        description: 'Failed to merge changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!onDeleteBranch) return;

    setIsDeletingBranch(true);
    try {
      await onDeleteBranch(branchName);
      setDeleteDialogOpen(false);
      setBranchToDelete(null);

      toast({
        title: 'Branch deleted',
        description: `Branch '${branchName}' has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to delete branch',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingBranch(false);
    }
  };

  // Get branch statistics
  const getBranchStats = (branchName: string) => {
    const branchVersions = versions.filter(v => v.branch === branchName);
    const latestVersion = branchVersions.reduce((latest, current) =>
      current.version > latest.version ? current : latest
    );
    const changeCount = branchVersions.reduce(
      (count, version) => count + version.changes.length,
      0
    );

    return {
      versionCount: branchVersions.length,
      latestVersion: latestVersion.version,
      changeCount,
      lastModified: latestVersion.createdAt,
    };
  };

  const getVersionChanges = (version: TemplateVersion) => {
    return (
      <div className="space-y-4">
        {version.changes.map((change, index) => (
          <div key={index} className="space-y-1">
            <Badge variant="outline" className="text-xs">
              {change.field}
            </Badge>
            <div className="text-sm">
              <span className="text-muted-foreground">From: </span>
              {change.oldValue?.toString() || 'none'}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">To: </span>
              {change.newValue?.toString() || 'none'}
            </div>
          </div>
        ))}
        {version.tags && version.tags.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Tags:</span>
            <div className="flex flex-wrap gap-1">
              {version.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  {onRemoveTag && (
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => onRemoveTag(version.version, tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      <Icons.x className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {version.note && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Note:</span>
            <p className="text-sm">{version.note}</p>
          </div>
        )}
      </div>
    );
  };

  const getMergePreview = () => {
    if (!selectedSourceVersion || !selectedTargetVersion) return null;

    const sourceVersion = versions.find(v => v.version === selectedSourceVersion);
    const targetVersion = versions.find(v => v.version === selectedTargetVersion);

    if (!sourceVersion || !targetVersion) return null;

    // Find common ancestor version
    const commonAncestor = versions.find(
      v => v.version < Math.min(sourceVersion.version, targetVersion.version)
    );

    // Get changes that will be merged and detect conflicts
    const changesToMerge = sourceVersion.changes.filter(change => {
      const targetChange = targetVersion.changes.find(c => c.field === change.field);
      if (!targetChange) return true; // New field in source

      // Check if the change is different from target
      return JSON.stringify(change.newValue) !== JSON.stringify(targetChange.newValue);
    });

    // Detect conflicts
    const newConflicts = changesToMerge
      .filter(change => {
        const targetChange = targetVersion.changes.find(c => c.field === change.field);
        if (!targetChange) return false;

        // Check if both branches modified the same field
        const sourceModified = sourceVersion.changes.some(
          c =>
            c.field === change.field &&
            JSON.stringify(c.newValue) !== JSON.stringify(change.oldValue)
        );
        const targetModified = targetVersion.changes.some(
          c =>
            c.field === change.field &&
            JSON.stringify(c.newValue) !== JSON.stringify(change.oldValue)
        );

        return sourceModified && targetModified;
      })
      .map(change => {
        const targetChange = targetVersion.changes.find(c => c.field === change.field)!;
        return {
          field: change.field,
          sourceValue: change.newValue,
          targetValue: targetChange.newValue,
          resolution: change.newValue, // Default to source value
        };
      });

    setConflicts(newConflicts);
    setHasConflicts(newConflicts.length > 0);

    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4">
          <h4 className="mb-2 text-sm font-medium">Changes to be merged:</h4>
          {changesToMerge.length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes to merge</p>
          ) : (
            <div className="space-y-2">
              {changesToMerge.map((change, index) => {
                const targetChange = targetVersion.changes.find(c => c.field === change.field);
                const conflict = newConflicts.find(c => c.field === change.field);

                return (
                  <div key={index} className="space-y-1">
                    <Badge variant="outline" className="text-xs">
                      {change.field}
                      {conflict && <span className="ml-1 text-destructive">(Conflict)</span>}
                    </Badge>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Current: </span>
                      {targetChange?.newValue?.toString() || 'none'}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Will be: </span>
                      {change.newValue?.toString() || 'none'}
                    </div>
                    {conflict && (
                      <div className="mt-2 space-y-2">
                        <div className="text-xs text-muted-foreground">Resolve conflict:</div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setConflicts(prev =>
                                prev.map(c =>
                                  c.field === conflict.field
                                    ? { ...c, resolution: c.sourceValue }
                                    : c
                                )
                              );
                            }}
                            className={
                              conflict.resolution === conflict.sourceValue ? 'bg-primary/10' : ''
                            }
                          >
                            Use Source
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setConflicts(prev =>
                                prev.map(c =>
                                  c.field === conflict.field
                                    ? { ...c, resolution: c.targetValue }
                                    : c
                                )
                              );
                            }}
                            className={
                              conflict.resolution === conflict.targetValue ? 'bg-primary/10' : ''
                            }
                          >
                            Keep Current
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {commonAncestor && (
          <div className="text-xs text-muted-foreground">
            Based on common ancestor version {commonAncestor.version}
          </div>
        )}
      </div>
    );
  };

  const validateBranchName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Branch name cannot be empty';
    }
    if (name.length > 50) {
      return 'Branch name must be 50 characters or less';
    }
    if (!/^[a-zA-Z0-9-_/]+$/.test(name)) {
      return 'Branch name can only contain letters, numbers, hyphens, underscores, and forward slashes';
    }
    if (branches.includes(name)) {
      return 'A branch with this name already exists';
    }
    return null;
  };

  const handleRenameBranch = async () => {
    if (!branchToRename || !newBranchName.trim() || !onRenameBranch) return;

    const error = validateBranchName(newBranchName);
    if (error) {
      setRenameError(error);
      return;
    }

    setIsRenamingBranch(true);
    try {
      await onRenameBranch(branchToRename, newBranchName.trim());
      setRenameDialogOpen(false);
      setBranchToRename(null);
      setNewBranchName('');
      setRenameError(null);

      toast({
        title: 'Branch renamed',
        description: `Branch '${branchToRename}' has been renamed to '${newBranchName}'.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to rename branch',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsRenamingBranch(false);
    }
  };

  const handleArchiveBranch = async () => {
    if (!branchToArchive || !onArchiveBranch) return;

    setIsArchiving(true);
    try {
      await onArchiveBranch(branchToArchive);
      setArchiveDialogOpen(false);
      setBranchToArchive(null);

      toast({
        title: 'Branch archived',
        description: `Branch '${branchToArchive}' has been archived. You can view it in the archived branches section.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to archive branch',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchiveBranch = async (branchName: string) => {
    if (!onUnarchiveBranch) return;

    setIsArchiving(true);
    try {
      await onUnarchiveBranch(branchName);
      toast({
        title: 'Branch unarchived',
        description: `Branch '${branchName}' has been restored to active branches.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to unarchive branch',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCompareBranches = async () => {
    if (!selectedSourceBranch || !selectedTargetBranch || !onCompareBranches) return;

    setIsComparingBranches(true);
    try {
      const comparison = await onCompareBranches(selectedSourceBranch, selectedTargetBranch);
      setBranchComparison(comparison);
    } catch (error) {
      toast({
        title: 'Failed to compare branches',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsComparingBranches(false);
    }
  };

  const renderChangeType = (type: string) => {
    switch (type) {
      case 'added':
        return <Badge className="bg-green-500/10 text-green-500">Added</Badge>;
      case 'removed':
        return <Badge className="bg-red-500/10 text-red-500">Removed</Badge>;
      case 'modified':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Modified</Badge>;
      default:
        return <Badge variant="secondary">Unchanged</Badge>;
    }
  };

  const _handleUpdateProtectionRule = async () => {
    if (!selectedBranchForProtection || !onUpdateProtectionRule) return;

    setIsUpdatingProtection(true);
    try {
      await onUpdateProtectionRule({
        branchName: selectedBranchForProtection,
        requireReview: protectionRule.requireReview ?? false,
        preventDirectChanges: protectionRule.preventDirectChanges ?? false,
        allowedRoles: protectionRule.allowedRoles ?? [],
        requiredApprovals: protectionRule.requiredApprovals ?? 1,
        autoDeleteAfterDays: protectionRule.autoDeleteAfterDays,
      });

      setProtectionDialogOpen(false);
      setSelectedBranchForProtection(null);
      setProtectionRule({});

      toast({
        title: 'Protection rule updated',
        description: `Branch protection rules have been updated for '${selectedBranchForProtection}'.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update protection rule',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingProtection(false);
    }
  };

  const _handleDeleteProtectionRule = async (branchName: string) => {
    if (!onDeleteProtectionRule) return;

    setIsUpdatingProtection(true);
    try {
      await onDeleteProtectionRule(branchName);
      toast({
        title: 'Protection rule removed',
        description: `Branch protection rules have been removed for '${branchName}'.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to remove protection rule',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingProtection(false);
    }
  };

  const _canModifyBranch = (branchName: string) => {
    const rule = protectionRules.find(r => r.branchName === branchName);
    if (!rule) return true;
    if (!userRole) return false;
    return rule.allowedRoles.includes(userRole);
  };

  const handleAddResolutionNote = async (mergeId: string, field: string) => {
    if (!resolutionNote.trim() || !onAddResolutionNote) return;

    setIsAddingNote(true);
    try {
      await onAddResolutionNote(mergeId, field, resolutionNote.trim());
      setResolutionNote('');
      setSelectedFieldForNote(null);
      toast({
        title: 'Note added',
        description: 'Resolution note has been added successfully.',
      });
    } catch (error) {
      toast({
        title: 'Failed to add note',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  const getResolutionTypeBadge = (type: string) => {
    switch (type) {
      case 'source':
        return <Badge className="bg-blue-500/10 text-blue-500">Source Value</Badge>;
      case 'target':
        return <Badge className="bg-purple-500/10 text-purple-500">Target Value</Badge>;
      case 'custom':
        return <Badge className="bg-orange-500/10 text-orange-500">Custom Value</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getConflictPatternColor = (frequency: number) => {
    if (frequency > 0.7) return 'text-red-500';
    if (frequency > 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleExportAnalytics = async () => {
    if (!onExportAnalytics) return;

    setIsExporting(true);
    try {
      await onExportAnalytics(exportOptions);
      toast({
        title: 'Analytics exported',
        description: `Analytics data has been exported in ${exportOptions.format.name} format.`,
      });
      setExportDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export analytics data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const quickDateRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last year', days: 365 },
  ];

  const handleCompareContributors = async () => {
    if (!selectedContributors || !onCompareContributors) return;

    setIsComparingContributors(true);
    try {
      const comparison = await onCompareContributors(
        selectedContributors[0],
        selectedContributors[1]
      );
      setContributorComparison(comparison);
    } catch (error) {
      toast({
        title: 'Failed to compare contributors',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsComparingContributors(false);
    }
  };

  const getMetricColor = (value1: number, value2: number) => {
    const diff = value1 - value2;
    if (diff > 0.1) return 'text-green-500';
    if (diff < -0.1) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const handleGetMergeStrategy = async () => {
    if (!selectedSourceBranch || !selectedTargetBranch || !onGetMergeStrategyRecommendation) return;

    setIsLoadingStrategy(true);
    try {
      const recommendation = await onGetMergeStrategyRecommendation(
        selectedSourceBranch,
        selectedTargetBranch,
        mergeAnalytics?.teamCollaboration.contributorActivity.map(c => c.contributor) || []
      );
      setMergeStrategy(recommendation);
    } catch (error) {
      toast({
        title: 'Failed to get merge strategy',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStrategy(false);
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'auto':
        return 'text-green-500';
      case 'manual':
        return 'text-yellow-500';
      case 'review':
        return 'text-blue-500';
      case 'scheduled':
        return 'text-purple-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const renderMergeFrequencyChart = () => (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData?.mergeFrequency}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="merges" stroke="#8884d8" name="Merges" />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="conflicts"
            stroke="#82ca9d"
            name="Conflicts"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="resolutionTime"
            stroke="#ffc658"
            name="Resolution Time (ms)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const renderConflictPatternsChart = () => (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData?.conflictPatterns}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {chartData?.conflictPatterns.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const renderContributorActivityChart = () => (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData?.contributorActivity}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" name="Activity" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderSuccessRatesChart = () => (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData?.successRates}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#82ca9d" name="Success Rate" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const _renderExportDialog = () => (
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Template</DialogTitle>
          <DialogDescription>
            Choose the format and options for exporting the template
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select
              value={exportOptions.format.id}
              onValueChange={value => {
                setExportOptions(prev => ({
                  ...prev,
                  format: {
                    ...prev.format,
                    id: value,
                  },
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Include Charts</label>
            <Checkbox
              checked={exportOptions.includeCharts}
              onCheckedChange={value => {
                setExportOptions(prev => ({
                  ...prev,
                  includeCharts: value,
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  value={format(exportOptions.dateRange.start, 'yyyy-MM-dd')}
                  onChange={e => {
                    const date = new Date(e.target.value);
                    setExportOptions(prev => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        start: date,
                      },
                    }));
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">End Date</label>
                <Input
                  type="date"
                  value={format(exportOptions.dateRange.end, 'yyyy-MM-dd')}
                  onChange={e => {
                    const date = new Date(e.target.value);
                    setExportOptions(prev => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        end: date,
                      },
                    }));
                  }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Selected Metrics</label>
            <Select
              value={exportOptions.selectedMetrics.join(',')}
              onValueChange={value => {
                setExportOptions(prev => ({
                  ...prev,
                  selectedMetrics: value.split(','),
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metrics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merges">Merges</SelectItem>
                <SelectItem value="conflicts">Conflicts</SelectItem>
                <SelectItem value="resolutionTime">Resolution Time</SelectItem>
                <SelectItem value="contributorData">Contributor Data</SelectItem>
                <SelectItem value="conflictData">Conflict Data</SelectItem>
                <SelectItem value="strategyData">Strategy Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Include Contributor Data</label>
            <Checkbox
              checked={exportOptions.includeContributorData}
              onCheckedChange={value => {
                setExportOptions(prev => ({
                  ...prev,
                  includeContributorData: value,
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Include Conflict Data</label>
            <Checkbox
              checked={exportOptions.includeConflictData}
              onCheckedChange={value => {
                setExportOptions(prev => ({
                  ...prev,
                  includeConflictData: value,
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Include Strategy Data</label>
            <Checkbox
              checked={exportOptions.includeStrategyData}
              onCheckedChange={value => {
                setExportOptions(prev => ({
                  ...prev,
                  includeStrategyData: value,
                }));
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleExport}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const handleGetTeamTrends = async () => {
    if (!onGetTeamPerformanceTrends) return;

    setIsLoadingTrends(true);
    try {
      const trends = await onGetTeamPerformanceTrends(exportOptions.dateRange);
      setTeamTrends(trends);
      setTrendsDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Failed to load team trends',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const _handlePredictConflicts = async () => {
    if (!selectedSourceBranch || !selectedTargetBranch || !onPredictConflicts) return;

    setIsPredictingConflicts(true);
    try {
      const prediction = await onPredictConflicts(selectedSourceBranch, selectedTargetBranch);
      setConflictPrediction(prediction);
      setPredictionDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Failed to predict conflicts',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsPredictingConflicts(false);
    }
  };

  const renderTeamTrendsDialog = () => (
    <Dialog open={trendsDialogOpen} onOpenChange={setTrendsDialogOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Team Performance Trends</DialogTitle>
          <DialogDescription>Historical performance metrics and trends</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="mb-4 text-sm font-medium">Overall Trends</div>
              <div className="space-y-4">
                {teamTrends.map((trend, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{trend.period}</span>
                      <Badge variant="outline">
                        {trend.metrics.successRate.toFixed(1)}% success
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Merges: {trend.metrics.totalMerges}</div>
                      <div>Conflicts: {(trend.metrics.conflictRate * 100).toFixed(1)}%</div>
                      <div>
                        Resolution: {(trend.metrics.averageResolutionTime / 1000).toFixed(1)}s
                      </div>
                      <div>Efficiency: {(trend.metrics.teamEfficiency * 100).toFixed(1)}%</div>
                    </div>
                    <div className="h-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${trend.metrics.teamEfficiency * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-4 text-sm font-medium">Contributor Activity</div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {teamTrends[0]?.contributors.map((contributor, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{contributor.name}</div>
                        <Badge
                          variant="outline"
                          className={
                            contributor.successRate > 0.8
                              ? 'text-green-500'
                              : contributor.successRate > 0.6
                                ? 'text-yellow-500'
                                : 'text-red-500'
                          }
                        >
                          {(contributor.successRate * 100).toFixed(1)}% success
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>Activity: {contributor.activity}</div>
                        <div>Resolution: {(contributor.resolutionTime / 1000).toFixed(1)}s</div>
                      </div>
                      <div className="h-1 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${contributor.activity * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderConflictPredictionDialog = () => (
    <Dialog open={predictionDialogOpen} onOpenChange={setPredictionDialogOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Conflict Prediction</DialogTitle>
          <DialogDescription>AI-powered analysis of potential merge conflicts</DialogDescription>
        </DialogHeader>
        {conflictPrediction && (
          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Conflict Probability</div>
                  <div className="text-2xl font-bold">
                    {(conflictPrediction.probability * 100).toFixed(1)}%
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    conflictPrediction.probability > 0.7
                      ? 'text-red-500'
                      : conflictPrediction.probability > 0.4
                        ? 'text-yellow-500'
                        : 'text-green-500'
                  }
                >
                  {conflictPrediction.probability > 0.7
                    ? 'High Risk'
                    : conflictPrediction.probability > 0.4
                      ? 'Medium Risk'
                      : 'Low Risk'}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="border-b p-4">
                <div className="text-sm font-medium">Potential Conflicts</div>
              </div>
              <div className="space-y-4 p-4">
                {conflictPrediction.potentialConflicts.map((conflict, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{conflict.field}</div>
                      <Badge
                        variant="outline"
                        className={
                          conflict.confidence > 0.7
                            ? 'text-red-500'
                            : conflict.confidence > 0.4
                              ? 'text-yellow-500'
                              : 'text-green-500'
                        }
                      >
                        {(conflict.confidence * 100).toFixed(1)}% confidence
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{conflict.reason}</div>
                    <div className="rounded-md bg-muted p-2 text-sm">
                      <div className="font-medium">Suggested Resolution:</div>
                      <p>{conflict.suggestedResolution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="border-b p-4">
                <div className="text-sm font-medium">Risk Factors</div>
              </div>
              <div className="space-y-4 p-4">
                {conflictPrediction.riskFactors.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{factor.factor}</div>
                      <Badge
                        variant="outline"
                        className={
                          factor.impact > 0.7
                            ? 'text-red-500'
                            : factor.impact > 0.4
                              ? 'text-yellow-500'
                              : 'text-green-500'
                        }
                      >
                        {(factor.impact * 100).toFixed(1)}% impact
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{factor.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="border-b p-4">
                <div className="text-sm font-medium">Recommended Actions</div>
              </div>
              <div className="space-y-4 p-4">
                {conflictPrediction.recommendedActions.map((action, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{action.action}</div>
                      <Badge
                        variant="outline"
                        className={
                          action.priority === 'high'
                            ? 'text-red-500'
                            : action.priority === 'medium'
                              ? 'text-yellow-500'
                              : 'text-green-500'
                        }
                      >
                        {action.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{action.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const handleFilterCharts = async () => {
    if (!onFilterCharts) return;

    setIsFilteringCharts(true);
    try {
      await onFilterCharts(chartFilter);
      setFilterDialogOpen(false);
      toast({
        title: 'Charts updated',
        description: 'Chart data has been filtered according to your selection.',
      });
    } catch (error) {
      toast({
        title: 'Failed to filter charts',
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setIsFilteringCharts(false);
    }
  };

  const renderChartFilterDialog = () => (
    <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filter Charts</DialogTitle>
          <DialogDescription>Customize the metrics and data shown in the charts</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Metrics</label>
            <div className="grid grid-cols-2 gap-2">
              {['merges', 'conflicts', 'resolutionTime', 'successRate', 'efficiency'].map(
                metric => (
                  <div key={metric} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric}
                      checked={chartFilter.metrics.includes(metric)}
                      onCheckedChange={checked => {
                        setChartFilter(prev => ({
                          ...prev,
                          metrics: checked
                            ? [...prev.metrics, metric]
                            : prev.metrics.filter(m => m !== metric),
                        }));
                      }}
                    />
                    <label
                      htmlFor={metric}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </label>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Time Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  value={format(chartFilter.timeRange.start, 'yyyy-MM-dd')}
                  onChange={e => {
                    const date = new Date(e.target.value);
                    setChartFilter(prev => ({
                      ...prev,
                      timeRange: {
                        ...prev.timeRange,
                        start: date,
                      },
                    }));
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">End Date</label>
                <Input
                  type="date"
                  value={format(chartFilter.timeRange.end, 'yyyy-MM-dd')}
                  onChange={e => {
                    const date = new Date(e.target.value);
                    setChartFilter(prev => ({
                      ...prev,
                      timeRange: {
                        ...prev.timeRange,
                        end: date,
                      },
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contributors</label>
            <ScrollArea className="h-[100px] rounded-md border p-2">
              <div className="space-y-2">
                {mergeAnalytics?.teamCollaboration.contributorActivity.map(contributor => (
                  <div key={contributor.contributor} className="flex items-center space-x-2">
                    <Checkbox
                      id={`contributor-${contributor.contributor}`}
                      checked={chartFilter.contributors.includes(contributor.contributor)}
                      onCheckedChange={checked => {
                        setChartFilter(prev => ({
                          ...prev,
                          contributors: checked
                            ? [...prev.contributors, contributor.contributor]
                            : prev.contributors.filter(c => c !== contributor.contributor),
                        }));
                      }}
                    />
                    <label
                      htmlFor={`contributor-${contributor.contributor}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {contributor.contributor}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Branches</label>
            <ScrollArea className="h-[100px] rounded-md border p-2">
              <div className="space-y-2">
                {mergeAnalytics?.branchActivity.map(branch => (
                  <div key={branch.branch} className="flex items-center space-x-2">
                    <Checkbox
                      id={`branch-${branch.branch}`}
                      checked={chartFilter.branches.includes(branch.branch)}
                      onCheckedChange={checked => {
                        setChartFilter(prev => ({
                          ...prev,
                          branches: checked
                            ? [...prev.branches, branch.branch]
                            : prev.branches.filter(b => b !== branch.branch),
                        }));
                      }}
                    />
                    <label
                      htmlFor={`branch-${branch.branch}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {branch.branch}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Conflict Types</label>
            <div className="grid grid-cols-2 gap-2">
              {['field', 'structure', 'value', 'format'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`conflict-${type}`}
                    checked={chartFilter.conflictTypes.includes(type)}
                    onCheckedChange={checked => {
                      setChartFilter(prev => ({
                        ...prev,
                        conflictTypes: checked
                          ? [...prev.conflictTypes, type]
                          : prev.conflictTypes.filter(t => t !== type),
                      }));
                    }}
                  />
                  <label
                    htmlFor={`conflict-${type}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resolution Types</label>
            <div className="grid grid-cols-2 gap-2">
              {['source', 'target', 'custom', 'auto'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`resolution-${type}`}
                    checked={chartFilter.resolutionTypes.includes(type)}
                    onCheckedChange={checked => {
                      setChartFilter(prev => ({
                        ...prev,
                        resolutionTypes: checked
                          ? [...prev.resolutionTypes, type]
                          : prev.resolutionTypes.filter(t => t !== type),
                      }));
                    }}
                  />
                  <label
                    htmlFor={`resolution-${type}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setChartFilter({
                metrics: ['merges', 'conflicts', 'resolutionTime'],
                timeRange: {
                  start: new Date(new Date().setDate(new Date().getDate() - 30)),
                  end: new Date(),
                },
                contributors: [],
                branches: [],
                conflictTypes: [],
                resolutionTypes: [],
              });
            }}
          >
            Reset
          </Button>
          <Button onClick={handleFilterCharts} disabled={isFilteringCharts}>
            {isFilteringCharts ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.filter className="mr-2 h-4 w-4" />
            )}
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const handleSaveExportTemplate = async () => {
    if (!onSaveExportTemplate || !newExportTemplate.name || !newExportTemplate.options) {
      toast({
        title: 'Error',
        description: 'Please provide a name and export options for the template',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSaveExportTemplate({
        ...newExportTemplate,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user', // Replace with actual user
      } as ExportTemplate);

      toast({
        title: 'Success',
        description: 'Export template saved successfully',
      });
      setExportTemplateDialogOpen(false);
      setNewExportTemplate({});
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save export template',
        variant: 'destructive',
      });
    }
  };

  const handleLoadExportTemplate = async (templateId: string) => {
    if (!onLoadExportTemplate) return;

    try {
      const template = await onLoadExportTemplate(templateId);
      setExportOptions(template.options);
      setSelectedExportTemplate(template);
      toast({
        title: 'Success',
        description: 'Export template loaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load export template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExportTemplate = async (templateId: string) => {
    if (!onDeleteExportTemplate) return;

    try {
      await onDeleteExportTemplate(templateId);
      toast({
        title: 'Success',
        description: 'Export template deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete export template',
        variant: 'destructive',
      });
    }
  };

  const _handleCreateTeamAlert = async () => {
    if (!onCreateTeamAlert || !newCustomMetric.name || !newCustomMetric.formula) {
      toast({
        title: 'Error',
        description: 'Please provide required fields for the alert',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onCreateTeamAlert({
        type: 'custom',
        severity: 'warning',
        message: `Custom metric "${newCustomMetric.name}" threshold exceeded`,
        metric: newCustomMetric.name,
        threshold: newCustomMetric.thresholds?.warning || 0,
        currentValue: 0, // This should be calculated based on the formula
      });

      toast({
        title: 'Success',
        description: 'Team alert created successfully',
      });
      setTeamAlertsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create team alert',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTeamAlert = async (alertId: string, status: TeamAlert['status']) => {
    if (!onUpdateTeamAlert) return;

    try {
      await onUpdateTeamAlert(alertId, status);
      toast({
        title: 'Success',
        description: 'Team alert updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update team alert',
        variant: 'destructive',
      });
    }
  };

  const _handleCreateCustomMetric = async () => {
    if (!onCreateCustomMetric || !newCustomMetric.name || !newCustomMetric.formula) {
      toast({
        title: 'Error',
        description: 'Please provide required fields for the metric',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onCreateCustomMetric({
        ...newCustomMetric,
        createdBy: 'current-user', // Replace with actual user
      } as Omit<CustomMetric, 'id' | 'createdAt' | 'updatedAt'>);

      toast({
        title: 'Success',
        description: 'Custom metric created successfully',
      });
      setCustomMetricsDialogOpen(false);
      setNewCustomMetric({});
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create custom metric',
        variant: 'destructive',
      });
    }
  };

  const _handleUpdateCustomMetric = async (metricId: string, updates: Partial<CustomMetric>) => {
    if (!onUpdateCustomMetric) return;

    try {
      await onUpdateCustomMetric(metricId, updates);
      toast({
        title: 'Success',
        description: 'Custom metric updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update custom metric',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCustomMetric = async (metricId: string) => {
    if (!onDeleteCustomMetric) return;

    try {
      await onDeleteCustomMetric(metricId);
      toast({
        title: 'Success',
        description: 'Custom metric deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete custom metric',
        variant: 'destructive',
      });
    }
  };

  const renderExportTemplateDialog = () => (
    <Dialog open={exportTemplateDialogOpen} onOpenChange={setExportTemplateDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Save Export Template</DialogTitle>
          <DialogDescription>
            Save your current export settings as a template for future use
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Template Name</label>
            <Input
              value={newExportTemplate.name || ''}
              onChange={e =>
                setNewExportTemplate(prev => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter template name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={newExportTemplate.description || ''}
              onChange={e =>
                setNewExportTemplate(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter template description"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Options</label>
            <div className="rounded-lg border p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Format</label>
                  <div className="text-sm">{exportOptions.format.name}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Date Range</label>
                  <div className="text-sm">
                    {format(exportOptions.dateRange.start, 'MMM d, yyyy')} -{' '}
                    {format(exportOptions.dateRange.end, 'MMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Selected Metrics</label>
                  <div className="text-sm">{exportOptions.selectedMetrics.join(', ')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setExportTemplateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveExportTemplate}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderTeamAlertsDialog = () => (
    <Dialog open={teamAlertsDialogOpen} onOpenChange={setTeamAlertsDialogOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Team Performance Alerts</DialogTitle>
          <DialogDescription>Monitor and manage team performance alerts</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Active Alerts</h3>
            <Button onClick={() => setTeamAlertsDialogOpen(false)}>Create New Alert</Button>
          </div>
          <div className="space-y-4">
            {teamAlerts.map(alert => (
              <div key={alert.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        alert.severity === 'critical'
                          ? 'destructive'
                          : alert.severity === 'warning'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <span className="font-medium">{alert.message}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Icons.moreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleUpdateTeamAlert(alert.id, 'acknowledged')}
                      >
                        Acknowledge
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateTeamAlert(alert.id, 'resolved')}>
                        Mark as Resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Metric:</span> {alert.metric}
                  </div>
                  <div>
                    <span className="font-medium">Threshold:</span> {alert.threshold}
                  </div>
                  <div>
                    <span className="font-medium">Current Value:</span> {alert.currentValue}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderCustomMetricsDialog = () => (
    <Dialog open={customMetricsDialogOpen} onOpenChange={setCustomMetricsDialogOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Custom Metrics</DialogTitle>
          <DialogDescription>Create and manage custom performance metrics</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Custom Metrics</h3>
            <Button onClick={() => setCustomMetricsDialogOpen(false)}>Create New Metric</Button>
          </div>
          <div className="space-y-4">
            {customMetrics.map(metric => (
              <div key={metric.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{metric.name}</h4>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Icons.moreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedCustomMetric(metric)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteCustomMetric(metric.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Type:</span> {metric.type}
                  </div>
                  <div>
                    <span className="font-medium">Unit:</span> {metric.unit || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Formula:</span> {metric.formula}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {format(new Date(metric.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
                {metric.thresholds && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Warning Threshold:</span>{' '}
                      {metric.thresholds.warning}
                    </div>
                    <div>
                      <span className="font-medium">Critical Threshold:</span>{' '}
                      {metric.thresholds.critical}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Analytics Dashboard</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setExportTemplateDialogOpen(true)}>
            <Icons.save className="mr-2 h-4 w-4" />
            Save Export Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTeamAlertsDialogOpen(true)}>
            <Icons.bell className="mr-2 h-4 w-4" />
            Team Alerts
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCustomMetricsDialogOpen(true)}>
            <Icons.lineChart className="mr-2 h-4 w-4" />
            Custom Metrics
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilterDialogOpen(true)}>
            <Icons.filter className="mr-2 h-4 w-4" />
            Filter Charts
          </Button>
          <Button variant="outline" size="sm" onClick={handleGetMergeStrategyInsights}>
            <Icons.lightbulb className="mr-2 h-4 w-4" />
            Merge Insights
          </Button>
          <Button variant="outline" size="sm" onClick={handleGetTeamPerformanceInsights}>
            <Icons.users className="mr-2 h-4 w-4" />
            Team Insights
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFormulaBuilderDialogOpen(true)}>
            <Icons.calculator className="mr-2 h-4 w-4" />
            Formula Builder
          </Button>
        </div>
      </div>

      {exportTemplates.length > 0 && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-4 text-sm font-medium">Saved Export Templates</h4>
          <div className="grid grid-cols-3 gap-4">
            {exportTemplates.map(template => (
              <div key={template.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">{template.name}</h5>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Icons.moreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleLoadExportTemplate(template.id)}>
                        Load
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteExportTemplate(template.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  Created: {format(new Date(template.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamAlerts.length > 0 && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-4 text-sm font-medium">Active Team Alerts</h4>
          <div className="space-y-2">
            {teamAlerts
              .filter(alert => alert.status === 'active')
              .slice(0, 3)
              .map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-md bg-muted p-2"
                >
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        alert.severity === 'critical'
                          ? 'destructive'
                          : alert.severity === 'warning'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdateTeamAlert(alert.id, 'acknowledged')}
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
            {teamAlerts.filter(alert => alert.status === 'active').length > 3 && (
              <Button
                variant="link"
                className="w-full"
                onClick={() => setTeamAlertsDialogOpen(true)}
              >
                View All Alerts
              </Button>
            )}
          </div>
        </div>
      )}

      {customMetrics.length > 0 && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-4 text-sm font-medium">Custom Metrics Overview</h4>
          <div className="grid grid-cols-3 gap-4">
            {customMetrics.slice(0, 3).map(metric => (
              <div key={metric.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">{metric.name}</h5>
                  <Badge variant="outline">{metric.type}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{metric.description}</div>
                {metric.thresholds && (
                  <div className="text-xs text-muted-foreground">
                    Warning: {metric.thresholds.warning} | Critical: {metric.thresholds.critical}
                  </div>
                )}
              </div>
            ))}
            {customMetrics.length > 3 && (
              <Button
                variant="outline"
                className="h-full"
                onClick={() => setCustomMetricsDialogOpen(true)}
              >
                View All Metrics
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {renderMergeFrequencyChart()}
        {renderConflictPatternsChart()}
        {renderContributorActivityChart()}
        {renderSuccessRatesChart()}
      </div>
    </div>
  );

  // Add the new dialogs to the render function
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Version History</h3>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search changes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-48"
          />
          <Select value={filterDateRange} onValueChange={(value: any) => setFilterDateRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="day">Last 24h</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="month">Last month</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Icons.tag className="mr-2 h-4 w-4" />
                {filterTag ? filterTag : 'Filter by tag'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem onSelect={() => setFilterTag(null)} className="cursor-pointer">
                    <Icons.check
                      className={`mr-2 h-4 w-4 ${!filterTag ? 'opacity-100' : 'opacity-0'}`}
                    />
                    All tags
                  </CommandItem>
                  {allTags.map(tag => (
                    <CommandItem
                      key={tag}
                      onSelect={() => setFilterTag(tag)}
                      className="cursor-pointer"
                    >
                      <Icons.check
                        className={`mr-2 h-4 w-4 ${
                          filterTag === tag ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {branches.length > 1 && onMerge && (
            <Button variant="outline" size="sm" onClick={() => setMergeDialogOpen(true)}>
              <Icons.gitMerge className="mr-2 h-4 w-4" />
              Merge Branches
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImport}
            aria-label="Import template file"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting || !onImport}
          >
            {isImporting ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.upload className="mr-2 h-4 w-4" />
            )}
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedVersions(null)}
            disabled={!selectedVersions}
          >
            <Icons.refresh className="mr-2 h-4 w-4" />
            Clear Selection
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[200px] rounded-md border">
        <div className="space-y-2 p-4">
          {filteredVersions.map(version => (
            <div
              key={version.version}
              className={`flex cursor-pointer items-start justify-between rounded-md border p-2 transition-colors ${
                selectedVersions?.includes(version.version)
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleVersionSelect(version.version)}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Version {version.version}</span>
                  <Badge variant="secondary" className="text-xs">
                    {format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                  </Badge>
                  {version.branch && (
                    <Badge variant="outline" className="text-xs">
                      {version.branch}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {version.changes.length} changes
                </div>
                {version.tags && version.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {version.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                        {onRemoveTag && (
                          <button
                            className="ml-1 hover:text-destructive"
                            onClick={() => onRemoveTag(version.version, tag)}
                            aria-label={`Remove tag ${tag}`}
                          >
                            <Icons.x className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Icons.more className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Version Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onAddTag && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedVersionForTag(version.version);
                        }}
                      >
                        <Icons.tag className="mr-2 h-4 w-4" />
                        Add Tag
                      </DropdownMenuItem>
                    )}
                    {onAddNote && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedVersionForNote(version.version);
                        }}
                      >
                        <Icons.note className="mr-2 h-4 w-4" />
                        Add Note
                      </DropdownMenuItem>
                    )}
                    {onBranch && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedVersionForBranch(version.version);
                        }}
                      >
                        <Icons.gitBranch className="mr-2 h-4 w-4" />
                        Create Branch
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        handleRestore(version.version);
                      }}
                      disabled={isRestoring}
                    >
                      {isRestoring ? (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Icons.undo className="mr-2 h-4 w-4" />
                      )}
                      Restore Version
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {selectedVersions && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompare}
            disabled={selectedVersions[0] === selectedVersions[1]}
          >
            <Icons.compare className="mr-2 h-4 w-4" />
            Compare Versions
          </Button>
        </div>
      )}

      <Dialog open={isComparing} onOpenChange={setIsComparing}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {selectedVersions && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Version {selectedVersions[0]}</h3>
                    <Badge variant="secondary">
                      {format(
                        new Date(
                          versions.find(v => v.version === selectedVersions[0])?.createdAt || ''
                        ),
                        'MMM d, yyyy HH:mm'
                      )}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    {getVersionChanges(versions.find(v => v.version === selectedVersions[0])!)}
                  </ScrollArea>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Version {selectedVersions[1]}</h3>
                    <Badge variant="secondary">
                      {format(
                        new Date(
                          versions.find(v => v.version === selectedVersions[1])?.createdAt || ''
                        ),
                        'MMM d, yyyy HH:mm'
                      )}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    {getVersionChanges(versions.find(v => v.version === selectedVersions[1])!)}
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedVersionForTag} onOpenChange={() => setSelectedVersionForTag(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tag name</label>
              <Input
                placeholder="Enter tag name"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedVersionForTag(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedVersionForTag && handleAddTag(selectedVersionForTag)}
              disabled={isAddingTag || !newTag.trim()}
            >
              {isAddingTag && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Add Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedVersionForNote} onOpenChange={() => setSelectedVersionForNote(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <Input
                placeholder="Enter note"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedVersionForNote(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedVersionForNote && handleAddNote(selectedVersionForNote)}
              disabled={isAddingNote || !newNote.trim()}
            >
              {isAddingNote && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Add Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedVersionForBranch}
        onOpenChange={() => setSelectedVersionForBranch(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Branch name</label>
              <Input
                placeholder="Enter branch name"
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedVersionForBranch(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedVersionForBranch && handleCreateBranch(selectedVersionForBranch)
              }
              disabled={isCreatingBranch || !newBranchName.trim()}
            >
              {isCreatingBranch && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Create Branch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Merge Branches</AlertDialogTitle>
            <AlertDialogDescription>
              Select the source and target branches to merge changes.
              {hasConflicts && (
                <div className="mt-2 text-destructive">
                  There are conflicts that need to be resolved before merging.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Branch</label>
              <Select
                value={selectedSourceVersion?.toString()}
                onValueChange={value => {
                  setSelectedSourceVersion(Number(value));
                  setShowMergePreview(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => {
                    const version = latestBranchVersions[branch];
                    return (
                      <SelectItem
                        key={branch}
                        value={version.version.toString()}
                        disabled={version.version === selectedTargetVersion}
                      >
                        {branch} (v{version.version})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Branch</label>
              <Select
                value={selectedTargetVersion?.toString()}
                onValueChange={value => {
                  setSelectedTargetVersion(Number(value));
                  setShowMergePreview(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => {
                    const version = latestBranchVersions[branch];
                    return (
                      <SelectItem
                        key={branch}
                        value={version.version.toString()}
                        disabled={version.version === selectedSourceVersion}
                      >
                        {branch} (v{version.version})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedSourceVersion && selectedTargetVersion && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMergePreview(!showMergePreview)}
                  className="w-full"
                >
                  {showMergePreview ? (
                    <>
                      <Icons.chevronUp className="mr-2 h-4 w-4" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Icons.chevronDown className="mr-2 h-4 w-4" />
                      Show Preview
                    </>
                  )}
                </Button>
                {showMergePreview && getMergePreview()}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMerge}
              disabled={
                !selectedSourceVersion || !selectedTargetVersion || isMerging || hasConflicts
              }
            >
              {isMerging && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {hasConflicts ? 'Resolve Conflicts First' : 'Merge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this branch? This action cannot be undone.
              {branchToDelete && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="font-medium">Branch Statistics:</div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Versions:</div>
                    <div>{getBranchStats(branchToDelete).versionCount}</div>
                    <div>Latest Version:</div>
                    <div>v{getBranchStats(branchToDelete).latestVersion}</div>
                    <div>Total Changes:</div>
                    <div>{getBranchStats(branchToDelete).changeCount}</div>
                    <div>Last Modified:</div>
                    <div>
                      {format(
                        new Date(getBranchStats(branchToDelete).lastModified),
                        'MMM d, yyyy HH:mm'
                      )}
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => branchToDelete && handleDeleteBranch(branchToDelete)}
              disabled={isDeletingBranch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingBranch && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for the branch. This will update all versions in this branch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New branch name</label>
              <Input
                placeholder="Enter new branch name"
                value={newBranchName}
                onChange={e => {
                  setNewBranchName(e.target.value);
                  setRenameError(null);
                }}
                className={renameError ? 'border-destructive' : ''}
              />
              {renameError && <p className="text-sm text-destructive">{renameError}</p>}
            </div>
            {branchToRename && (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">Current branch: {branchToRename}</div>
                <div className="text-muted-foreground">
                  {getBranchStats(branchToRename).versionCount} versions •{' '}
                  {getBranchStats(branchToRename).changeCount} changes
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setNewBranchName('');
                setRenameError(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenameBranch}
              disabled={isRenamingBranch || !newBranchName.trim()}
            >
              {isRenamingBranch && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Rename Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving a branch will hide it from the active branches list but preserve all its
              history. You can unarchive it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {branchToArchive && (
            <div className="space-y-4 py-4">
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">Branch to archive: {branchToArchive}</div>
                <div className="text-muted-foreground">
                  {getBranchStats(branchToArchive).versionCount} versions •{' '}
                  {getBranchStats(branchToArchive).changeCount} changes
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveBranch} disabled={isArchiving}>
              {isArchiving && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Archive Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Active Branches</h3>
          {archivedBranches.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowArchived(!showArchived)}>
              {showArchived ? (
                <>
                  <Icons.eyeOff className="mr-2 h-4 w-4" />
                  Hide Archived
                </>
              ) : (
                <>
                  <Icons.eye className="mr-2 h-4 w-4" />
                  Show Archived ({archivedBranches.length})
                </>
              )}
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {activeBranches.map(branch => {
            const stats = getBranchStats(branch);
            return (
              <div key={branch} className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Icons.gitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{branch}</span>
                    <Badge variant="secondary" className="text-xs">
                      v{stats.latestVersion}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.versionCount} versions • {stats.changeCount} changes • Last modified{' '}
                    {format(new Date(stats.lastModified), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {onRenameBranch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBranchToRename(branch);
                        setNewBranchName(branch);
                        setRenameDialogOpen(true);
                      }}
                      disabled={isRenamingBranch}
                    >
                      <Icons.pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onArchiveBranch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBranchToArchive(branch);
                        setArchiveDialogOpen(true);
                      }}
                      disabled={isArchiving}
                    >
                      <Icons.archive className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteBranch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBranchToDelete(branch);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={isDeletingBranch}
                    >
                      <Icons.trash className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showArchived && archivedBranches.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Archived Branches</h4>
            <div className="space-y-2">
              {archivedBranches.map(branch => {
                const stats = getBranchStats(branch);
                return (
                  <div
                    key={branch}
                    className="flex items-center justify-between rounded-md border border-muted bg-muted/50 p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Icons.archive className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">{branch}</span>
                        <Badge variant="secondary" className="text-xs">
                          v{stats.latestVersion}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats.versionCount} versions • {stats.changeCount} changes • Last modified{' '}
                        {format(new Date(stats.lastModified), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {onUnarchiveBranch && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnarchiveBranch(branch)}
                          disabled={isArchiving}
                        >
                          <Icons.unarchive className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteBranch && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBranchToDelete(branch);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={isDeletingBranch}
                        >
                          <Icons.trash className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare Branches</DialogTitle>
            <DialogDescription>View and analyze differences between branches</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Branch</label>
                <Select
                  value={selectedSourceBranch || ''}
                  onValueChange={value => {
                    setSelectedSourceBranch(value);
                    setBranchComparison(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBranches.map(branch => (
                      <SelectItem
                        key={branch}
                        value={branch}
                        disabled={branch === selectedTargetBranch}
                      >
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Branch</label>
                <Select
                  value={selectedTargetBranch || ''}
                  onValueChange={value => {
                    setSelectedTargetBranch(value);
                    setBranchComparison(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBranches.map(branch => (
                      <SelectItem
                        key={branch}
                        value={branch}
                        disabled={branch === selectedSourceBranch}
                      >
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSourceBranch && selectedTargetBranch && (
              <Button
                className="w-full"
                onClick={handleCompareBranches}
                disabled={isComparingBranches}
              >
                {isComparingBranches ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <Icons.compare className="mr-2 h-4 w-4" />
                    Compare Branches
                  </>
                )}
              </Button>
            )}

            {branchComparison && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Added</div>
                    <div className="text-2xl font-bold text-green-600">
                      {branchComparison.stats.added}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Removed</div>
                    <div className="text-2xl font-bold text-red-600">
                      {branchComparison.stats.removed}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Modified</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {branchComparison.stats.modified}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Unchanged</div>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {branchComparison.stats.unchanged}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="border-b p-4">
                    <div className="text-sm font-medium">Changes</div>
                    <div className="text-xs text-muted-foreground">
                      Based on common ancestor version {branchComparison.commonAncestor}
                    </div>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4 p-4">
                      {branchComparison.changes.map((change, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{change.field}</div>
                            {renderChangeType(change.type)}
                          </div>
                          {change.type !== 'unchanged' && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Source</div>
                                <div className="rounded-md border p-2">
                                  {JSON.stringify(change.sourceValue, null, 2)}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Target</div>
                                <div className="rounded-md border p-2">
                                  {JSON.stringify(change.targetValue, null, 2)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMerge} onOpenChange={() => setSelectedMerge(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Merge Details</DialogTitle>
            <DialogDescription>
              View details of merge from {selectedMerge?.sourceBranch} to{' '}
              {selectedMerge?.targetBranch}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium">Source Branch</div>
                <div className="text-lg font-semibold">{selectedMerge?.sourceBranch}</div>
                <div className="text-xs text-muted-foreground">
                  Version {selectedMerge?.sourceVersion}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium">Target Branch</div>
                <div className="text-lg font-semibold">{selectedMerge?.targetBranch}</div>
                <div className="text-xs text-muted-foreground">
                  Version {selectedMerge?.targetVersion}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium">Status</div>
                <div className="flex items-center space-x-2">
                  <Badge variant={selectedMerge?.status === 'success' ? 'default' : 'destructive'}>
                    {selectedMerge?.status === 'success' ? 'Success' : 'Failed'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(selectedMerge?.mergedAt || ''), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="border-b p-4">
                <div className="text-sm font-medium">Conflict Resolutions</div>
                <div className="text-xs text-muted-foreground">
                  {selectedMerge?.conflictResolutions.length} conflicts resolved
                  {selectedMerge?.resolutionStrategy === 'auto' && ' (automatically)'}
                </div>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 p-4">
                  {selectedMerge?.conflictResolutions.map((resolution, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{resolution.field}</div>
                        {getResolutionTypeBadge(resolution.resolutionType)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Source Value</div>
                          <div className="rounded-md border p-2">
                            {JSON.stringify(resolution.sourceValue, null, 2)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Target Value</div>
                          <div className="rounded-md border p-2">
                            {JSON.stringify(resolution.targetValue, null, 2)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Resolved Value</div>
                          <div className="rounded-md border p-2">
                            {JSON.stringify(resolution.resolvedValue, null, 2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                          Resolved by {resolution.resolvedBy} on{' '}
                          {format(new Date(resolution.resolvedAt), 'MMM d, yyyy HH:mm')}
                        </div>
                        {onAddResolutionNote && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFieldForNote(resolution.field)}
                          >
                            <Icons.note className="mr-2 h-4 w-4" />
                            Add Note
                          </Button>
                        )}
                      </div>
                      {resolution.notes && (
                        <div className="rounded-md bg-muted p-2 text-sm">
                          <div className="font-medium">Resolution Notes:</div>
                          <p>{resolution.notes}</p>
                        </div>
                      )}
                      {selectedFieldForNote === resolution.field && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Add a note about this resolution..."
                            value={resolutionNote}
                            onChange={e => setResolutionNote(e.target.value)}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFieldForNote(null);
                                setResolutionNote('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleAddResolutionNote(selectedMerge.id, resolution.field)
                              }
                              disabled={isAddingNote || !resolutionNote.trim()}
                            >
                              {isAddingNote && (
                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Add Note
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {selectedMerge?.error && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-4">
                <div className="text-sm font-medium text-destructive">Merge Error</div>
                <p className="mt-1 text-sm text-destructive">{selectedMerge.error}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Resolution time: {selectedMerge?.resolutionTime}ms
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Merge Analytics</DialogTitle>
            <DialogDescription>Insights and trends from template merge history</DialogDescription>
          </DialogHeader>
          {mergeAnalytics && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {format(dateRange.start, 'MMM d, yyyy')} -{' '}
                        {format(dateRange.end, 'MMM d, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="space-y-4 p-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Quick Select</div>
                          <div className="grid grid-cols-2 gap-2">
                            {quickDateRanges.map(range => (
                              <Button
                                key={range.days}
                                variant="outline"
                                size="sm"
                                className="justify-start"
                                onClick={() => {
                                  setDateRange({
                                    start: new Date(
                                      new Date().setDate(new Date().getDate() - range.days)
                                    ),
                                    end: new Date(),
                                  });
                                  setIsDatePickerOpen(false);
                                }}
                              >
                                {range.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Custom Range</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Start Date</label>
                              <Input
                                type="date"
                                value={format(dateRange.start, 'yyyy-MM-dd')}
                                onChange={e => {
                                  const date = new Date(e.target.value);
                                  setDateRange(prev => ({
                                    ...prev,
                                    start: date,
                                  }));
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">End Date</label>
                              <Input
                                type="date"
                                value={format(dateRange.end, 'yyyy-MM-dd')}
                                onChange={e => {
                                  const date = new Date(e.target.value);
                                  setDateRange(prev => ({
                                    ...prev,
                                    end: date,
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        start: new Date(new Date().setDate(new Date().getDate() - 30)),
                        end: new Date(),
                      });
                    }}
                  >
                    <Icons.refresh className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                {onExportAnalytics && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportAnalytics}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icons.download className="mr-2 h-4 w-4" />
                    )}
                    Export Analytics
                  </Button>
                )}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetTeamTrends}
                    disabled={isLoadingTrends}
                  >
                    {isLoadingTrends ? (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icons.trendingUp className="mr-2 h-4 w-4" />
                    )}
                    Team Trends
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
                    <Icons.download className="mr-2 h-4 w-4" />
                    Export Analytics
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium">Total Merges</div>
                  <div className="text-2xl font-bold">{mergeAnalytics.totalMerges}</div>
                  <div className="text-xs text-muted-foreground">
                    {mergeAnalytics.successfulMerges} successful
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium">Success Rate</div>
                  <div className="text-2xl font-bold">
                    {((mergeAnalytics.successfulMerges / mergeAnalytics.totalMerges) * 100).toFixed(
                      1
                    )}
                    %
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mergeAnalytics.failedMerges} failed
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium">Avg. Conflicts</div>
                  <div className="text-2xl font-bold">
                    {mergeAnalytics.averageConflictsPerMerge.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">per merge</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium">Avg. Resolution Time</div>
                  <div className="text-2xl font-bold">
                    {(mergeAnalytics.averageResolutionTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs text-muted-foreground">per conflict</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-4 text-sm font-medium">Merge Frequency</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily</span>
                      <span className="font-medium">{mergeAnalytics.mergeFrequency.daily}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekly</span>
                      <span className="font-medium">{mergeAnalytics.mergeFrequency.weekly}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly</span>
                      <span className="font-medium">{mergeAnalytics.mergeFrequency.monthly}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-4 text-sm font-medium">Branch Activity</div>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {mergeAnalytics.branchActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{activity.branch}</div>
                            <div className="text-xs text-muted-foreground">
                              {activity.mergesIn} in • {activity.mergesOut} out
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={getConflictPatternColor(activity.conflictRate)}
                          >
                            {(activity.conflictRate * 100).toFixed(0)}% conflicts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <div className="text-sm font-medium">Common Conflict Patterns</div>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-4 p-4">
                    {mergeAnalytics.conflictPatterns.map((pattern, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{pattern.field}</div>
                          <Badge
                            variant="outline"
                            className={getConflictPatternColor(pattern.frequency)}
                          >
                            {(pattern.frequency * 100).toFixed(0)}% frequency
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Common resolution: {pattern.commonResolution}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <div className="text-sm font-medium">Time Distribution</div>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {mergeAnalytics.timeDistribution.map((data, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{data.period}</span>
                          <span className="text-sm text-muted-foreground">
                            {data.merges} merges • {data.conflicts} conflicts
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${
                                (data.merges /
                                  Math.max(...mergeAnalytics.timeDistribution.map(d => d.merges))) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border">
                  <div className="border-b p-4">
                    <div className="text-sm font-medium">Merge Success Prediction</div>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Success Probability</div>
                        <div className="text-2xl font-bold">
                          {(mergeAnalytics.mergePredictions.successProbability * 100).toFixed(1)}%
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          mergeAnalytics.mergePredictions.riskLevel === 'high'
                            ? 'text-red-500'
                            : mergeAnalytics.mergePredictions.riskLevel === 'medium'
                              ? 'text-yellow-500'
                              : 'text-green-500'
                        }
                      >
                        {mergeAnalytics.mergePredictions.riskLevel.toUpperCase()} Risk
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Estimated Conflicts</div>
                      <div className="text-lg font-semibold">
                        {mergeAnalytics.mergePredictions.estimatedConflicts.toFixed(1)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Key Factors</div>
                      <div className="space-y-2">
                        {mergeAnalytics.mergePredictions.factors.map((factor, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="mt-1">
                              {factor.impact === 'positive' ? (
                                <Icons.checkCircle className="h-4 w-4 text-green-500" />
                              ) : factor.impact === 'negative' ? (
                                <Icons.xCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <Icons.minusCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{factor.factor}</div>
                              <div className="text-xs text-muted-foreground">
                                {factor.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <div className="border-b p-4">
                    <div className="text-sm font-medium">Team Collaboration</div>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Active Contributors</div>
                        <div className="text-2xl font-bold">
                          {mergeAnalytics.teamCollaboration.activeContributors}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Avg. Resolution Time</div>
                        <div className="text-2xl font-bold">
                          {(
                            mergeAnalytics.teamCollaboration.teamMetrics.averageResolutionTime /
                            1000
                          ).toFixed(1)}
                          s
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Collaboration Score</div>
                        <div className="text-2xl font-bold">
                          {mergeAnalytics.teamCollaboration.teamMetrics.collaborationScore.toFixed(
                            1
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Contributor Activity</div>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-4">
                          {mergeAnalytics.teamCollaboration.contributorActivity.map(
                            (contributor, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{contributor.contributor}</div>
                                  <Badge
                                    variant="outline"
                                    className={
                                      contributor.successRate > 0.8
                                        ? 'text-green-500'
                                        : contributor.successRate > 0.6
                                          ? 'text-yellow-500'
                                          : 'text-red-500'
                                    }
                                  >
                                    {(contributor.successRate * 100).toFixed(0)}% success
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div>{contributor.merges} merges</div>
                                  <div>{contributor.conflicts} conflicts</div>
                                  <div>{(contributor.resolutionTime / 1000).toFixed(1)}s avg</div>
                                </div>
                                <div className="h-1 rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{
                                      width: `${
                                        (contributor.merges /
                                          Math.max(
                                            ...mergeAnalytics.teamCollaboration.contributorActivity.map(
                                              c => c.merges
                                            )
                                          )) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="rounded-md bg-muted p-3">
                      <div className="text-sm font-medium">Team Efficiency</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Conflict resolution efficiency:{' '}
                        {(
                          mergeAnalytics.teamCollaboration.teamMetrics
                            .conflictResolutionEfficiency * 100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {chartData && (
                <div className="space-y-6">
                  <div className="rounded-lg border">
                    <div className="border-b p-4">
                      <div className="text-sm font-medium">Merge Frequency Over Time</div>
                    </div>
                    <div className="p-4">{renderMergeFrequencyChart()}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border">
                      <div className="border-b p-4">
                        <div className="text-sm font-medium">Conflict Patterns</div>
                      </div>
                      <div className="p-4">{renderConflictPatternsChart()}</div>
                    </div>

                    <div className="rounded-lg border">
                      <div className="border-b p-4">
                        <div className="text-sm font-medium">Contributor Activity</div>
                      </div>
                      <div className="p-4">{renderContributorActivityChart()}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border">
                    <div className="border-b p-4">
                      <div className="text-sm font-medium">Success Rates by Strategy</div>
                    </div>
                    <div className="p-4">{renderSuccessRatesChart()}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={comparisonDialogOpen} onOpenChange={setComparisonDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Contributor Comparison</DialogTitle>
            <DialogDescription>
              Compare performance and collaboration patterns between team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contributor 1</label>
                <Select
                  value={selectedContributors?.[0] || ''}
                  onValueChange={value => {
                    setSelectedContributors(prev => [value, prev?.[1] || '']);
                    setContributorComparison(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contributor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mergeAnalytics?.teamCollaboration.contributorActivity.map(contributor => (
                      <SelectItem
                        key={contributor.contributor}
                        value={contributor.contributor}
                        disabled={contributor.contributor === selectedContributors?.[1]}
                      >
                        {contributor.contributor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contributor 2</label>
                <Select
                  value={selectedContributors?.[1] || ''}
                  onValueChange={value => {
                    setSelectedContributors(prev => [prev?.[0] || '', value]);
                    setContributorComparison(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contributor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mergeAnalytics?.teamCollaboration.contributorActivity.map(contributor => (
                      <SelectItem
                        key={contributor.contributor}
                        value={contributor.contributor}
                        disabled={contributor.contributor === selectedContributors?.[0]}
                      >
                        {contributor.contributor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedContributors?.[0] && selectedContributors?.[1] && (
              <Button
                className="w-full"
                onClick={handleCompareContributors}
                disabled={isComparingContributors}
              >
                {isComparingContributors ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <Icons.compare className="mr-2 h-4 w-4" />
                    Compare Contributors
                  </>
                )}
              </Button>
            )}

            {contributorComparison && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Merge Success Rate</div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{contributorComparison.contributor1}</span>
                        <span
                          className={getMetricColor(
                            contributorComparison.metrics.mergeSuccessRate.contributor1,
                            contributorComparison.metrics.mergeSuccessRate.contributor2
                          )}
                        >
                          {(
                            contributorComparison.metrics.mergeSuccessRate.contributor1 * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{contributorComparison.contributor2}</span>
                        <span
                          className={getMetricColor(
                            contributorComparison.metrics.mergeSuccessRate.contributor2,
                            contributorComparison.metrics.mergeSuccessRate.contributor1
                          )}
                        >
                          {(
                            contributorComparison.metrics.mergeSuccessRate.contributor2 * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Avg. Resolution Time</div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{contributorComparison.contributor1}</span>
                        <span
                          className={getMetricColor(
                            contributorComparison.metrics.averageResolutionTime.contributor2,
                            contributorComparison.metrics.averageResolutionTime.contributor1
                          )}
                        >
                          {(
                            contributorComparison.metrics.averageResolutionTime.contributor1 / 1000
                          ).toFixed(1)}
                          s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{contributorComparison.contributor2}</span>
                        <span
                          className={getMetricColor(
                            contributorComparison.metrics.averageResolutionTime.contributor1,
                            contributorComparison.metrics.averageResolutionTime.contributor2
                          )}
                        >
                          {(
                            contributorComparison.metrics.averageResolutionTime.contributor2 / 1000
                          ).toFixed(1)}
                          s
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">Resolution Efficiency</div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{contributorComparison.contributor1}</span>
                        <span
                          className={getMetricColor(
                            contributorComparison.metrics.conflictResolutionEfficiency.contributor1,
                            contributorComparison.metrics.conflictResolutionEfficiency.contributor2
                          )}
                        >
                          {(
                            contributorComparison.metrics.conflictResolutionEfficiency
                              .contributor1 * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{contributorComparison.contributor2}</span>
                        <span
                          className={getMetricColor(
                            contributorComparison.metrics.conflictResolutionEfficiency.contributor2,
                            contributorComparison.metrics.conflictResolutionEfficiency.contributor1
                          )}
                        >
                          {(
                            contributorComparison.metrics.conflictResolutionEfficiency
                              .contributor2 * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <div className="border-b p-4">
                    <div className="text-sm font-medium">Common Conflict Patterns</div>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-4 p-4">
                      {contributorComparison.metrics.commonConflicts.map((conflict, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{conflict.field}</div>
                            <Badge variant="outline">
                              {(conflict.frequency * 100).toFixed(0)}% frequency
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Resolution pattern: {conflict.resolutionPattern}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="rounded-lg border">
                  <div className="border-b p-4">
                    <div className="text-sm font-medium">Collaboration History</div>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-4 p-4">
                      {contributorComparison.metrics.collaborationHistory.map((event, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">
                              {format(new Date(event.date), 'MMM d, yyyy')}
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                event.type === 'merge'
                                  ? 'text-green-500'
                                  : event.type === 'conflict'
                                    ? 'text-yellow-500'
                                    : 'text-blue-500'
                              }
                            >
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{event.description}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={strategyDialogOpen} onOpenChange={setStrategyDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Merge Strategy Recommendation</DialogTitle>
            <DialogDescription>
              AI-powered recommendations based on historical patterns and team performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">Source Branch</div>
                <div className="text-lg font-semibold">{selectedSourceBranch}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Target Branch</div>
                <div className="text-lg font-semibold">{selectedTargetBranch}</div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGetMergeStrategy}
              disabled={isLoadingStrategy}
            >
              {isLoadingStrategy ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Icons.lightbulb className="mr-2 h-4 w-4" />
                  Get Strategy Recommendation
                </>
              )}
            </Button>

            {mergeStrategy && (
              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Recommended Strategy</div>
                      <div
                        className={`text-lg font-semibold ${getStrategyColor(
                          mergeStrategy.strategy
                        )}`}
                      >
                        {mergeStrategy.strategy.charAt(0).toUpperCase() +
                          mergeStrategy.strategy.slice(1)}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {(mergeStrategy.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <div className="border-b p-4">
                    <div className="text-sm font-medium">Reasoning</div>
                  </div>
                  <div className="space-y-2 p-4">
                    {mergeStrategy.reasoning.map((reason, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Icons.checkCircle className="mt-1 h-4 w-4 text-green-500" />
                        <span className="text-sm">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border">
                  <div className="border-b p-4">
                    <div className="text-sm font-medium">Suggested Approach</div>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="space-y-2">
                      {mergeStrategy.suggestedApproach.steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-md border p-3">
                        <div className="text-sm font-medium">Estimated Time</div>
                        <div className="text-lg font-semibold">
                          {mergeStrategy.suggestedApproach.estimatedTime} minutes
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-sm font-medium">Risk Level</div>
                        <Badge
                          variant="outline"
                          className={
                            mergeStrategy.suggestedApproach.riskLevel === 'high'
                              ? 'text-red-500'
                              : mergeStrategy.suggestedApproach.riskLevel === 'medium'
                                ? 'text-yellow-500'
                                : 'text-green-500'
                          }
                        >
                          {mergeStrategy.suggestedApproach.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <div className="border-b p-4">
                    <div className="text-sm font-medium">Historical Success</div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {mergeStrategy.historicalSuccess.map((history, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{history.strategy}</div>
                            <Badge variant="outline">
                              {(history.successRate * 100).toFixed(0)}% success
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Average time: {(history.averageTime / 1000).toFixed(1)}s
                          </div>
                          <div className="h-1 rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${history.successRate * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {renderTeamTrendsDialog()}
      {renderConflictPredictionDialog()}
      {renderChartFilterDialog()}
      {renderExportTemplateDialog()}
      {renderTeamAlertsDialog()}
      {renderCustomMetricsDialog()}
      {renderAnalyticsSection()}
    </div>
  );
}

export default TemplateVersionDiff;
