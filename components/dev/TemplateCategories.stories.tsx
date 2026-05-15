import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TemplateCategories } from './TemplateCategories.tsx';

const meta: Meta<typeof TemplateCategories> = {
  title: 'Dev/TemplateCategories',
  component: TemplateCategories,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TemplateCategories>;

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
    severity: 'error' as const,
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

export const Default: Story = {
  args: {
    templates: mockTemplates,
    onCategorySelect: category => console.log('Selected category:', category),
    onTagSelect: tags => console.log('Selected tags:', tags),
    onSearch: query => console.log('Search query:', query),
  },
};

export const DarkMode: Story = {
  args: {
    templates: mockTemplates,
    onCategorySelect: category => console.log('Selected category:', category),
    onTagSelect: tags => console.log('Selected tags:', tags),
    onSearch: query => console.log('Search query:', query),
  },
  parameters: {
    theme: 'dark',
  },
};
