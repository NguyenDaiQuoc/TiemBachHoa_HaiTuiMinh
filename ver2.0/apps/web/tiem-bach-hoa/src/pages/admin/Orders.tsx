import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/orders.css";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, addDoc, getDocs } from 'firebase/firestore';
import { adminDb as db, adminAuth as auth, adminStorage } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { showSuccess, showError } from '../../utils/toast';

// Format tiền tệ
const formatCurrency = (amount: any) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// --- Component Tóm Tắt Đơn Hàng (derived from orders) ---
function OrderMetrics({ orders }: { orders: any[] }) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const toDate = (o: any) => {
    if (!o) return null;
    const v = o.createdAt;
    if (!v) return null;
    try {
      if (v.seconds) return new Date(v.seconds * 1000);
      return new Date(v);
    } catch (e) {
      return null;
    }
  };

  const totalOrdersToday = orders.filter(o => {
    const d = toDate(o);
    return d && d >= todayStart && d <= todayEnd;
  }).length;

  const pendingOrders = orders.filter(o => (o.status || '').toString() === 'Chờ Xử Lý').length;
  const inTransit = orders.filter(o => (o.status || '').toString() === 'Đang Vận Chuyển').length;

  return (
    <div className="metrics-grid">
      <div className="metric-card primary">
        <p className="metric-title">Đơn Hàng Hôm Nay</p>
        <h3 className="metric-value">{totalOrdersToday}</h3>
      </div>
      <div className="metric-card urgent">
        <p className="metric-title">Đơn Chờ Xử Lý Gấp</p>
        <h3 className="metric-value">{pendingOrders}</h3>
      </div>
      <div className="metric-card processing">
        <p className="metric-title">Đơn Đang Vận Chuyển</p>
        <h3 className="metric-value">{inTransit}</h3>
      </div>
    </div>
  );
}

