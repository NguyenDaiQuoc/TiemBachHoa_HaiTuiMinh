import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateOrderId, generateTransferContent } from './order-utils';

describe('order utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-06T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates an 8-character uppercase alphanumeric order id', () => {
    const orderId = generateOrderId();

    expect(orderId).toHaveLength(8);
    expect(orderId).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('generates deterministic bank transfer content with compact customer name and date', () => {
    expect(generateTransferContent('HTM123', 'Nguyen Dai Quoc')).toBe('HTM123-NGUYENDAIQUOC-06062026');
  });
});
