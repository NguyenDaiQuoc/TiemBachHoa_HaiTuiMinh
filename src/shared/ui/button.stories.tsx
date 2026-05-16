import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Shared/UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Loading: Story = {
  args: {
    children: 'Adding to cart',
    loading: true,
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        Mua ngay <ArrowRight className="ml-2 h-4 w-4" />
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    children: <ShoppingBag className="h-5 w-5" />,
    "aria-label": "Add to bag",
  },
};
