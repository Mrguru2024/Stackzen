import type { Meta, StoryObj } from '@storybook/react';
import { TemplateAnalytics } from './TemplateAnalytics.tsx';

const meta = {
  title: 'Dev/TemplateAnalytics',
  component: TemplateAnalytics,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TemplateAnalytics>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTemplates = [
  {
    id: '1',
    name: 'Render Time Spike',
    description: 'Template for handling React render performance issues',
    metric: 'Render Time',
    type: 'Performance',
    severity: 'warning' as const,
    steps: ['Check component re-renders', 'Analyze dependency arrays', 'Implement memoization'],
    notes: 'Common in large component trees',
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'John Doe',
    lastModifiedBy: 'John Doe',
    category: 'Performance',
    tags: ['react', 'performance', 'optimization'],
  },
  {
    id: '2',
    name: 'Memory Leak',
    description: 'Template for identifying and fixing memory leaks',
    metric: 'Memory Usage',
    type: 'Memory',
    severity: 'error' as const,
    steps: ['Check event listeners', 'Analyze cleanup functions', 'Monitor heap usage'],
    notes: 'Critical for long-running applications',
    version: 1,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    createdBy: 'Jane Smith',
    lastModifiedBy: 'Jane Smith',
    category: 'Memory',
    tags: ['memory', 'leak', 'performance'],
  },
  {
    id: '3',
    name: 'API Timeout',
    description: 'Template for handling API timeout issues',
    metric: 'Response Time',
    type: 'Network',
    severity: 'warning' as const,
    steps: ['Check network connectivity', 'Verify API endpoints', 'Implement retry logic'],
    notes: 'Common in high-latency environments',
    version: 1,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    createdBy: 'Mike Johnson',
    lastModifiedBy: 'Mike Johnson',
    category: 'Network',
    tags: ['api', 'network', 'timeout'],
  },
];

const mockResolutions = [
  {
    id: '1',
    templateId: '1',
    status: 'resolved' as const,
    startTime: new Date('2024-01-15T10:00:00'),
    endTime: new Date('2024-01-15T11:30:00'),
    assignedTo: 'John Doe',
    notes: 'Fixed by implementing React.memo',
  },
  {
    id: '2',
    templateId: '1',
    status: 'resolved' as const,
    startTime: new Date('2024-01-16T14:00:00'),
    endTime: new Date('2024-01-16T15:45:00'),
    assignedTo: 'Jane Smith',
    notes: 'Optimized dependency array',
  },
  {
    id: '3',
    templateId: '2',
    status: 'in_progress' as const,
    startTime: new Date('2024-01-17T09:00:00'),
    endTime: new Date('2024-01-17T10:30:00'),
    assignedTo: 'Mike Johnson',
    notes: 'Investigating event listener cleanup',
  },
  {
    id: '4',
    templateId: '2',
    status: 'failed' as const,
    startTime: new Date('2024-01-18T11:00:00'),
    endTime: new Date('2024-01-18T12:15:00'),
    assignedTo: 'John Doe',
    notes: 'Unable to reproduce issue',
  },
  {
    id: '5',
    templateId: '3',
    status: 'resolved' as const,
    startTime: new Date('2024-01-19T13:00:00'),
    endTime: new Date('2024-01-19T14:20:00'),
    assignedTo: 'Jane Smith',
    notes: 'Implemented exponential backoff',
  },
];

export const Default: Story = {
  args: {
    templates: mockTemplates,
    resolutions: mockResolutions,
    timeWindow: '30d',
  },
};

export const ShortTimeWindow: Story = {
  args: {
    templates: mockTemplates,
    resolutions: mockResolutions,
    timeWindow: '7d',
  },
};

export const LongTimeWindow: Story = {
  args: {
    templates: mockTemplates,
    resolutions: mockResolutions,
    timeWindow: '1y',
  },
};

export const DarkMode: Story = {
  args: {
    templates: mockTemplates,
    resolutions: mockResolutions,
    timeWindow: '30d',
  },
  parameters: {
    theme: 'dark',
  },
};
