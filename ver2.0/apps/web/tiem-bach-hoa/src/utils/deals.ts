import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface Deal {
  id?: string;
  name: string;
  startAt?: any;
  endAt?: any;
  target?: string; // 'Tất cả sản phẩm' or 'product:<id>' or category slug
  discountType?: 'percent' | 'fixed';
  discount?: number; // percent or fixed amount
  status?: string;
  sales?: number;
}

/**
 * Fetch active deals (status === 'Đang Hoạt Động') once.
 */
export async function fetchActiveDeals(): Promise<Deal[]> {
  try {
    const dealsRef = collection(db, 'deals');
    const q = query(dealsRef, where('status', '==', 'Đang Hoạt Động'));
    const snap = await getDocs(q);
    const arr: Deal[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    return arr;
  } catch (err) {
    // Permission errors are expected if 'deals' collection is not exposed in rules.
    // Return empty deals silently and log a warning to avoid noisy errors in console.
    const e: any = err;
    if (e && (e.code === 'permission-denied' || (e.message && typeof e.message === 'string' && e.message.toLowerCase().includes('permission')))) {
      console.warn('fetchActiveDeals: permission denied or collection not available. Returning no deals.');
      return [];
    }
    console.error('fetchActiveDeals', err);
    return [];
  }
}

/**
 * Apply deals to a price for a given product identifier.
 * For now supports target === 'Tất cả sản phẩm' and 'product:<id>'.
 */
export function applyDealsToPrice(basePrice: number, productId: string, deals: Deal[]|null): { price: number, applied?: Deal | null } {
  if (!deals || deals.length === 0) return { price: basePrice, applied: null };

  // Prefer the best discount (largest reduction)
  let best = { price: basePrice, applied: null as Deal | null };

  for (const d of deals) {
    if (!d || !d.discount) continue;
    const target = (d.target || '').toString();
    let applies = false;
    if (!target || target === 'Tất cả sản phẩm') applies = true;
    if (target.startsWith('product:')) {
      const tid = target.split(':')[1];
      if (tid === productId) applies = true;
    }

    if (!applies) continue;

    let newPrice = basePrice;
    if (d.discountType === 'fixed') {
      newPrice = Math.max(0, basePrice - (d.discount || 0));
    } else {
      // percent
      newPrice = Math.max(0, Math.round(basePrice * (1 - (d.discount || 0) / 100)));
    }

    if (newPrice < best.price) {
      best = { price: newPrice, applied: d };
    }
  }

  return best;
}
