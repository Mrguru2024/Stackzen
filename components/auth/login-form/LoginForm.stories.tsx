import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import LoginForm from './index.tsx';

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  args: {},
};

export const WithSuccessCallback: Story = {
  args: {
    onSuccess: () => console.log('Login successful'),
  },
};

export const WithErrorCallback: Story = {
  args: {
    onError: error => console.log('Login error:', error),
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '/api/auth/signin',
        method: 'POST',
        status: 200,
        delay: 2000,
        response: { ok: true },
      },
    ],
  },
};

export const Error: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '/api/auth/signin',
        method: 'POST',
        status: 401,
        response: { error: 'Invalid credentials' },
      },
    ],
  },
};
