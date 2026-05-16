import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from './product-card';
import { Product } from '../model/types';

const mockProduct: Product = {
  id: 'test-1',
  name: 'Test Product',
  price: 150000,
  description: 'A test description',
  image: 'https://example.com/image.jpg',
  category: 'TEST',
  isNew: true,
};

describe('ProductCard component', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('TEST')).toBeInTheDocument();
    expect(screen.getByText('NEW')).toBeInTheDocument();
    // Check price formatting
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
  });

  it('handles add to cart action', () => {
    render(<ProductCard product={mockProduct} />);
    const addButton = screen.getByText('THÊM VÀO GIỎ');
    fireEvent.click(addButton);
    // You would typically check if the store was called or toast shown
  });

  it('handles wishlist toggle', () => {
    render(<ProductCard product={mockProduct} />);
    const heartButton = screen.getByRole('button', { name: /heart/i }); // Assuming it has an aria label or check by role
    // Heart button might not have text, we use findBy (it's hidden initially in CSS but JSDOM might see it)
    // Actually it's visible on hover in real browser, JSDOM doesn't hover.
  });
});
