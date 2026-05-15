import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TemplateVersionComparison } from './TemplateVersionComparison.tsx';

const meta: Meta<typeof TemplateVersionComparison> = {
  title: 'Dev/TemplateVersionComparison',
  component: TemplateVersionComparison,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TemplateVersionComparison>;

const currentTemplate = {
  id: '1',
  name: 'Render Time Spike',
  description: 'Template for handling React render performance issues',
  metric: 'Render Time',
  type: 'Performance',
  severity: 'warning' as const,
  steps: [
    'Check component re-renders',
    'Analyze dependency arrays',
    'Implement memoization',
    'Optimize heavy computations',
  ],
  notes: 'Common in large component trees',
  version: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  createdBy: 'John Doe',
  lastModifiedBy: 'Jane Smith',
  category: 'Performance',
  tags: ['react', 'performance', 'optimization'],
};

const templateVersions = [
  {
    ...currentTemplate,
    version: 1,
    steps: ['Check component re-renders', 'Analyze dependency arrays', 'Implement memoization'],
    updatedAt: new Date('2024-01-01'),
    lastModifiedBy: 'John Doe',
    notes: 'Initial version',
  },
  currentTemplate,
];

export const Default: Story = {
  args: {
    template: currentTemplate,
    versions: templateVersions,
  },
};

export const DarkMode: Story = {
  args: {
    template: currentTemplate,
    versions: templateVersions,
  },
  parameters: {
    theme: 'dark',
  },
};
