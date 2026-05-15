'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectForecastItem {
  id: string;
  name: string;
  forecastedAmount: number;
  actualAmount: number;
  startDate: string | null;
  endDate: string | null;
  status: 'completed' | 'in-progress' | 'upcoming' | 'pending';
  clientName: string | null;
}

interface ProjectsResponse {
  items: ProjectForecastItem[];
  hasData: boolean;
}

interface ClientRow {
  id: string;
  name: string;
}

interface NewProjectForm {
  name: string;
  clientId: string;
  forecastedAmount: string;
  startDate: string;
  endDate: string;
}

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : '—';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

function getStatusVariant(status: ProjectForecastItem['status']) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in-progress':
      return 'warning';
    case 'upcoming':
      return 'secondary';
    default:
      return 'default';
  }
}

function getProgressPct(forecasted: number, actual: number): number {
  if (forecasted === 0) return 0;
  return Math.min((actual / forecasted) * 100, 100);
}

export default function ProjectForecast() {
  const { status } = useSession();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewProjectForm>({
    name: '',
    clientId: '',
    forecastedAmount: '',
    startDate: '',
    endDate: '',
  });

  const projectsQuery = useQuery<ProjectsResponse, Error>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load projects (${res.status})`);
      }
      return res.json();
    },
    enabled: status === 'authenticated',
    staleTime: 60_000,
  });

  const clientsQuery = useQuery<ClientRow[], Error>({
    queryKey: ['clients', 'select'],
    queryFn: async () => {
      const res = await fetch('/api/clients', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load clients (${res.status})`);
      }
      return res.json();
    },
    enabled: status === 'authenticated' && showForm,
    staleTime: 60_000,
  });

  const createMutation = useMutation<ProjectForecastItem, Error, NewProjectForm>({
    mutationFn: async input => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: input.clientId,
          name: input.name,
          forecastedAmount: Number(input.forecastedAmount),
          startDate: input.startDate ? new Date(input.startDate).toISOString() : undefined,
          endDate: input.endDate ? new Date(input.endDate).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to create project (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Project created');
      setShowForm(false);
      setForm({ name: '', clientId: '', forecastedAmount: '', startDate: '', endDate: '' });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: err => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.clientId || !form.forecastedAmount) {
      toast.error('Name, client, and forecasted amount are required.');
      return;
    }
    createMutation.mutate(form);
  };

  const items = projectsQuery.data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Forecasts</CardTitle>
          <Button onClick={() => setShowForm(prev => !prev)} variant="outline">
            {showForm ? 'Cancel' : 'Add Project'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-lg border p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="clientId">Client</Label>
                <Select
                  value={form.clientId}
                  onValueChange={value => setForm({ ...form, clientId: value })}
                >
                  <SelectTrigger id="clientId">
                    <SelectValue
                      placeholder={
                        clientsQuery.isLoading ? 'Loading…' : 'Choose a client'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(clientsQuery.data ?? []).map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="forecastedAmount">Forecasted Amount ($)</Label>
                <Input
                  id="forecastedAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.forecastedAmount}
                  onChange={e => setForm({ ...form, forecastedAmount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="mt-4" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Add Project'}
            </Button>
          </form>
        )}

        {projectsQuery.isLoading || status === 'loading' ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : projectsQuery.error ? (
          <p className="text-sm text-destructive">{projectsQuery.error.message}</p>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No projects yet. Add a project above to start tracking forecasts.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(project => (
              <div key={project.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {project.clientName ? `${project.clientName} · ` : ''}
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(project.status) as any}>{project.status}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Forecasted: {formatCurrency(project.forecastedAmount)}</span>
                    <span>Actual: {formatCurrency(project.actualAmount)}</span>
                  </div>
                  <Progress
                    value={getProgressPct(project.forecastedAmount, project.actualAmount)}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {project.actualAmount > 0 && (
                      <span
                        className={
                          project.actualAmount >= project.forecastedAmount
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }
                      >
                        {project.actualAmount >= project.forecastedAmount ? '✓ ' : '⚠ '}
                        {formatCurrency(
                          Math.abs(project.actualAmount - project.forecastedAmount)
                        )}
                        {project.actualAmount >= project.forecastedAmount ? ' over' : ' under'}{' '}
                        forecast
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
