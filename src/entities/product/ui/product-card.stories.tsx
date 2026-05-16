import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './product-card';

const meta: Meta<typeof ProductCard> = {
  title: 'Entities/Product/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

const mockProduct = {
  id: '1',
  name: 'Nến Thơm Đà Lạt Chiều Mưa',
  price: 350000,
  description: 'Hương thơm của gỗ thông và đất ấm sau cơn mưa rừng.',
  image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800',
  category: 'NẾN THƠM',
  isNew: true,
};

export const Default: Story = {
  args: {
    product: mockProduct,
  },
};

export const WithoutBadge: Story = {
  args: {
    product: { ...mockProduct, isNew: false },
  },
};