export default function AdminOrderPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');

  useEffect(() => {
    setLoading(true);
    let unsub: (() => void) | null = null;

    const startListener = () => {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(q, (snap) => {
        const docs: any[] = [];
        snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
        setOrders(docs);
        setLoading(false);
      }, (err) => {
        console.error('orders listener', err);
        setLoading(false);
      });
    };

    const off = onAuthStateChanged(auth, (user) => {
      if (user) {
        startListener();
      } else {
        setOrders([]);
        setLoading(false);
        if (unsub) { unsub(); unsub = null; }
      }
    });

    return () => {
      if (unsub) unsub();
      off();
    };
  }, []);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [stagedTracking, setStagedTracking] = useState<any[]>([]);
  const [gettingLocation, setGettingLocation] = useState<boolean>(false);
  const [selectedOrderEvents, setSelectedOrderEvents] = useState<any[]>([]);
  const [geocodedLocation, setGeocodedLocation] = useState<{lat:number,lng:number} | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  const openOrder = (o:any) => {
    setSelectedOrder(o);
    setEditStatus(o.status || '');
    setEditAddress(o.address || o.shippingAddress || o.deliveryAddress || '');
    setProofFiles([]);
    // fetch events for this order
    if (o && o.id) fetchOrderEvents(o.id);
  };

  const fetchOrderEvents = async (orderId: string) => {
    try {
      const evColl = collection(db, 'orders', orderId, 'trackingEvents');
      const q = query(evColl, orderBy('ts', 'asc'));
      const snap = await getDocs(q);
      const evs: any[] = [];
      snap.forEach(d => evs.push({ id: d.id, ...d.data() }));
      setSelectedOrderEvents(evs);
    } catch (err) {
      console.error('fetchOrderEvents', err);
      setSelectedOrderEvents([]);
    }
  };

  const geocodeAddress = async (address: string) => {
    if (!address) return null;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      // Note: public Nominatim blocks direct browser requests via CORS in many cases.
      // We'll try a fetch; if it fails due to CORS/403, provide a helpful fallback to open Google Maps or manual entry.
      let data: any = null;
      try {
        const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
        if (res.ok) {
          data = await res.json();
        } else {
          console.warn('geocode non-ok response', res.status);
        }
      } catch (fetchErr) {
        console.warn('geocode fetch failed (likely CORS)', fetchErr);
      }
      // If we couldn't get data from Nominatim, fallback to instructing admin to open Google Maps and paste coords
      if (!data) {
        showError('Không thể geocode tự động do hạn chế CORS/Forbidden. Mở Google Maps để lấy toạ độ (dán lại vào hộp thoại).');
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(mapsUrl, '_blank');
        const input = window.prompt('Nếu bạn đã mở Google Maps, hãy dán toạ độ (lat,lng) ở đây để lưu. Hoặc bỏ qua.', '');
        if (!input) return null;
        const parts = input.split(',').map(s=>s.trim());
        if (parts.length >= 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            showError('Toạ độ không hợp lệ');
            return null;
          }
          setGeocodedLocation({ lat, lng });
          return { lat, lng };
        }
        return null;
      }
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        setGeocodedLocation({ lat, lng });
        return { lat, lng };
      }
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        setGeocodedLocation({ lat, lng });
        return { lat, lng };
      }
      setGeocodedLocation(null);
      return null;
    } catch (err) {
      console.error('geocode error', err);
      setGeocodedLocation(null);
      showError('Không thể geocode tự động. Mở Google Maps để xem địa chỉ.');
      return null;
    }
  };

  const saveGeocodedToOrder = async () => {
    if (!selectedOrder || !geocodedLocation) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), { shippingLocation: geocodedLocation, updatedAt: new Date() } as any);
      showSuccess('Đã lưu toạ độ vào đơn hàng');
      // refresh events/selected order
      fetchOrderEvents(selectedOrder.id);
    } catch (err) {
      console.error('save geocode error', err);
      showError('Lưu toạ độ thất bại');
    }
  };

  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files || []);
    setProofFiles(files);
  };

  const addTrackingPoint = () => {
    if (!navigator.geolocation) {
      showError('Trình duyệt không hỗ trợ định vị.');
      return;
    }
    if (gettingLocation) return; // prevent duplicate clicks
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      try {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const newPoint = { lat, lng, status: 'Đã đến', note: '', ts: new Date(), imageFile: null };
        setStagedTracking(prev => [...prev, newPoint]);
        showSuccess('Đã thêm điểm dừng tạm thời (vị trí hiện tại).');
      } catch (e) {
        console.warn('addTrackingPoint inner error', e);
      } finally {
        setGettingLocation(false);
      }
    }, (err) => {
      console.warn('geolocation error', err);
      if (err && err.code === 1) {
        showError('Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép định vị trong trình duyệt để thêm điểm theo dõi.');
      } else if (err && err.code === 2) {
        showError('Không thể xác định vị trí thiết bị. Vui lòng kiểm tra kết nối GPS hoặc thử lại.');
      } else {
        showError('Không thể lấy vị trí thiết bị. Vui lòng thử lại sau.');
      }
      setGettingLocation(false);
    }, { timeout: 30000, maximumAge: 0, enableHighAccuracy: true });
  };

  const handleStagedImageChange = (index: number, file: File | null) => {
    setStagedTracking(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], imageFile: file };
      return copy;
    });
  };

  const updateStagedNote = (index: number, note: string) => {
    setStagedTracking(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], note };
      return copy;
    });
  };

  const saveStatusChange = async () => {
    if (!selectedOrder) return;
    const id = selectedOrder.id;
    // If setting to Delivered (Đã Giao Hàng) require proof
    if (editStatus === 'Đã Giao Hàng' && proofFiles.length === 0) {
      showError('Khi chuyển sang "Đã Giao Hàng" phải upload hình minh chứng');
      return;
    }

    try {
      setUploading(true);
      const updates: any = { status: editStatus };
      if (editAddress) updates.shippingAddress = editAddress;

      // Upload proofs if any (order-level proofs)
      if (proofFiles.length > 0) {
        const urls: string[] = [];
        for (const f of proofFiles) {
          const path = `orders/${id}/proofs/${Date.now()}_${f.name}`;
          const r = storageRef(adminStorage, path);
          const snap = await uploadBytes(r, f);
          const url = await getDownloadURL(snap.ref);
          urls.push(url);
        }
        updates.proofImages = arrayUnion(...urls as any);
      }

      // Apply order-level updates (status, shippingAddress, proofImages)
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'orders', id), { ...updates, updatedAt: new Date() } as any);
      }

      // Prepare array of tracking events to persist (stagedTracking + status change event)
      const trackingEventsToPush: any[] = [];

      // convert staged tracking (may include imageFile) and add as documents to subcollection
      for (const [i, s] of stagedTracking.entries()) {
        const evt: any = { ts: new Date(), status: s.status || 'Đã đến', note: s.note || '' };
        if (s.lat && s.lng) evt.location = { lat: s.lat, lng: s.lng };
        // upload event image if provided
        if (s.imageFile) {
          const f: File = s.imageFile;
          const path = `orders/${id}/tracking/${Date.now()}_${i}_${f.name}`;
          const r = storageRef(adminStorage, path);
          const snap = await uploadBytes(r, f);
          const url = await getDownloadURL(snap.ref);
          evt.image = url;
        }
        // add to subcollection
        await addDoc(collection(db, 'orders', id, 'trackingEvents'), evt);
      }

      // Also push a status-change event when saving (if editStatus set)
      if (editStatus) {
        const statusEvt: any = { ts: new Date(), status: editStatus, note: editStatus === 'Đang Vận Chuyển' ? 'Bắt đầu vận chuyển' : (editStatus === 'Đã Giao Hàng' ? 'Giao hàng thành công' : '') };
        await addDoc(collection(db, 'orders', id, 'trackingEvents'), statusEvt);
      }

      showSuccess('Cập nhật đơn hàng thành công');
      // Refresh will come from onSnapshot
      setStagedTracking([]);
      setProofFiles([]);
      setEditStatus('');
      setEditAddress('');
      setSelectedOrder(null);
    } catch (err) {
      console.error('saveStatusChange error', err);
      showError('Cập nhật đơn hàng thất bại');
    } finally {
      setUploading(false);
    }
  };

  const statusClass = {
    'Chờ Xử Lý': 'status-pending',
    'Đã Thanh Toán': 'status-paid',
    'Đã Giao Hàng': 'status-delivered',
    'Đã Hủy': 'status-cancelled',
  };

  // Compute a friendly order title (use provided title, or first product name)
  const orderTitle = selectedOrder ? (selectedOrder.title || selectedOrder.orderName || (Array.isArray(selectedOrder.items) && selectedOrder.items[0]?.name) || '') : '';

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <main className="content">
        <header className="content-header">
          <h1 className="content-title">Quản Lý Đơn Hàng</h1>
        </header>

  <OrderMetrics orders={orders} />

        <div className="toolbar">
          <input value={search} onChange={e=>setSearch(e.target.value)} type="text" placeholder="Tìm theo Mã Đơn Hàng, Tên Khách Hàng..." />
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="Tất cả">Lọc theo Trạng Thái</option>
            <option value="Chờ Xử Lý">Chờ Xử Lý</option>
            <option value="Đã Thanh Toán">Đã Thanh Toán</option>
            <option value="Đang Vận Chuyển">Đang Vận Chuyển</option>
            <option value="Đã Hủy">Đã Hủy</option>
          </select>
        </div>

        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Mã ĐH</th>
                <th>Khách Hàng</th>
                <th>Ngày Đặt</th>
                <th>Tổng Tiền</th>
                <th>TT Thanh Toán</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{textAlign:'center'}}>Đang tải đơn hàng...</td></tr>
              ) : (
                (() => {
                  const filtered = orders.filter(o => {
                    if (statusFilter && statusFilter !== 'Tất cả' && (o.status || '') !== statusFilter) return false;
                    if (!search) return true;
                    const q = search.trim().toLowerCase();
                    return String(o.id || '').toLowerCase().includes(q) || String(o.customerName || o.customer || '').toLowerCase().includes(q) || String(o.phone || '').includes(q);
                  });
                  const start = (currentPage - 1) * pageSize;
                  const pageItems = filtered.slice(start, start + pageSize);
                  return pageItems.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customerName || order.customer || order.userName || ''}</td>
                      <td>{order.createdAt ? new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleString() : ''}</td>
                      <td className="total">{formatCurrency(order.total || order.amount || 0)}</td>
                      <td>{order.paymentMethod || order.payment || '---'}</td>
                      <td><span className={`status ${(statusClass as any)[order.status || '']}`}>{order.status || 'Chờ Xử Lý'}</span></td>
                      <td className="actions">
                        <button className="edit-btn" onClick={()=>openOrder(order)}>Xem</button>
                      </td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          {(() => {
            const filtered = orders.filter(o => {
              if (statusFilter && statusFilter !== 'Tất cả' && (o.status || '') !== statusFilter) return false;
              if (!search) return true;
              const q = search.trim().toLowerCase();
              return String(o.id || '').toLowerCase().includes(q) || String(o.customerName || o.customer || '').toLowerCase().includes(q) || String(o.phone || '').includes(q);
            });
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const start = (currentPage - 1) * pageSize + 1;
            const end = Math.min(currentPage * pageSize, total);
            return (
              <>
                <span>Hiển thị {start} - {end} trong tổng số {total} đơn hàng</span>
                <div className="pages">
                  <button onClick={()=>setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage===1}>Trước</button>
                  {Array.from({length: totalPages}, (_,i)=>i+1).map(p=> (
                    <button key={p} onClick={()=>setCurrentPage(p)} className={p===currentPage?'current':''}>{p}</button>
                  ))}
                  <button onClick={()=>setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages}>Sau</button>
                </div>
              </>
            )
          })()}
        </div>
        </main>
        {selectedOrder ? (
          <div className="modal-overlay" onClick={()=>setSelectedOrder(null)}>
            <div className="modal-card" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div style={{display:'flex',alignItems:'center',gap:12, flexDirection: 'column', alignItems: 'flex-start'}}>
                  <div style={{display:'flex', gap:12, alignItems:'center'}}>
                    <div className="order-id">Đơn {selectedOrder.id}</div>
                    <div className="order-customer" style={{color:'#374151'}}>{selectedOrder.customerName || selectedOrder.customer || ''}</div>
                  </div>
                  {orderTitle ? <div style={{fontSize:13, color:'#6b7280', marginTop:4}}>Tên đơn: {orderTitle}</div> : null}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="status-badge">{selectedOrder.status || 'Chờ Xử Lý'}</div>
                  <button aria-label="close" className="btn-secondary" onClick={()=>setSelectedOrder(null)}>✕</button>
                </div>
              </div>
              <div className="modal-grid">
                <div className="modal-column">
                  <div><strong>Khách:</strong> {selectedOrder.customerName || selectedOrder.customer}</div>
                  <div><strong>Tổng:</strong> {formatCurrency(selectedOrder.total || selectedOrder.amount || 0)}</div>
                  <div className="modal-field"><label>Số điện thoại</label><div>{selectedOrder.phone || selectedOrder.mobile || '---'}</div></div>

                  <div className="modal-field">
                    <label>Địa chỉ giao hàng</label>
                    <div className="address-box">
                      <div style={{flex:1}}>
                        <div className="address-text">{selectedOrder.address || selectedOrder.shippingAddress || selectedOrder.deliveryAddress || '---'}</div>
                        <div style={{marginTop:8}}>
                          <button className="btn-secondary" onClick={async()=>{ await geocodeAddress(selectedOrder.address || selectedOrder.shippingAddress || selectedOrder.deliveryAddress || ''); }}>Geocode</button>
                          {geocodedLocation ? <span style={{marginLeft:10}}>Toạ độ: {geocodedLocation.lat.toFixed(6)}, {geocodedLocation.lng.toFixed(6)}</span> : null}
                        </div>
                      </div>
                      <div className="address-actions">
                        <a target="_blank" rel="noreferrer" className="link-map" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.address || selectedOrder.shippingAddress || selectedOrder.deliveryAddress || '')}`}>Mở Maps</a>
                        {geocodedLocation ? <button className="btn-primary" style={{marginLeft:8}} onClick={saveGeocodedToOrder}>Lưu tọa độ</button> : null}
                      </div>
                    </div>
                  </div>

                  <div className="modal-field"><label>Phương thức thanh toán</label><div>{selectedOrder.paymentMethod || selectedOrder.payment || '---'}</div></div>

                  <div className="modal-field"><label>Trạng thái hiện tại</label><div><span className={`status ${(statusClass as any)[selectedOrder.status || '']}`}>{selectedOrder.status || 'Chờ Xử Lý'}</span></div></div>

                  <div className="modal-field">
                    <label>Thay đổi trạng thái</label>
                    <select value={editStatus} onChange={e=>setEditStatus(e.target.value)}>
                      <option value="">-- Chọn trạng thái --</option>
                      <option value="Chờ Xử Lý">Chờ Xử Lý</option>
                      <option value="Đã Thanh Toán">Đã Thanh Toán</option>
                      <option value="Đang Vận Chuyển">Đang Vận Chuyển</option>
                      <option value="Đã Giao Hàng">Đã Giao Hàng</option>
                      <option value="Đã Hủy">Đã Hủy</option>
                    </select>
                  </div>

                  <div className="modal-field">
                    <label>Upload hình minh chứng (order-level)</label>
                    <input type="file" multiple onChange={handleFileChange} />
                    {proofFiles.length > 0 && <div>{proofFiles.length} file(s) chuẩn bị upload</div>}
                  </div>

                  <div className="modal-field">
                    <label>Chi tiết sản phẩm</label>
                    <div>
                      {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                        <ul>
                          {selectedOrder.items.map((it:any, idx:number) => (
                            <li key={idx}>{it.name || it.title || it.productName} — SL: {it.quantity || it.qty || 1} — {formatCurrency(it.price || it.unitPrice || it.priceApplied || 0)}</li>
                          ))}
                        </ul>
                      ) : (<div>Không có thông tin sản phẩm chi tiết</div>)}
                    </div>
                  </div>
                </div>

                <div className="modal-column">
                  <div>
                    <label>Proof Images</label>
                    <div className="proof-gallery">
                      {Array.isArray(selectedOrder.proofImages) && selectedOrder.proofImages.length > 0 ? (
                        selectedOrder.proofImages.map((u:string, i:number) => (
                          <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} style={{width:120,height:90,objectFit:'cover'}} alt={`proof-${i}`} /></a>
                        ))
                      ) : (<div>Chưa có hình minh chứng</div>)}
                    </div>
                  </div>

                  <div style={{marginTop:12}}>
                    <label>Tracking events</label>
                    <div style={{marginTop:8}}>
                      <button className="btn-add" disabled={gettingLocation} onClick={addTrackingPoint}>{gettingLocation ? 'Đang lấy vị trí...' : 'Thêm điểm đến (vị trí hiện tại)'} </button>
                    </div>

                    {stagedTracking.length > 0 && (
                      <div className="staged-list">
                        <h4>Điểm tạm (chưa lưu)</h4>
                        {stagedTracking.map((s:any, idx:number) => (
                          <div key={idx} className="staged-item">
                            <div style={{flex:1}}>
                              <div className="coords"><strong>Vị trí:</strong> {s.lat.toFixed(6)}, {s.lng.toFixed(6)}</div>
                              <div className="note"><input placeholder="Ghi chú" value={s.note} onChange={e=>updateStagedNote(idx, e.target.value)} style={{width:'100%', padding:6}} /></div>
                              <div style={{marginTop:6}}><input type="file" onChange={e=>handleStagedImageChange(idx, e.target.files && e.target.files[0] ? e.target.files[0] : null)} /></div>
                              <div style={{marginTop:6}}><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.lat + ',' + s.lng)}`}>Xem Maps</a></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{marginTop:12}}>
                      <h4>Sự kiện đã lưu</h4>
                      {selectedOrderEvents && selectedOrderEvents.length > 0 ? (
                        <ol>
                          {selectedOrderEvents.map((t:any, idx:number) => (
                            <li key={t.id || idx} style={{marginBottom:6}}>
                              {t.ts ? (t.ts.seconds ? new Date(t.ts.seconds*1000).toLocaleString() : new Date(t.ts).toLocaleString()) : ''} — {t.status} — {t.note || ''}
                              {t.location ? (<div className="coords">Vị trí: {t.location.lat.toFixed(6)}, {t.location.lng.toFixed(6)} (<a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.location.lat + ',' + t.location.lng)}`}>Maps</a>)</div>) : null}
                              {t.image ? (<div style={{marginTop:6}}><a target="_blank" rel="noreferrer" href={t.image}><img src={t.image} style={{width:120,height:90,objectFit:'cover'}} alt="evt"/></a></div>) : null}
                            </li>
                          ))}
                        </ol>
                      ) : (<div>Chưa có sự kiện theo dõi</div>)}
                    </div>
                  </div>
                </div>
              </div>
              </div>
              <div style={{marginTop:12, display:'flex', gap:8}}>
                <button onClick={saveStatusChange} disabled={uploading || !editStatus}>{uploading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                <button onClick={()=>setSelectedOrder(null)}>Hủy / Đóng</button>
              </div>
            </div>
        ) : null}
      </div>
    </div>
  );
}

