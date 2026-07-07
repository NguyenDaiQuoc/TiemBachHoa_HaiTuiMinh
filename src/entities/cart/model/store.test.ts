import { beforeEach, describe, expect, it } from 'vitest';
import { Product } from '../../product/model/types';
import { useCartStore } from './store';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'product-1',
  name: 'Tai nghe Bluetooth FitGo',
  slug: 'tai-nghe-bluetooth-fitgo',
  price: 120000,
  description: 'A compact bluetooth headset',
  image: 'https://example.com/fitgo.jpg',
  images: ['https://example.com/fitgo.jpg'],
  categoryId: 'cat-tech',
  category: 'Công nghệ',
  stock: 3,
  soldCount: 0,
  isActive: true,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  ...overrides,
});

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    window.localStorage.clear();
  });

  it('adds an in-stock product with quantity 1', () => {
    useCartStore.getState().addItem(makeProduct());

    expect(useCartStore.getState().items).toMatchObject([{ id: 'product-1', quantity: 1 }]);
    expect(useCartStore.getState().totalItems()).toBe(1);
    expect(useCartStore.getState().totalPrice()).toBe(120000);
  });

  it('does not add products that have no stock', () => {
    useCartStore.getState().addItem(makeProduct({ stock: 0 }));
    useCartStore.getState().addItem(makeProduct({ id: 'negative-stock', stock: -5 }));

    expect(useCartStore.getState().items).toEqual([]);
  });

  it('caps repeated add-to-cart actions at available stock', () => {
    const product = makeProduct({ stock: 2 });

    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem(product);

    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(useCartStore.getState().totalItems()).toBe(2);
  });

  it('clamps manual quantity updates and removes impossible quantities', () => {
    useCartStore.getState().addItem(makeProduct({ stock: 3 }));

    useCartStore.getState().updateQuantity('product-1', 99);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    useCartStore.getState().updateQuantity('product-1', 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    useCartStore.setState({ items: [{ ...makeProduct({ stock: 0 }), quantity: 1 }] });
    useCartStore.getState().updateQuantity('product-1', 1);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('restores cancelled or timed-out order items without exceeding stock', () => {
    useCartStore.getState().restoreItems([
      { ...makeProduct({ stock: 5 }), quantity: 2 },
      { ...makeProduct({ id: 'product-2', slug: 'second', stock: 1, price: 50000 }), quantity: 9 },
      { ...makeProduct({ id: 'out-of-stock', slug: 'out-of-stock', stock: 0 }), quantity: 1 },
    ]);

    expect(useCartStore.getState().items).toMatchObject([
      { id: 'product-1', quantity: 2 },
      { id: 'product-2', quantity: 1 },
    ]);
    expect(useCartStore.getState().totalItems()).toBe(3);
    expect(useCartStore.getState().totalPrice()).toBe(290000);
  });

  it('merges restored items with existing cart lines', () => {
    useCartStore.getState().addItem(makeProduct({ stock: 3 }));
    useCartStore.getState().restoreItems([{ ...makeProduct({ stock: 3 }), quantity: 2 }]);

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });
});
