import { describe, expect, it } from 'vitest';
import { formatCurrencyVND, formatCompactCurrencyVND, cn } from './utils';

describe('formatCurrencyVND', () => {
  it('formats positive currency amounts correctly', () => {
    // vi-VN format uses non-breaking space (Unicode 160 or 8239 depending on environment)
    // we normalize or check regex / match parts for cross-environment compatibility
    const formatted = formatCurrencyVND(120000).replace(/\s/g, ' ');
    expect(formatted).toMatch(/120\.000\s*(₫|VND)/);
  });

  it('formats zero currency correctly', () => {
    const formatted = formatCurrencyVND(0).replace(/\s/g, ' ');
    expect(formatted).toMatch(/0\s*(₫|VND)/);
  });

  it('formats negative currency correctly', () => {
    const formatted = formatCurrencyVND(-50000).replace(/\s/g, ' ');
    expect(formatted).toMatch(/-50\.000\s*(₫|VND)/);
  });
});

describe('formatCompactCurrencyVND', () => {
  it('formats thousands correctly', () => {
    expect(formatCompactCurrencyVND(1000)).toBe('1 nghìn');
    expect(formatCompactCurrencyVND(50000)).toBe('50 nghìn');
    expect(formatCompactCurrencyVND(999000)).toBe('999 nghìn');
  });

  it('formats millions correctly', () => {
    expect(formatCompactCurrencyVND(1000000)).toBe('1.0 triệu');
    expect(formatCompactCurrencyVND(1500000)).toBe('1.5 triệu');
    expect(formatCompactCurrencyVND(120000000)).toBe('120.0 triệu');
  });

  it('formats billions correctly', () => {
    expect(formatCompactCurrencyVND(1000000000)).toBe('1.0 tỷ');
    expect(formatCompactCurrencyVND(2500000000)).toBe('2.5 tỷ');
  });

  it('falls back to normal format for less than 1000', () => {
    const formatted = formatCompactCurrencyVND(500).replace(/\s/g, ' ');
    expect(formatted).toMatch(/500\s*(₫|VND)/);
  });
});

describe('cn (classname merger)', () => {
  it('merges multiple class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional class names correctly', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    expect(cn('class1', true && 'class2', 'class3')).toBe('class1 class2 class3');
  });

  it('removes duplicate tailwind classes via tailwind-merge', () => {
    expect(cn('p-4 p-2')).toBe('p-2');
  });
});
