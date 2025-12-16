import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminSidebar from '../../components/admin/Sidebar';
import '../../../css/admin/inventory.css';
import { showSuccess, showError } from '../../utils/toast';
import ImageLightbox from '../../components/ImageLightbox';

type WarehouseItem = {
  id: string;
  productId?: string;
  productName?: string;
  image?: string;
  stock?: number;
  lastPurchasePrice?: number;
  lastUpdated?: any;
  location?: string;
  [key: string]: any;
};

export default function WarehousePage(): JSX.Element {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxStart, setLightboxStart] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [filterLowStock, setFilterLowStock] = useState<boolean>(false);

  useEffect(() => {
    loadWarehouse();
  }, []);

  const loadWarehouse = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'warehouse'));
      const list: WarehouseItem[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(list);
    } catch (err: any) {
      console.error('Load warehouse failed', err);
      showError('Không thể tải dữ liệu kho hàng');
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(it => {
    const q = search.trim().toLowerCase();
    if (q) {
      const inName = String(it.productName || '').toLowerCase().includes(q);
      const inId = String(it.productId || it.id || '').toLowerCase().includes(q);
      return inName || inId;
    }
    if (filterLowStock) {
      return (Number(it.stock || 0) <= 5);
    }
    return true;
  });

  // safe export base name: TonKhoHaiTuiMinh(DD-MM-YYYY)
  const getExportBaseName = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `TonKhoHaiTuiMinh(${dd}-${mm}-${yyyy})`;
  };

  function toCSV(rows: any[], headers: string[]) {
    const esc = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const lines = [headers.join(',')];
    for (const r of rows) {
      const row = headers.map(h => esc(r[h] ?? ''));
      lines.push(row.join(','));
    }
    return lines.join('\n');
  }

  const exportCSV = (filename?: string) => {
    try {
      const headers = ['productId', 'productName', 'stock', 'lastPurchasePrice', 'location', 'lastUpdated'];
      const rows = filtered.map(i => ({
        productId: i.productId || i.id,
        productName: i.productName || '',
        stock: i.stock ?? 0,
        lastPurchasePrice: i.lastPurchasePrice ?? '',
        location: i.location ?? '',
        lastUpdated: i.lastUpdated && i.lastUpdated.toDate ? i.lastUpdated.toDate().toLocaleString() : (i.lastUpdated || ''),
      }));
      const csv = toCSV(rows, headers);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = getExportBaseName();
      a.download = (filename && filename.trim()) ? filename : `${base}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Đã xuất file CSV');
    } catch (err:any) {
      console.error('Export CSV failed', err);
      showError('Không thể xuất CSV');
    }
  };

  const exportExcel = (filename?: string) => {
    // Simple Excel export via CSV (widely compatible)
    // Note: for a true .xlsx file, a library like SheetJS is required. This saves CSV with .xlsx extension.
    try {
      const headers = ['productId', 'productName', 'stock', 'lastPurchasePrice', 'location', 'lastUpdated'];
      const rows = filtered.map(i => ({
        productId: i.productId || i.id,
        productName: i.productName || '',
        stock: i.stock ?? 0,
        lastPurchasePrice: i.lastPurchasePrice ?? '',
        location: i.location ?? '',
        lastUpdated: i.lastUpdated && i.lastUpdated.toDate ? i.lastUpdated.toDate().toLocaleString() : (i.lastUpdated || ''),
      }));
      const csv = toCSV(rows, headers);
      const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const base = getExportBaseName();
  a.download = (filename && filename.trim()) ? filename : `${base}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Đã xuất file Excel (CSV)');
    } catch (err:any) {
      console.error('Export Excel failed', err);
      showError('Không thể xuất Excel');
    }
  };

  const exportPDF = (filename?: string) => {
    try {
      // Open a new window and build DOM programmatically to avoid large template literals
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) return showError('Trình duyệt chặn pop-up, cho phép để in PDF');

      const doc = win.document;
      doc.open();
      // basic styles
      const styleEl = doc.createElement('style');
      styleEl.textContent = `table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#f4f4f4}`;
      doc.head.appendChild(styleEl);

      const title = doc.createElement('h2');
      title.textContent = 'Warehouse Export';
      doc.body.appendChild(title);

      const table = doc.createElement('table');
      const thead = doc.createElement('thead');
      thead.innerHTML = '<tr><th>Product ID</th><th>Name</th><th>Stock</th><th>Last Purchase</th><th>Location</th><th>Last Updated</th></tr>';
      table.appendChild(thead);
      const tbody = doc.createElement('tbody');

      for (const i of filtered) {
        const tr = doc.createElement('tr');
        const pid = doc.createElement('td'); pid.textContent = String(i.productId || i.id || ''); tr.appendChild(pid);
        const name = doc.createElement('td'); name.textContent = String(i.productName || ''); tr.appendChild(name);
        const stock = doc.createElement('td'); stock.textContent = String(i.stock ?? 0); tr.appendChild(stock);
        const lp = doc.createElement('td'); lp.textContent = String(i.lastPurchasePrice ?? ''); tr.appendChild(lp);
        const loc = doc.createElement('td'); loc.textContent = String(i.location ?? ''); tr.appendChild(loc);
        const lu = doc.createElement('td'); lu.textContent = i.lastUpdated && i.lastUpdated.toDate ? i.lastUpdated.toDate().toLocaleString() : String(i.lastUpdated || ''); tr.appendChild(lu);
        tbody.appendChild(tr);
      }

      table.appendChild(tbody);
      doc.body.appendChild(table);
      doc.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
      // set document title so some browsers/previews suggest a filename
      try { doc.title = getExportBaseName(); } catch (e) { /* ignore */ }
      showSuccess('Mở cửa sổ in. Chọn "Save as PDF" để lưu.');
    } catch (err:any) {
      console.error('Export PDF failed', err);
      showError('Không thể xuất PDF');
    }
  };

  return (
    <div className="po-wrapper admin-page admin-inventory-page">
      <AdminSidebar />
      <main className="po-content admin-main">
        <header className="po-header admin-header">
          <h1 className="title">Kho Hàng</h1>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" onClick={loadWarehouse} disabled={loading}>{loading ? 'Đang tải...' : 'Tải lại'}</button>
            <button className="btn" onClick={()=>exportCSV()}>Xuất CSV</button>
            <button className="btn" onClick={()=>exportExcel()}>Xuất Excel</button>
            <button className="btn" onClick={()=>exportPDF()}>Xuất PDF</button>
          </div>
        </header>

        <div className="po-toolbar" style={{alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo mã hoặc tên" className="input-search" />
          <label style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={filterLowStock} onChange={e=>setFilterLowStock(e.target.checked)} />
            <span>Chỉ cảnh báo tồn kho dưới 5</span>
          </label>
          <div style={{marginLeft:'auto', color:'#666'}}>{filtered.length} mục</div>
        </div>

        <div className="po-table-wrapper inventory-list" style={{marginTop:12}}>
          <table className="po-table inv-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Tên sản phẩm</th>
                <th>Số lượng</th>
                <th>Giá mua gần nhất</th>
                <th>Vị trí</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id}>
                  <td>{it.productId || it.id}</td>
                  <td style={{display:'flex',gap:8,alignItems:'center'}}>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      {( (it.images && Array.isArray(it.images) && it.images.length > 0) ? it.images : (it.image ? [it.image] : []) ).slice(0,3).map((u:string, i:number) => (
                        <img key={i} src={u} alt={`${it.productName}-${i}`} style={{width:48,height:48,objectFit:'cover',borderRadius:6,cursor:'pointer'}} onClick={()=>{ setLightboxImages((it.images && Array.isArray(it.images) && it.images.length>0)? it.images : (it.image ? [it.image] : [])); setLightboxStart(i); setLightboxOpen(true); }} />
                      ))}
                    </div>
                    <div>
                      <div style={{fontWeight:600}}>{it.productName}</div>
                    </div>
                  </td>
                  <td>{it.stock ?? 0}</td>
                  <td>{it.lastPurchasePrice ? Number(it.lastPurchasePrice).toLocaleString('vi-VN') + ' ₫' : ''}</td>
                  <td>{it.location || ''}</td>
                  <td>{it.lastUpdated && it.lastUpdated.toDate ? it.lastUpdated.toDate().toLocaleString() : (it.lastUpdated || '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lightboxOpen && (
          <ImageLightbox images={lightboxImages} startIndex={lightboxStart} onClose={() => setLightboxOpen(false)} />
        )}

      </main>
    </div>
  );
}
