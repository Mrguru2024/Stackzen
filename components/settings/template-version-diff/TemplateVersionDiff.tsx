import React from 'react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/ui/icons';
import { format } from 'date-fns';
import { TemplateVersion } from '@/lib/import';
import { useToast } from '@/components/ui/use-toast';
import type * as TemplateVersionDiffTypes from './types';
import { MergeAnalytics } from './MergeAnalytics';
import { BranchManagement } from './BranchManagement';
import { TeamAlerts } from './TeamAlerts';
import { ExportDialog } from './ExportDialog';

interface TemplateVersionDiffProps {
  versions: TemplateVersion[];
  onRestore: (version: number) => Promise<void>;
  isRestoring: boolean;
  onAddTag?: (version: number, tag: string) => Promise<void>;
  onRemoveTag?: (version: number, tag: string) => Promise<void>;
  onAddNote?: (version: number, note: string) => Promise<void>;
  onImport?: (template: any, versions: TemplateVersion[]) => Promise<void>;
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
  mergeHistory?: TemplateVersionDiffTypes.MergeHistory[];
  template: any;
  onCompareBranches?: (
    sourceBranch: string,
    targetBranch: string
  ) => Promise<TemplateVersionDiffTypes.BranchComparison>;
  onUpdateProtectionRule?: (rule: TemplateVersionDiffTypes.BranchProtectionRule) => Promise<void>;
  onDeleteProtectionRule?: (branchName: string) => Promise<void>;
  protectionRules?: TemplateVersionDiffTypes.BranchProtectionRule[];
  userRole?: string;
  onAddResolutionNote?: (mergeId: string, field: string, note: string) => Promise<void>;
  mergeAnalytics?: TemplateVersionDiffTypes.MergeAnalytics;
  onExportAnalytics?: (options: TemplateVersionDiffTypes.ExportOptions) => Promise<void>;
  onCompareContributors?: (
    contributor1: string,
    contributor2: string
  ) => Promise<TemplateVersionDiffTypes.ContributorComparison>;
  onGetMergeStrategyRecommendation?: (
    sourceBranch: string,
    targetBranch: string,
    contributors: string[]
  ) => Promise<TemplateVersionDiffTypes.MergeStrategyRecommendation>;
  chartData?: {
    mergeFrequency: TemplateVersionDiffTypes.TimeSeriesData[];
    conflictPatterns: TemplateVersionDiffTypes.ChartData[];
    contributorActivity: TemplateVersionDiffTypes.ChartData[];
    successRates: TemplateVersionDiffTypes.ChartData[];
  };
  onGetTeamPerformanceTrends?: (
    dateRange: TemplateVersionDiffTypes.DateRange
  ) => Promise<TemplateVersionDiffTypes.TeamPerformanceTrend[]>;
  onPredictConflicts?: (
    sourceBranch: string,
    targetBranch: string
  ) => Promise<TemplateVersionDiffTypes.ConflictPrediction>;
  onFilterCharts?: (filter: TemplateVersionDiffTypes.ChartFilter) => Promise<void>;
  onSaveExportTemplate?: (template: TemplateVersionDiffTypes.ExportTemplate) => Promise<void>;
  onLoadExportTemplate?: (templateId: string) => Promise<TemplateVersionDiffTypes.ExportTemplate>;
  onDeleteExportTemplate?: (templateId: string) => Promise<void>;
  exportTemplates?: TemplateVersionDiffTypes.ExportTemplate[];
  onCreateTeamAlert?: (
    alert: Omit<TemplateVersionDiffTypes.TeamAlert, 'id' | 'createdAt' | 'status'>
  ) => Promise<void>;
  onUpdateTeamAlert?: (
    alertId: string,
    status: TemplateVersionDiffTypes.TeamAlert['status']
  ) => Promise<void>;
  teamAlerts?: TemplateVersionDiffTypes.TeamAlert[];
  onCreateCustomMetric?: (
    metric: Omit<TemplateVersionDiffTypes.CustomMetric, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onUpdateCustomMetric?: (
    metricId: string,
    metric: Partial<TemplateVersionDiffTypes.CustomMetric>
  ) => Promise<void>;
  onDeleteCustomMetric?: (metricId: string) => Promise<void>;
  customMetrics?: TemplateVersionDiffTypes.CustomMetric[];
  onGetMergeStrategyInsights?: () => Promise<TemplateVersionDiffTypes.MergeStrategyInsight[]>;
  onGetTeamPerformanceInsights?: () => Promise<TemplateVersionDiffTypes.TeamPerformanceInsight[]>;
  onCreateFormula?: (formula: Omit<TemplateVersionDiffTypes.FormulaBuilder, 'id'>) => Promise<void>;
  onUpdateFormula?: (
    formulaId: string,
    updates: Partial<TemplateVersionDiffTypes.FormulaBuilder>
  ) => Promise<void>;
  onDeleteFormula?: (formulaId: string) => Promise<void>;
  mergeStrategyInsights?: TemplateVersionDiffTypes.MergeStrategyInsight[];
  teamPerformanceInsights?: TemplateVersionDiffTypes.TeamPerformanceInsight[];
  formulaBuilders?: TemplateVersionDiffTypes.FormulaBuilder[];
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
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareVersion, setCompareVersion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'versions' | 'analytics' | 'branches' | 'alerts'>(
    'versions'
  );
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const { toast } = useToast();

  const _sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => b.version - a.version);
  }, [versions]);

  const _handleVersionSelect = (version: number) => {
    setSelectedVersion(version);
  };

  const _handleCompare = () => {
    if (selectedVersion && compareVersion) {
      // Handle comparison logic
    }
  };

  const _handleRestore = async (_version: number) => {
    try {
      await onRestore(_version);
      toast({
        title: 'Version Restored',
        description: `Successfully restored to version ${_version}`,
      });
    } catch (error) {
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore version',
        variant: 'destructive',
      });
    }
  };

  const _renderVersionsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Template Versions</h3>
        <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)}>
          <Icons.download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-2">
          {_sortedVersions.map(version => (
            <div
              key={version.version}
              className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                selectedVersion === version.version
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => _handleVersionSelect(version.version)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Version {version.version}</span>
                    {version.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(new Date(version.createdAt), 'PPP')}
                  </p>
                  {version.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{version.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      _handleRestore(version.version);
                    }}
                    disabled={isRestoring}
                  >
                    {isRestoring ? (
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icons.rotateCcw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Version Management</h2>
          <p className="text-muted-foreground">Manage and compare template versions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab('versions')}>
            Versions
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('analytics')}>
            Analytics
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('branches')}>
            Branches
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('alerts')}>
            Alerts
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-lg border p-6">
        {activeTab === 'versions' && _renderVersionsList()}

        {activeTab === 'analytics' && (
          <MergeAnalytics
            mergeAnalytics={mergeAnalytics}
            chartData={chartData}
            onExportAnalytics={onExportAnalytics}
            onCompareContributors={onCompareContributors}
            onGetMergeStrategyRecommendation={onGetMergeStrategyRecommendation}
            onGetTeamPerformanceTrends={onGetTeamPerformanceTrends}
            onPredictConflicts={onPredictConflicts}
            onFilterCharts={onFilterCharts}
            onSaveExportTemplate={onSaveExportTemplate}
            onLoadExportTemplate={onLoadExportTemplate}
            onDeleteExportTemplate={onDeleteExportTemplate}
            exportTemplates={exportTemplates}
            onCreateCustomMetric={onCreateCustomMetric}
            onUpdateCustomMetric={onUpdateCustomMetric}
            onDeleteCustomMetric={onDeleteCustomMetric}
            customMetrics={customMetrics}
            onGetMergeStrategyInsights={onGetMergeStrategyInsights}
            onGetTeamPerformanceInsights={onGetTeamPerformanceInsights}
            onCreateFormula={onCreateFormula}
            onUpdateFormula={onUpdateFormula}
            onDeleteFormula={onDeleteFormula}
            mergeStrategyInsights={mergeStrategyInsights}
            teamPerformanceInsights={teamPerformanceInsights}
            formulaBuilders={formulaBuilders}
          />
        )}

        {activeTab === 'branches' && (
          <BranchManagement
            versions={versions}
            mergeHistory={mergeHistory}
            template={template}
            onBranch={onBranch}
            onMerge={onMerge}
            onDeleteBranch={onDeleteBranch}
            onRenameBranch={onRenameBranch}
            onArchiveBranch={onArchiveBranch}
            onUnarchiveBranch={onUnarchiveBranch}
            onCompareBranches={onCompareBranches}
            onUpdateProtectionRule={onUpdateProtectionRule}
            onDeleteProtectionRule={onDeleteProtectionRule}
            protectionRules={protectionRules}
            userRole={userRole}
            onAddResolutionNote={onAddResolutionNote}
          />
        )}

        {activeTab === 'alerts' && (
          <TeamAlerts
            teamAlerts={teamAlerts}
            onCreateTeamAlert={onCreateTeamAlert}
            onUpdateTeamAlert={onUpdateTeamAlert}
          />
        )}
      </div>

      {/* Export Dialog */}
      {isExportDialogOpen && (
        <ExportDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          onExport={onExportAnalytics}
          exportTemplates={exportTemplates}
          onSaveExportTemplate={onSaveExportTemplate}
          onLoadExportTemplate={onLoadExportTemplate}
          onDeleteExportTemplate={onDeleteExportTemplate}
        />
      )}
    </div>
  );
}
