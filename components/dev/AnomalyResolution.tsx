import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Anomaly } from './PerformanceAnomalies.tsx';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

interface Resolution {
  id: string;
  anomalyId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  assignedTo: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  resolutionTime?: number; // Time taken to resolve in minutes
}

interface AnomalyResolutionProps {
  anomalies: Anomaly[];
  onResolutionUpdate?: (resolution: Resolution) => void;
}

export function AnomalyResolution({ anomalies, onResolutionUpdate }: AnomalyResolutionProps) {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [status, setStatus] = useState<Resolution['status']>('open');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreateResolution = () => {
    if (!selectedAnomaly) return;

    const resolution: Resolution = {
      id: Math.random().toString(36).substr(2, 9),
      anomalyId: selectedAnomaly.id || Math.random().toString(36).substr(2, 9),
      status,
      assignedTo,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setResolutions(prev => [...prev, resolution]);
    onResolutionUpdate?.(resolution);
    setSelectedAnomaly(null);
    setStatus('open');
    setAssignedTo('');
    setNotes('');
  };

  const handleUpdateStatus = (resolutionId: string, newStatus: Resolution['status']) => {
    setResolutions(prev =>
      prev.map(r => {
        if (r.id === resolutionId) {
          const updated = {
            ...r,
            status: newStatus,
            updatedAt: new Date(),
            ...(newStatus === 'resolved' && {
              resolutionTime: Math.round(
                (new Date().getTime() - r.createdAt.getTime()) / (1000 * 60)
              ),
            }),
          };
          onResolutionUpdate?.(updated);
          return updated;
        }
        return r;
      })
    );
  };

  const getStatusIcon = (status: Resolution['status']) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'ignored':
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Resolution['status']) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'ignored':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Create Resolution</h3>
        <div className="space-y-4">
          <div>
            <Label>Select Anomaly</Label>
            <Select
              value={selectedAnomaly?.id}
              onValueChange={value =>
                setSelectedAnomaly(anomalies.find(a => a.id === value) || null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an anomaly" />
              </SelectTrigger>
              <SelectContent>
                {anomalies
                  .filter(a => !resolutions.some(r => r.anomalyId === a.id))
                  .map(anomaly => (
                    <SelectItem key={anomaly.id} value={anomaly.id || ''}>
                      {anomaly.metric} - {anomaly.type} ({anomaly.severity})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value: Resolution['status']) => setStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assigned To</Label>
            <Input
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="Enter assignee name"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add resolution notes..."
            />
          </div>

          <Button onClick={handleCreateResolution} disabled={!selectedAnomaly || !assignedTo}>
            Create Resolution
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Resolution History</h3>
        <div className="space-y-4">
          {resolutions.map(resolution => {
            const anomaly = anomalies.find(a => a.id === resolution.anomalyId);
            if (!anomaly) return null;

            return (
              <div
                key={resolution.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(resolution.status)}
                    <Badge variant="outline" className={getStatusColor(resolution.status)}>
                      {resolution.status.replace('_', ' ')}
                    </Badge>
                    <span className="font-medium">
                      {anomaly.metric} - {anomaly.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assigned to: {resolution.assignedTo}
                  </p>
                  {resolution.notes && <p className="text-sm">{resolution.notes}</p>}
                  <div className="text-xs text-muted-foreground">
                    Created: {format(resolution.createdAt, 'PPpp')}
                    {resolution.updatedAt > resolution.createdAt && (
                      <span className="ml-2">Updated: {format(resolution.updatedAt, 'PPpp')}</span>
                    )}
                    {resolution.resolutionTime && (
                      <span className="ml-2">
                        Resolution time: {resolution.resolutionTime} minutes
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {resolution.status !== 'resolved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(resolution.id, 'resolved')}
                    >
                      Mark Resolved
                    </Button>
                  )}
                  {resolution.status !== 'ignored' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(resolution.id, 'ignored')}
                    >
                      Ignore
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {resolutions.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No resolutions created yet</div>
          )}
        </div>
      </Card>
    </div>
  );
}
