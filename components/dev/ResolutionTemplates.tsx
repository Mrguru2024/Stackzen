import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui';
import { ScrollArea } from '@/components/ui';
import { Badge } from '@/components/ui';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  metric: string;
  type: string;
  severity: 'warning' | 'error';
  steps: string[];
  notes: string;
}

interface ResolutionTemplatesProps {
  onApplyTemplate: (template: Template) => void;
}

const templates: Template[] = [
  {
    id: 'render-spike',
    name: 'Render Time Spike',
    description: 'High render time affecting component performance',
    metric: 'renderTime',
    type: 'spike',
    severity: 'warning',
    steps: [
      'Check for unnecessary re-renders',
      'Implement React.memo or useMemo where appropriate',
      'Review component dependencies',
      'Optimize heavy computations',
    ],
    notes: 'Consider implementing virtualization for long lists',
  },
  {
    id: 'memory-leak',
    name: 'Memory Leak',
    description: 'Increasing memory usage over time',
    metric: 'memoryUsage',
    type: 'trend',
    severity: 'error',
    steps: [
      'Check for unsubscribed event listeners',
      'Review useEffect cleanup functions',
      'Monitor large object allocations',
      'Implement memory profiling',
    ],
    notes: 'Use Chrome DevTools Memory tab for analysis',
  },
  {
    id: 'frame-drop',
    name: 'Frame Rate Drop',
    description: 'Frame time exceeding 16.67ms (60fps)',
    metric: 'frameTime',
    type: 'spike',
    severity: 'error',
    steps: [
      'Identify heavy operations in render cycle',
      'Move computations off main thread',
      'Implement requestAnimationFrame for animations',
      'Optimize CSS transitions',
    ],
    notes: 'Consider using Web Workers for heavy computations',
  },
  {
    id: 'update-lag',
    name: 'Update Time Lag',
    description: 'Slow component update times',
    metric: 'updateTime',
    type: 'spike',
    severity: 'warning',
    steps: [
      'Review state update patterns',
      'Check for unnecessary state updates',
      'Optimize context usage',
      'Implement debouncing where appropriate',
    ],
    notes: 'Consider using state management library for complex state',
  },
];

export function ResolutionTemplates({ onApplyTemplate }: ResolutionTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customNotes, setCustomNotes] = useState('');

  const _handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    onApplyTemplate({
      ...selectedTemplate,
      notes: customNotes || selectedTemplate.notes,
    });
  };

  const _getSeverityColor = (severity: 'warning' | 'error') => {
    return severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  };

  const _getSeverityIcon = (severity: 'warning' | 'error') => {
    return severity === 'warning' ? (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Resolution Templates</h3>
        <div className="space-y-4">
          <div>
            <Label>Select Template</Label>
            <Select
              value={selectedTemplate?.id}
              onValueChange={value =>
                setSelectedTemplate(templates.find(t => t.id === value) || null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {_getSeverityIcon(selectedTemplate.severity)}
                <Badge variant="outline" className={_getSeverityColor(selectedTemplate.severity)}>
                  {selectedTemplate.severity}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedTemplate.metric} - {selectedTemplate.type}
                </span>
              </div>

              <p className="text-sm">{selectedTemplate.description}</p>

              <div>
                <Label>Resolution Steps</Label>
                <ScrollArea className="h-32 rounded-md border p-4">
                  <ol className="list-inside list-decimal space-y-2">
                    {selectedTemplate.steps.map((step, index) => (
                      <li key={index} className="text-sm">
                        {step}
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder={selectedTemplate.notes}
                  className="h-24"
                />
              </div>

              <Button onClick={_handleApplyTemplate}>Apply Template</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
