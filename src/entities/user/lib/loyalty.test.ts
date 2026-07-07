import { describe, expect, it } from 'vitest';
import { calculateLoyalty, estimateSavingsFromPoints, getTierSpendRange, pointsToSpend, TIERS } from './loyalty';

describe('loyalty helpers', () => {
  it('converts points to estimated spending and savings', () => {
    expect(pointsToSpend(0)).toBe(0);
    expect(pointsToSpend(12)).toBe(120000);
    expect(estimateSavingsFromPoints(100)).toBe(68000);
  });

  it('selects the correct tier at boundary values', () => {
    expect(calculateLoyalty(0).tierIndex).toBe(0);
    expect(calculateLoyalty(49).tierIndex).toBe(0);
    expect(calculateLoyalty(50).tierIndex).toBe(1);
    expect(calculateLoyalty(199).tierIndex).toBe(1);
    expect(calculateLoyalty(200).tierIndex).toBe(2);
    expect(calculateLoyalty(499).tierIndex).toBe(2);
    expect(calculateLoyalty(500).tierIndex).toBe(3);
  });

  it('calculates progress and points needed for the next tier', () => {
    expect(calculateLoyalty(25)).toMatchObject({
      progress: 50,
      pointsToNextTier: 25,
    });

    expect(calculateLoyalty(500)).toMatchObject({
      progress: 100,
      pointsToNextTier: 0,
      nextTier: null,
    });
  });

  it('formats spend ranges for bounded and top tiers', () => {
    expect(getTierSpendRange(TIERS[0])).toContain('0');
    expect(getTierSpendRange(TIERS[1])).toContain('-');
    expect(getTierSpendRange(TIERS[TIERS.length - 1])).not.toContain('-');
  });
});
