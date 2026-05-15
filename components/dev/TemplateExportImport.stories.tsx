import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TemplateExportImport } from './TemplateExportImport.tsx';

const meta: Meta<typeof TemplateExportImport> = {
  title: 'Dev/TemplateExportImport',
  component: TemplateExportImport,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TemplateExportImport>;

const mockTemplates = [
  {
    id: 'render-spike',
    name: 'Render Time Spike',
    description: 'High render time affecting component performance',
    metric: 'renderTime',
    type: 'spike',
    severity: 'warning' as const,
    steps: [
      'Check for unnecessary re-renders',
      'Implement React.memo or useMemo where appropriate',
      'Review component dependencies',
      'Optimize heavy computations',
    ],
    notes: 'Consider implementing virtualization for long lists',
    version: 1,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    createdBy: 'John Doe',
    lastModifiedBy: 'John Doe',
    category: 'Performance',
    tags: ['react', 'optimization', 'rendering'],
  },
  {
    id: 'memory-leak',
    name: 'Memory Leak',
    description: 'Increasing memory usage over time',
    metric: 'memoryUsage',
    type: 'trend',
    severity: 'error' as const,
    steps: [
      'Check for unsubscribed event listeners',
      'Review useEffect cleanup functions',
      'Monitor large object allocations',
      'Implement memory profiling',
    ],
    notes: 'Use Chrome DevTools Memory tab for analysis',
    version: 2,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-02'),
    createdBy: 'Jane Smith',
    lastModifiedBy: 'John Doe',
    category: 'Memory',
    tags: ['memory', 'leak', 'cleanup'],
  },
];

export const Default: Story = {
  args: {
    templates: mockTemplates,
    onImport: templates => {
      console.log('Templates imported:', templates);
    },
  },
};

export const DarkMode: Story = {
  args: {
    templates: mockTemplates,
    onImport: templates => {
      console.log('Templates imported:', templates);
    },
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
