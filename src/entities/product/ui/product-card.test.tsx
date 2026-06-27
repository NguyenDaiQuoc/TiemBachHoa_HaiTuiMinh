import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProductCard } from './product-card';
import { Product } from '../model/types';
import { renderWithProviders } from '@/src/shared/lib/test-utils/render-with-providers';

const mockProduct: Product = {
  id: 'test-1',
  name: 'Test Product',
  slug: 'test-product',
  price: 150000,
  description: 'A test description',
  image: 'https://example.com/image.jpg',
  images: ['https://example.com/image.jpg'],
  categoryId: 'cat-test',
  category: 'TEST',
  isNew: true,
  stock: 10,
  soldCount: 4,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ProductCard component', () => {
  it('renders product information correctly', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('TEST')).toBeInTheDocument();
    expect(screen.getByText('NEW')).toBeInTheDocument();
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
  });

  it('renders add to cart action', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    const addButton = screen.getByTestId('add-to-cart-test-product');
    fireEvent.click(addButton);
    expect(addButton).toBeInTheDocument();
  });
});
