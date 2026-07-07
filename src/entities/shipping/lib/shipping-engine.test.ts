import { describe, expect, it, vi } from 'vitest';
import { ShippingMethodId, ShippingProvider, ShippingStatus } from '../model/types';
import { calculateShippingPrice, estimateArrival, ShippingAggregator, SHIPPING_METHODS } from './shipping-engine';

describe('shipping engine', () => {
  it('defines the expected storefront shipping methods', () => {
    expect(SHIPPING_METHODS.map((method) => method.id)).toEqual([
      ShippingMethodId.STANDARD,
      ShippingMethodId.FAST,
      ShippingMethodId.EXPRESS,
    ]);
  });

  it('calculates base price and weight surcharge', () => {
    expect(calculateShippingPrice(ShippingMethodId.STANDARD, 0.5)).toBe(20000);
    expect(calculateShippingPrice(ShippingMethodId.STANDARD, 1)).toBe(20000);
    expect(calculateShippingPrice(ShippingMethodId.STANDARD, 3)).toBe(30000);
    expect(calculateShippingPrice('UNKNOWN' as ShippingMethodId, 3)).toBe(0);
  });

  it('estimates arrival using the method max-day window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));

    expect(new Date(estimateArrival(ShippingMethodId.EXPRESS)).toISOString()).toBe('2026-06-03T00:00:00.000Z');
    expect(new Date(estimateArrival('UNKNOWN' as ShippingMethodId)).toISOString()).toBe('2026-06-08T00:00:00.000Z');

    vi.useRealTimers();
  });

  it('returns normalized tracking data from the aggregator', async () => {
    const tracking = await ShippingAggregator.getTracking('GHN-123456', ShippingProvider.GHN);

    expect(tracking).toMatchObject({
      trackingId: 'GHN-123456',
      provider: ShippingProvider.GHN,
      status: ShippingStatus.OUT_FOR_DELIVERY,
      progress: 0.92,
    });
    expect(tracking.events.length).toBeGreaterThanOrEqual(4);
    expect(tracking.currentLocation).toEqual(tracking.events[tracking.events.length - 1].location);
  });
});
