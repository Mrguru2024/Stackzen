import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JobsHub from './index';

const meta: Meta<typeof JobsHub> = {
  title: 'Features/JobsHub',
  component: JobsHub,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => {
      global.fetch = Object.assign(
        () =>
          Promise.resolve({
            ok: true,
            json: async () => [],
          }),
        { prefetch: async () => undefined }
      ) as typeof fetch;
      return <Story />;
    },
  ],
};

export default meta;

type Story = StoryObj<typeof JobsHub>;

export const Empty: Story = {};
