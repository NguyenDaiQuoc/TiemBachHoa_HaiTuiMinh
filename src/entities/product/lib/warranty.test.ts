import { describe, expect, it } from 'vitest';
import { getWarrantyLabel, getWarrantyTag, isWarrantyTag, setWarrantyTag, WARRANTY_OPTIONS, WARRANTY_TAG_PREFIX } from './warranty';

describe('warranty helpers', () => {
  it('exposes the configured warranty options', () => {
    expect(WARRANTY_OPTIONS).toHaveLength(9);
    expect(WARRANTY_OPTIONS).toContain('12 tháng');
    expect(WARRANTY_OPTIONS).toContain('24 tháng');
  });

  it('creates and detects warranty tags', () => {
    const tag = getWarrantyTag('6 tháng');

    expect(tag).toBe(`${WARRANTY_TAG_PREFIX} 6 tháng`);
    expect(isWarrantyTag(tag)).toBe(true);
    expect(isWarrantyTag('khuyến mãi')).toBe(false);
  });

  it('extracts the warranty label from product tags', () => {
    expect(getWarrantyLabel(['new', getWarrantyTag('1 tháng')])).toBe('1 tháng');
    expect(getWarrantyLabel(['new', 'hot'])).toBeNull();
    expect(getWarrantyLabel(null)).toBeNull();
  });

  it('replaces existing warranty tags while preserving normal tags', () => {
    expect(setWarrantyTag(['new', getWarrantyTag('1 tháng'), 'hot'], '12 tháng')).toEqual([
      'new',
      'hot',
      getWarrantyTag('12 tháng'),
    ]);

    expect(setWarrantyTag(['new', getWarrantyTag('1 tháng')], null)).toEqual(['new']);
  });
});
