import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ResolutionTemplates } from './ResolutionTemplates.tsx';

const meta: Meta<typeof ResolutionTemplates> = {
  title: 'Dev/ResolutionTemplates',
  component: ResolutionTemplates,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResolutionTemplates>;

export const Default: Story = {
  args: {
    onApplyTemplate: template => {
      console.log('Template applied:', template);
    },
  },
};

export const DarkMode: Story = {
  args: {
    onApplyTemplate: template => {
      console.log('Template applied:', template);
    },
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
