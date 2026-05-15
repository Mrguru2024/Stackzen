import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * JobDetail uses `useParams()` from Next.js. Preview it in the app at `/jobs/[jobId]`.
 * This story documents the surface for Storybook without a full Next.js runtime.
 */
const meta: Meta = {
  title: 'Features/JobDetail',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Rendered in the dashboard at `/jobs/[jobId]`. Authenticated users see exports (CSV/JSON) and responsive layout.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const DocumentationNote: Story = {
  render: () => (
    <div className="max-w-md rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
      Open the Jobs list in StackZen, then select a job. Storybook does not provide Next.js
      navigation for <code className="rounded bg-muted px-1 py-0.5">useParams</code>.
    </div>
  ),
};
