import { describe, expect, it } from 'vitest';
import { getProductUrl, getProductUrlKey } from './product-url';

describe('product url helpers', () => {
  it('prefers slug over id for PDP URLs', () => {
    expect(getProductUrlKey({ id: 'p-1', slug: 'tai-nghe-bluetooth-fitgo' })).toBe('tai-nghe-bluetooth-fitgo');
    expect(getProductUrl({ id: 'p-1', slug: 'tai-nghe-bluetooth-fitgo' })).toBe('/product/tai-nghe-bluetooth-fitgo');
  });

  it('falls back to encoded id when slug is missing', () => {
    expect(getProductUrlKey({ id: 'id with spaces', slug: '' })).toBe('id%20with%20spaces');
    expect(getProductUrl({ id: 'id with spaces', slug: '' })).toBe('/product/id%20with%20spaces');
  });
});
