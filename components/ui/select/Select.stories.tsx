import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './index.tsx';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
    onValueChange: {
      action: 'value changed',
      description: 'Event handler called when the value changes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
  { value: 'grape', label: 'Grape' },
];

export const Default: Story = {
  render: args => (
    <Select {...args}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const WithDefaultValue: Story = {
  render: args => (
    <Select defaultValue="banana" {...args}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: args => (
    <Select disabled {...args}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: args => (
    <Select {...args}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="fruits">Fruits</SelectItem>
        <SelectItem value="vegetables">Vegetables</SelectItem>
        <SelectItem value="dairy">Dairy</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// New stories
export const WithSearch: Story = {
  render: args => (
    <Select {...args}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Search for a country" />
      </SelectTrigger>
      <SelectContent>
        <div className="flex items-center px-3 pb-2">
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search countries..."
          />
        </div>
        <SelectItem value="us">United States</SelectItem>
        <SelectItem value="uk">United Kingdom</SelectItem>
        <SelectItem value="ca">Canada</SelectItem>
        <SelectItem value="au">Australia</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithIcons: Story = {
  render: args => (
    <Select {...args}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <div className="flex items-center">
            <span className="mr-2">☀️</span>
            Light
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center">
            <span className="mr-2">🌙</span>
            Dark
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center">
            <span className="mr-2">💻</span>
            System
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithError: Story = {
  render: args => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Select {...args}>
        <SelectTrigger className="w-full border-destructive">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-destructive">This field is required</p>
    </div>
  ),
};

export const WithDescription: Story = {
  render: args => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Select {...args}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">Choose the plan that best fits your needs</p>
    </div>
  ),
};

export const WithCustomStyling: Story = {
  render: args => (
    <Select {...args}>
      <SelectTrigger className="w-[180px] bg-primary text-primary-foreground hover:bg-primary/90">
        <SelectValue placeholder="Select style" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="style1">Style 1</SelectItem>
        <SelectItem value="style2">Style 2</SelectItem>
        <SelectItem value="style3">Style 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};
