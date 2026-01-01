import React, { useEffect, useState } from "react";
import trackingClient from '../../utils/trackingClient';
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/orders.css";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
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
  const [isSharing, setIsSharing] = useState<boolean>(false);
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
  const [showManualCoords, setShowManualCoords] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  // removed manual coordinate input states — prefer automatic geolocation/proxy
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
      // Prefer server-side OpenCage proxy to avoid CORS and hide API key
      try {
        const proxyUrl = `/api/geocode-opencage.php?address=${encodeURIComponent(address)}`;
        const pr = await fetch(proxyUrl);
        // Try to parse JSON even when content-type is not ideal (some hosts return text/javascript)
        if (pr.ok) {
          try {
            const jd = await pr.json();
            if (jd && jd.lat && jd.lng) {
              setGeocodedLocation({ lat: jd.lat, lng: jd.lng });
              return { lat: jd.lat, lng: jd.lng };
            }
          } catch (parseErr) {
            // try as text then parse
            try {
              const txt = await pr.text();
              const maybe = JSON.parse(txt);
              if (maybe && maybe.lat && maybe.lng) {
                setGeocodedLocation({ lat: maybe.lat, lng: maybe.lng });
                return { lat: maybe.lat, lng: maybe.lng };
              }
            } catch (tErr) {
              console.warn('opencage proxy returned non-json body', tErr);
            }
          }
        } else {
          const ctype = pr.headers.get('content-type') || '';
          console.warn('opencage proxy non-ok or non-json', pr.status, ctype);
          // Try PHP fallback (some hosts serve serverless JS as static; try PHP proxy)
          try {
            const phpUrl = `/api/geocode-opencage.php?address=${encodeURIComponent(address)}`;
            const pr2 = await fetch(phpUrl);
            const ctype2 = pr2.headers.get('content-type') || '';
            if (pr2.ok && ctype2.includes('application/json')) {
              const jd2 = await pr2.json();
              if (jd2 && jd2.lat && jd2.lng) {
                setGeocodedLocation({ lat: jd2.lat, lng: jd2.lng });
                return { lat: jd2.lat, lng: jd2.lng };
              }
            } else {
              console.warn('php proxy non-ok or non-json', pr2.status, ctype2);
            }
          } catch (e2) {
            console.warn('php proxy attempt failed', e2);
          }
        }
      } catch (e) {
        console.warn('opencage proxy failed', e);
      }
      // If all proxies failed, inform admin — no manual coordinate input required
      showError('Không thể geocode tự động (proxy trả về non-JSON hoặc bị chặn).');
      return null;
    } catch (err) {
      console.error('geocode error', err);
      setGeocodedLocation(null);
      showError('Không thể geocode tự động. Vui lòng kiểm tra proxy trên hosting.');
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
    // cast to File[] for TypeScript
    setProofFiles(files as File[]);
  };

  const addTrackingPoint = () => {
    if (!navigator.geolocation) {
      showError('Trình duyệt không hỗ trợ định vị.');
      return;
    }
    if (gettingLocation) return; // prevent duplicate clicks
    setGettingLocation(true);

    const addNoCoordPoint = (reasonMsg?: string) => {
      // Instead of auto-adding a no-coord point, ask admin to enter coordinates manually
      setShowManualCoords(true);
      setManualLat('');
      setManualLng('');
      showError((reasonMsg ? reasonMsg + ' — ' : '') + 'Không thể lấy vị trí. Vui lòng nhập toạ độ thủ công hoặc chọn "Thêm không toạ độ".');
      setGettingLocation(false);
    };

    const getPos = (opts: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, opts);
    });

    (async () => {
      try {
        // Check permissions if available to give clearer guidance
        try {
          if ((navigator as any).permissions && (navigator as any).permissions.query) {
            const p = await (navigator as any).permissions.query({ name: 'geolocation' });
            if (p.state === 'denied') {
              addNoCoordPoint('Quyền truy cập vị trí bị từ chối');
              return;
            }
          }
        } catch (permErr) {
          // ignore permission query errors
        }

        // Try quick coarse position first
        try {
          const pos = await getPos({ timeout: 10000, maximumAge: 0, enableHighAccuracy: false });
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const hasTransportStarted = (selectedOrderEvents || []).some(ev => (ev.status || '').toString().toLowerCase().includes('vận') || (ev.status || '').toString().toLowerCase().includes('giao'));
          const status = (stagedTracking.length === 0 && !hasTransportStarted) ? 'Đang Vận Chuyển' : 'Đã đến';
          const newPoint = { lat, lng, status, note: '', ts: new Date(), imageFile: null };
          setStagedTracking(prev => [...prev, newPoint]);
          showSuccess('Đã thêm điểm dừng tạm thời (vị trí hiện tại).');
          setGettingLocation(false);
          return;
        } catch (coarseErr) {
          // continue to try high-accuracy
        }

        // Try high-accuracy (may take longer)
        try {
          const pos = await getPos({ timeout: 30000, maximumAge: 0, enableHighAccuracy: true });
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const hasTransportStarted = (selectedOrderEvents || []).some(ev => (ev.status || '').toString().toLowerCase().includes('vận') || (ev.status || '').toString().toLowerCase().includes('giao'));
          const status = (stagedTracking.length === 0 && !hasTransportStarted) ? 'Đang Vận Chuyển' : 'Đã đến';
          const newPoint = { lat, lng, status, note: '', ts: new Date(), imageFile: null };
          setStagedTracking(prev => [...prev, newPoint]);
          showSuccess('Đã thêm điểm dừng tạm thời (vị trí hiện tại).');
          setGettingLocation(false);
          return;
        } catch (highErr: any) {
          console.warn('geolocation error', highErr);
          const msg = (highErr && highErr.code === 1) ? 'Bạn đã từ chối quyền truy cập vị trí' : (highErr && highErr.code === 2) ? 'Không thể xác định vị trí thiết bị' : 'Không thể lấy vị trí thiết bị';
          // Try IP-based approximate fallback (ipapi.co) for local/dev environments
          try {
            // First try geocoding the order's shipping address (more accurate than IP)
            try {
              const addr = (selectedOrder && (selectedOrder.address || selectedOrder.shippingAddress || selectedOrder.deliveryAddress)) || '';
              if (addr) {
                const g = await geocodeAddress(addr);
                if (g && g.lat && g.lng) {
                  const hasTransportStarted = (selectedOrderEvents || []).some(ev => (ev.status || '').toString().toLowerCase().includes('vận') || (ev.status || '').toString().toLowerCase().includes('giao'));
                  const status = (stagedTracking.length === 0 && !hasTransportStarted) ? 'Đang Vận Chuyển' : 'Đã đến';
                  const newPoint = { lat: g.lat, lng: g.lng, status, note: 'Vị trí xấp xỉ (từ địa chỉ giao hàng)', ts: new Date(), imageFile: null };
                  setStagedTracking(prev => [...prev, newPoint]);
                  showSuccess('Đã thêm điểm tạm với toạ độ được geocode từ địa chỉ giao hàng.');
                  setGettingLocation(false);
                  return;
                }
              }
            } catch (geErr) {
              console.warn('geocodeAddress fallback failed', geErr);
            }
            // Primary IP fallback: try ipapi.co, but handle rate limits (429) gracefully
            try {
              const r = await fetch('https://ipapi.co/json/');
              if (r.ok) {
                try {
                  const jd: any = await r.json();
                  const la = parseFloat(jd.latitude || jd.lat || jd.latitude);
                  const ln = parseFloat(jd.longitude || jd.lon || jd.longitude);
                  if (Number.isFinite(la) && Number.isFinite(ln)) {
                    const hasTransportStarted = (selectedOrderEvents || []).some(ev => (ev.status || '').toString().toLowerCase().includes('vận') || (ev.status || '').toString().toLowerCase().includes('giao'));
                    const status = (stagedTracking.length === 0 && !hasTransportStarted) ? 'Đang Vận Chuyển' : 'Đã đến';
                    const newPoint = { lat: la, lng: ln, status, note: 'Vị trí xấp xỉ (từ IP)', ts: new Date(), imageFile: null };
                    setStagedTracking(prev => [...prev, newPoint]);
                    showSuccess('Đã thêm điểm tạm với toạ độ xấp xỉ theo IP.');
                    setGettingLocation(false);
                    return;
                  } else {
                    console.warn('ipapi returned but no coords', jd);
                  }
                } catch (pj) {
                  console.warn('ipapi parse failed', pj);
                }
              } else {
                // 429 or other statuses — log and continue to secondary fallbacks
                console.warn('ipapi response not ok', r.status, r.statusText);
              }
            } catch (ipErr) {
              console.warn('ipapi fetch failed', ipErr);
            }

            // Try ipwho.is as a solid secondary fallback
            try {
              const r2 = await fetch('https://ipwho.is/');
              if (r2.ok) {
                try {
                  const jd2: any = await r2.json();
                  const la2 = parseFloat(jd2.latitude || jd2.lat || jd2.latitude);
                  const ln2 = parseFloat(jd2.longitude || jd2.lon || jd2.longitude);
                  if (Number.isFinite(la2) && Number.isFinite(ln2)) {
                    const hasTransportStarted = (selectedOrderEvents || []).some(ev => (ev.status || '').toString().toLowerCase().includes('vận') || (ev.status || '').toString().toLowerCase().includes('giao'));
                    const status = (stagedTracking.length === 0 && !hasTransportStarted) ? 'Đang Vận Chuyển' : 'Đã đến';
                    const newPoint = { lat: la2, lng: ln2, status, note: 'Vị trí xấp xỉ (từ IP)', ts: new Date(), imageFile: null };
                    setStagedTracking(prev => [...prev, newPoint]);
                    showSuccess('Đã thêm điểm tạm với toạ độ xấp xỉ theo IP (ipwho.is).');
                    setGettingLocation(false);
                    return;
                  } else {
                    console.warn('ipwho returned but no coords', jd2);
                  }
                } catch (pj2) {
                  console.warn('ipwho parse failed', pj2);
                }
              } else {
                console.warn('ipwho response not ok', r2.status, r2.statusText);
              }
            } catch (ip2Err) {
              console.warn('ipwho fetch failed', ip2Err);
            }
          } catch (ipErr) {
            console.warn('IP geolocation fallback failed', ipErr);
          }
          // If IP fallback fails, show manual entry (with helpful note for localhost)
          if (window && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            addNoCoordPoint(msg + ' — Kiểm tra: bật quyền vị trí cho localhost trong trình duyệt.');
          } else {
            addNoCoordPoint(msg);
          }
          return;
        }
      } catch (e) {
        console.warn('tryGeolocate unexpected error', e);
        addNoCoordPoint('Lỗi khi cố gắng định vị');
      }
    })();
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

      // Also push a status-change event when saving, but only if the
      // selected editStatus is different from the current order status
      // and we don't already have a staged tracking event with the same status.
      if (editStatus && editStatus !== (selectedOrder.status || '')) {
        const stagedHasSame = stagedTracking.some((s: any) => (s.status || '').toString() === editStatus);
        if (!stagedHasSame) {
          const statusEvt: any = {
            ts: new Date(),
            status: editStatus,
            note: editStatus === 'Đang Vận Chuyển' ? 'Bắt đầu vận chuyển' : (editStatus === 'Đã Giao Hàng' ? 'Giao hàng thành công' : '')
          };
          await addDoc(collection(db, 'orders', id, 'trackingEvents'), statusEvt);
        }
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

  // Heuristic matching for manual reconciliation (Level 1)
  const computeMatchStatus = (o: any) => {
    if (!o) return { level: 'unknown', text: 'Không có dữ liệu' };
    const hasProof = Array.isArray(o.proofImages) && o.proofImages.length > 0;
    const transferNote = (o.transferNote || (o.payment && o.payment.transferNote) || '').toString();
    const includesOrderId = !!(transferNote && o.id && transferNote.indexOf(String(o.id)) !== -1);
    // If provider reported a reconciliation amount (e.g., manual or webhook), compare
    const reconciledAmount = o.payment && o.payment.reconciliation && Number(o.payment.reconciliation.amount || 0);
    const total = Number(o.total || o.amount || 0);
    let amountMatch = false;
    if (reconciledAmount && total) {
      const diff = Math.abs(reconciledAmount - total);
      amountMatch = diff <= Math.max(5000, Math.round(total * 0.02)); // tolerance: 5k or 2%
    }

    // Scoring rules
    // High: hasProof && includesOrderId && (amountMatch OR no reconciledAmount present)
    if (hasProof && includesOrderId && (amountMatch || !reconciledAmount)) return { level: 'high', text: 'Khả năng khớp cao (có ảnh + nội dung có mã đơn)' };
    // Medium: hasProof && (amountMatch OR includesOrderId)
    if (hasProof && (amountMatch || includesOrderId)) return { level: 'medium', text: 'Nghi ngờ / cần kiểm tra (có ảnh hoặc nội dung khả nghi)' };
    // Low: only amount matches
    if (amountMatch) return { level: 'low', text: 'Khớp về số tiền nhưng thiếu ảnh hoặc nội dung' };
    // Default
    if (hasProof) return { level: 'medium', text: 'Có ảnh minh chứng nhưng nội dung chưa rõ' };
    return { level: 'low', text: 'Chưa có bằng chứng hoặc nội dung không khớp' };
  };

  const confirmPayment = async () => {
    if (!selectedOrder || !selectedOrder.id) return showError('Chưa chọn đơn hàng');
    const ok = window.confirm('Xác nhận đã thanh toán cho đơn ' + selectedOrder.id + ' ? (Hành động này sẽ đặt trạng thái thành "Đã thanh toán")');
    if (!ok) return;
    try {
      const adminUser = (auth && (auth.currentUser as any)) || null;
      const adminId = adminUser ? (adminUser.uid || adminUser.email || 'admin') : 'admin';
      const adminName = adminUser ? (adminUser.displayName || adminUser.email || adminId) : 'admin';
      const paymentAmount = Number(selectedOrder.total || selectedOrder.amount || 0);
      const reconciliation = {
        provider: 'manual',
        transactionId: `manual-${Date.now()}`,
        amount: paymentAmount,
        raw: { confirmedBy: adminId },
        confirmedAt: serverTimestamp()
      };

      const upd: any = {
        'payment.reconciled': true,
        'payment.reconciliation': reconciliation,
        locked: false,
        status: 'Đã Thanh Toán',
        reconciledAt: serverTimestamp(),
        'payment.reconciliation.confirmedBy': adminName
      };

      await updateDoc(doc(db, 'orders', selectedOrder.id), upd as any);
      showSuccess('Đã xác nhận thanh toán và mở kho cho đơn ' + selectedOrder.id);
    } catch (err) {
      console.error('confirmPayment error', err);
      showError('Xác nhận thanh toán thất bại');
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

  // Match info for manual reconciliation badges
  const matchInfo = selectedOrder ? computeMatchStatus(selectedOrder) : null;

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
        {selectedOrder && (
          <div className="modal-overlay" onClick={()=>setSelectedOrder(null)}>
            <div className="modal-card" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div style={{display:'flex', gap:12, flexDirection: 'column', alignItems: 'flex-start'}}>
                  <div style={{display:'flex', gap:12, alignItems:'center'}}>
                    <div className="order-id">Đơn {selectedOrder.id}</div>
                    <div className="order-customer" style={{color:'#374151'}}>{selectedOrder.customerName || selectedOrder.customer || ''}</div>
                  </div>
                  {orderTitle ? <div style={{fontSize:13, color:'#6b7280', marginTop:4}}>Tên đơn: {orderTitle}</div> : null}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="status-badge">{selectedOrder.status || 'Chờ Xử Lý'}</div>
                  {matchInfo ? (
                    <div title={matchInfo.text} style={{padding:'6px 10px', borderRadius:6, fontSize:13, background: matchInfo.level === 'high' ? '#ecfdf5' : matchInfo.level === 'medium' ? '#fff7ed' : '#f8fafc', color: matchInfo.level === 'high' ? '#065f46' : matchInfo.level === 'medium' ? '#92400e' : '#0f172a', border: '1px solid ' + (matchInfo.level === 'high' ? '#10b981' : matchInfo.level === 'medium' ? '#f59e0b' : '#cbd5e1')}}>
                      {matchInfo.level === 'high' ? 'Khả năng khớp cao' : matchInfo.level === 'medium' ? 'Cần kiểm tra' : 'Không rõ'}
                    </div>
                  ) : null}
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
                          {/* Automatic geocoding only (no manual paste) */}
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
                    <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                      <button className="btn-add" disabled={gettingLocation} onClick={addTrackingPoint}>
                        {gettingLocation ? 'Đang lấy vị trí...' : 'Thêm điểm đến (vị trí hiện tại)'}
                      </button>
                          <button className="btn-primary" onClick={async () => {
                            if (!selectedOrder || !selectedOrder.id) return showError('Đơn chưa xác định');
                            try {
                              // startSharing now returns a Promise that resolves when first fix is sent
                              await (trackingClient as any).startSharing(selectedOrder.id);
                              setIsSharing(true);
                              showSuccess('Bắt đầu chia sẻ vị trí cho đơn này');
                            } catch (e: any) {
                              console.error('startSharing failed', e);
                              showError('Không thể bắt đầu chia sẻ: ' + (e?.message || String(e)));
                            }
                          }} disabled={!selectedOrder}>
                          Bắt đầu chia sẻ
                          </button>
                      <button className="btn-secondary" onClick={() => { try { (trackingClient as any).stopSharing(); setIsSharing(false); showSuccess('Đã dừng chia sẻ vị trí'); } catch(e){ const err:any = e; showError('Không thể dừng chia sẻ: ' + (err?.message || String(err))); } }}>
                        Dừng chia sẻ
                      </button>
                      <div style={{marginLeft:10, fontSize:13}}>{isSharing ? 'Đang chia sẻ vị trí' : 'Chưa chia sẻ'}</div>
                    </div>

                    {stagedTracking.length > 0 && (
                      <div className="staged-list">
                        <h4>Điểm tạm (chưa lưu)</h4>
                        {stagedTracking.map((s: any, idx: number) => (
                          <div key={idx} className="staged-item">
                            <div style={{ flex: 1 }}>
                              <div className="coords">
                                <strong>Vị trí:</strong> {s.lat && s.lng ? `${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}` : 'Không có toạ độ'}
                              </div>
                              <div className="note">
                                <input
                                  placeholder="Ghi chú"
                                  value={s.note}
                                  onChange={e => updateStagedNote(idx, e.target.value)}
                                  style={{ width: '100%', padding: 6 }}
                                />
                              </div>
                              <div style={{ marginTop: 6 }}>
                                <input
                                  type="file"
                                  onChange={e => handleStagedImageChange(idx, e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Danh sách các event đã lưu (nếu cần hiển thị) */}
                    <div className="saved-events" style={{marginTop: 15}}>
                       {selectedOrderEvents.map((ev, i) => (
                         <div key={i} style={{fontSize: '0.85rem', marginBottom: 5, borderBottom: '1px solid #eee'}}>
                           {new Date(ev.ts?.seconds * 1000).toLocaleString()}: {ev.status} - {ev.note}
                         </div>
                       ))}
                    </div>
                  </div>
                </div> {/* Đóng modal-column thứ 2 */}
              </div> {/* Đóng modal-grid */}

              <div className="modal-footer" style={{marginTop: 20, textAlign: 'right', gap: 10, display: 'flex', justifyContent: 'flex-end'}}>
                <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Hủy</button>
                {selectedOrder && !(selectedOrder.payment && selectedOrder.payment.reconciled) && (
                  <button className="btn-warning" onClick={confirmPayment} style={{marginRight:8}}>Xác nhận đã thanh toán</button>
                )}
                <button className="btn-primary" disabled={uploading} onClick={saveStatusChange}>
                  {uploading ? 'Đang lưu...' : 'Lưu cập nhật'}
                </button>
              </div>
            </div> 
          </div> 
        )}
      </div> 
    </div> 
  );
}
