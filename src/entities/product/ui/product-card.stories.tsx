import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './product-card';
import type { Product } from '../model/types';

const meta: Meta<typeof ProductCard> = {
  title: 'Entities/Product/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

const mockProduct: Product = {
  id: '1',
  name: 'Nến thơm Đà Lạt Chiều Mưa',
  slug: 'nen-thom-da-lat-chieu-mua',
  price: 350000,
  description: 'Hương thơm của gỗ thông và đất ấm sau cơn mưa rừng.',
  image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800',
  images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800'],
  categoryId: 'cat-1',
  category: 'Nến thơm',
  isNew: true,
  stock: 24,
  soldCount: 18,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
