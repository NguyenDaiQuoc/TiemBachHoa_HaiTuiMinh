import React, { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface Voucher {
  id: string;
  name?: string;
  description?: string;
  discountType?: 'percentage'|'fixed';
  discountValue?: number;
  minPurchase?: number;
  startDate?: any;
  endDate?: any;
}

export default function VoucherPicker({ subtotal = 0, onSelect, onClose }: any) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const q = query(collection(db, 'promotions'));
        const snap = await getDocs(q);
        const data: Voucher[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        // Filter to active discount promotions that meet minPurchase and date range
        const now = new Date();
        const filtered = data.filter(p => {
          if (!p) return false;
          if ((p as any).type && (p as any).type !== 'discount') return false;
          if (!(p as any).active) return false;
          try {
            const s = p.startDate ? new Date((p.startDate as any).toDate ? (p.startDate as any).toDate() : p.startDate) : null;
            const e = p.endDate ? new Date((p.endDate as any).toDate ? (p.endDate as any).toDate() : p.endDate) : null;
            if (s && now < s) return false;
            if (e && now > e) return false;
          } catch (e) {}
          if (p.minPurchase && subtotal < (p.minPurchase as number)) return false;
          return true;
        });
        if (!mounted) return;
        setVouchers(filtered);
      } catch (err) {
        // friendly handling: don't surface internal Firestore assertion stack traces
        const eany = err as any;
        console.warn('voucher fetch error (read-only):', eany?.message || err);
        if (mounted) {
          setVouchers([]);
          // surface a friendly UI message when permission denied
          const emsg = (err as any)?.message || String(err || '');
          if (emsg.toLowerCase().includes('permission') || emsg.toLowerCase().includes('missing or insufficient')) {
            setError('Không thể tải voucher do quyền truy cập. Vui lòng kiểm tra quyền hoặc thử lại sau.');
          } else {
            setError('Không thể tải voucher hiện tại. Vui lòng thử lại sau.');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [subtotal]);

  const handleUse = (v: Voucher) => {
    if (onSelect) onSelect(v);
    if (onClose) onClose();
  };

  // compute content to avoid nested ternary JSX
  let voucherContent: React.ReactNode;
  if (loading) {
    voucherContent = <div>Đang tải voucher...</div>;
  } else if (error) {
    voucherContent = <div className="notice error">{error}</div>;
  } else if (!vouchers || vouchers.length === 0) {
    voucherContent = <div>Không có voucher phù hợp</div>;
  } else {
    voucherContent = vouchers.map(v => (
      <div key={v.id} style={{border:'1px solid #eee',padding:12,marginBottom:8,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontWeight:600}}>{v.name || v.id}</div>
          <div style={{fontSize:13,color:'#555'}}>{v.description}</div>
          <div style={{fontSize:12,color:'#666'}}>{v.discountType === 'percentage' ? `${v.discountValue}%` : `${(v.discountValue||0).toLocaleString()} VNĐ`}</div>
        </div>
        <div>
          <button className="btn-primary" onClick={() => handleUse(v)}>Lấy mã</button>
        </div>
      </div>
    ));
  }

  return (
    <div className="voucher-picker-overlay" onClick={() => onClose && onClose()}>
      <div className="voucher-picker" onClick={(e) => e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3>Chọn Voucher</h3>
          <button onClick={() => onClose && onClose()} className="btn-close">✕</button>
        </div>
        <div style={{marginTop:12}}>
          {voucherContent}
        </div>
      </div>
    </div>
  );
}
