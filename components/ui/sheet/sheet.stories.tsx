import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from './index';
import { Button } from '../button';

const meta: Meta<typeof Sheet> = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Whether the sheet is open by default',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  render: args => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>This is a description of the sheet content.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p>Sheet content goes here.</p>
        </div>
        <SheetFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const WithLongContent: Story = {
  render: args => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <Button>Open Sheet with Long Content</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Long Content Sheet</SheetTitle>
          <SheetDescription>
            This sheet contains a lot of content to demonstrate scrolling.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded border p-4">
              <h3 className="font-semibold">Section {i + 1}</h3>
              <p>This is some content for section {i + 1}.</p>
            </div>
          ))}
        </div>
        <SheetFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const WithCustomWidth: Story = {
  render: args => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <Button>Open Wide Sheet</Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Wide Sheet</SheetTitle>
          <SheetDescription>This sheet has a custom width of 600px.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p>Wide sheet content goes here.</p>
        </div>
        <SheetFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};
