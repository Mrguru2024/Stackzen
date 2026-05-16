import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui';
import { ScrollArea } from '@/components/ui';
import { DiffEditor } from '@monaco-editor/react';
import { AlertCircle, CheckCircle, Clock, User, Tag, FileText } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  metric: string;
  type: string;
  severity: 'warning' | 'error';
  steps: string[];
  notes: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  category: string;
  tags: string[];
}

interface TemplateVersionComparisonProps {
  template: Template;
  versions: Template[];
  onVersionSelect?: (version: number) => void;
}

export function TemplateVersionComparison({
  template,
  versions,
  onVersionSelect,
}: TemplateVersionComparisonProps) {
  const [selectedVersion, setSelectedVersion] = useState<number>(template.version);

  const _handleVersionChange = (version: string) => {
    const newVersion = parseInt(version);
    setSelectedVersion(newVersion);
    onVersionSelect?.(newVersion);
  };

  const _selectedTemplate = versions.find(v => v.version === selectedVersion);
  const _currentTemplate = template;

  const _formatTemplateForDiff = (template: Template) => {
    return JSON.stringify(
      {
        name: template.name,
        description: template.description,
        metric: template.metric,
        type: template.type,
        severity: template.severity,
        steps: template.steps,
        notes: template.notes,
        category: template.category,
        tags: template.tags,
      },
      null,
      2
    );
  };

  const _getVersionMetadata = (template: Template) => {
    return {
      version: template.version,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      createdBy: template.createdBy,
      lastModifiedBy: template.lastModifiedBy,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedVersion.toString()} onValueChange={_handleVersionChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions
                .sort((a, b) => b.version - a.version)
                .map(version => (
                  <SelectItem key={version.version} value={version.version.toString()}>
                    Version {version.version}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">
            {_selectedTemplate?.version === _currentTemplate.version
              ? 'Current Version'
              : 'Previous Version'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Current Version</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Updated: {_currentTemplate.updatedAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>By: {_currentTemplate.lastModifiedBy}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>Category: {_currentTemplate.category}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Version {selectedVersion}</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Updated: {_selectedTemplate?.updatedAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>By: {_selectedTemplate?.lastModifiedBy}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>Category: {_selectedTemplate?.category}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="h-[500px]">
          <DiffEditor
            height="100%"
            language="json"
            original={_formatTemplateForDiff(_currentTemplate)}
            modified={_formatTemplateForDiff(_selectedTemplate!)}
            options={{
              readOnly: true,
              renderSideBySide: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              minimap: { enabled: false },
            }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Key Changes</h4>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {_currentTemplate.steps.map((step, index) => {
                  const _oldStep = _selectedTemplate?.steps[index];
                  const _hasChanged = _oldStep !== step;
                  return (
                    <div
                      key={index}
                      className={`rounded p-2 ${
                        _hasChanged ? 'bg-yellow-50 dark:bg-yellow-950' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {_hasChanged ? (
                          <AlertCircle className="mt-1 h-4 w-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="mt-1 h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <p className="text-sm">{step}</p>
                          {_hasChanged && _oldStep && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Previous: {_oldStep}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Metadata Changes</h4>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {Object.entries(_getVersionMetadata(_currentTemplate)).map(([key, value]) => {
                  const _metaOld = _getVersionMetadata(_selectedTemplate!);
                  const _oldValue = (_metaOld as Record<string, unknown>)[key];
                  const _hasChanged = _oldValue !== value;
                  return (
                    <div
                      key={key}
                      className={`rounded p-2 ${
                        _hasChanged ? 'bg-yellow-50 dark:bg-yellow-950' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {_hasChanged ? (
                          <AlertCircle className="mt-1 h-4 w-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="mt-1 h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <p className="text-sm">
                            {key}: {value.toString()}
                          </p>
                          {_hasChanged && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Previous: {String(_oldValue)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </Card>
      </div>
    </div>
  );
}
