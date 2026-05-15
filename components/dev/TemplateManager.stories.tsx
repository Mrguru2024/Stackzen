import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TemplateManager } from './TemplateManager.tsx';

const meta: Meta<typeof TemplateManager> = {
  title: 'Dev/TemplateManager',
  component: TemplateManager,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TemplateManager>;

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
  {
    id: 'network-timeout',
    name: 'Network Request Timeout',
    description: 'API requests timing out or taking too long',
    metric: 'networkTime',
    type: 'spike',
    severity: 'error' as const,
    steps: [
      'Check API endpoint response times',
      'Implement request timeout handling',
      'Add retry logic with exponential backoff',
      'Monitor network conditions',
    ],
    notes: 'Consider implementing request caching',
    version: 1,
    createdAt: new Date('2024-03-03'),
    updatedAt: new Date('2024-03-03'),
    createdBy: 'Mike Johnson',
    lastModifiedBy: 'Mike Johnson',
    category: 'Network',
    tags: ['api', 'timeout', 'network'],
  },
  {
    id: 'accessibility-issues',
    name: 'Accessibility Violations',
    description: 'WCAG compliance issues detected',
    metric: 'a11yScore',
    type: 'trend',
    severity: 'warning' as const,
    steps: [
      'Run accessibility audit',
      'Fix color contrast issues',
      'Add ARIA labels',
      'Implement keyboard navigation',
    ],
    notes: 'Use axe-core for automated testing',
    version: 1,
    createdAt: new Date('2024-03-04'),
    updatedAt: new Date('2024-03-04'),
    createdBy: 'Sarah Wilson',
    lastModifiedBy: 'Sarah Wilson',
    category: 'Accessibility',
    tags: ['a11y', 'wcag', 'compliance'],
  },
];

export const Default: Story = {
  args: {
    templates: mockTemplates,
    onTemplateUpdate: template => {
      console.log('Template updated:', template);
    },
    onTemplateShare: (template, recipients) => {
      console.log('Template shared:', template, 'with recipients:', recipients);
    },
  },
};

export const DarkMode: Story = {
  args: {
    templates: mockTemplates,
    onTemplateUpdate: template => {
      console.log('Template updated:', template);
    },
    onTemplateShare: (template, recipients) => {
      console.log('Template shared:', template, 'with recipients:', recipients);
    },
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
