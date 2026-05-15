import type { Meta, StoryObj } from '@storybook/react';
import RuleTemplateGallery from './index';

const meta: Meta<typeof RuleTemplateGallery> = {
  title: 'MoneyControl/RuleTemplateGallery',
  component: RuleTemplateGallery,
};

export default meta;

type Story = StoryObj<typeof RuleTemplateGallery>;

export const Default: Story = {
  args: {},
};
