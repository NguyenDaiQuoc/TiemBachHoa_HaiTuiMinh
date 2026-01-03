import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../firebase-auth";
import { db } from "../firebase";
import { doc, onSnapshot, getDoc, collection, query, orderBy } from 'firebase/firestore';
import { showError } from '../utils/toast';
import { handleFirestoreError } from '../utils/firestoreErrors';
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import "../../css/order-tracking.css";

// Format tiền tệ
const formatCurrency = (amount: any) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// --- Component Thanh Trạng Thái (Timeline) ---
function TrackingTimeline({ currentStep, events }: any) {
  // Build timeline steps from tracking events if available, otherwise fallback to default steps
  let steps: any[] = [];
  if (Array.isArray(events) && events.length > 0) {
    steps = events.map((e: any) => ({ name: e.status || e.name || 'Vị trí', date: e.ts ? (e.ts.seconds ? new Date(e.ts.seconds * 1000).toLocaleString() : new Date(e.ts).toLocaleString()) : (e.time || '') }));
  } else {
    steps = [
      { name: "Đã Đặt Hàng", date: "" },
      { name: "Đang Xử Lý", date: "" },
      { name: "Đang Giao Hàng", date: "" },
      { name: "Đã Giao Thành Công", date: "" },
    ];
  }

  const normalize = (s: string) => (s || '').toString().toLowerCase();
  const stepIndex = (() => {
    const cs = normalize(currentStep || '');
    if (!cs) return steps.length - 1 >= 0 ? -1 : -1;
    // find exact match or best-effort match in steps
    const found = steps.findIndex(step => normalize(step.name).includes(cs) || cs.includes(normalize(step.name)));
    if (found >= 0) return found;
    // fallback heuristics
    if (cs.includes('đặt') || cs.includes('mới')) return 0;
    if (cs.includes('chờ') || cs.includes('xử lý') || cs.includes('processing')) return 1;
    if (cs.includes('vận') || cs.includes('giao') || cs.includes('vận chuyển')) return 2;
    if (cs.includes('đã giao') || cs.includes('hoàn thành')) return Math.max(0, steps.length - 1);
    return Math.min(steps.length - 1, Math.max(0, found));
  })();

  return (
    <div className="timeline-wrapper">
      <div className="timeline-line"></div>
      {steps.map((step, index) => {
        const isActive = index <= stepIndex;
        return (
          <div key={step.name + index} className="timeline-step">
            <div className={`timeline-circle ${isActive ? 'active' : ''}`}>
              {isActive && <span>✓</span>}
            </div>
            <p className={`timeline-name ${isActive ? 'active' : ''}`}>{step.name}</p>
            {step.date && <p className={`timeline-date ${isActive ? 'active' : ''}`}>{step.date}</p>}
          </div>
        );
      })}
    </div>
  );
}

// --- Component Bản Đồ Vận Đơn ---
function LiveTrackingMapComponent({ currentLocation, ETA }: any) {
  const checkpoints = [
    { location: "Kho Xử Lý TP.HCM", status: "Đã rời khỏi", time: "11:00 AM" },
    { location: "Bưu cục Cầu Giấy, HN", status: "Đang trung chuyển", time: "08:00 AM" },
    { location: "Điểm giao nhận gần nhất", status: "Sẵn sàng giao", time: "" },
  ];

  return (
    <div className="map-wrapper">
      <h3 className="map-title">Hành Trình Vận Đơn Trực Tiếp</h3>

      <div className="map-box">
        <div className="map-placeholder">
          <p>Giao Diện Bản Đồ Mô Phỏng<br />(Tích hợp Google Maps / API)</p>
        </div>
        <div className="map-truck">🚚</div>
      </div>

      <div className="map-status">
        <div>
          <p>Vị trí hiện tại gần nhất:</p>
          <p className="highlight-green">{currentLocation}</p>
        </div>
        <div className="text-right">
          <p>Thời gian dự kiến nhận hàng (ETA):</p>
          <p className="highlight-orange">{ETA}</p>
        </div>
      </div>

      <div className="map-checkpoints">
        <h4>Lịch Sử Điểm Dừng Gần Nhất</h4>
        {checkpoints.map((point, index) => (
          <div key={index} className="checkpoint">
            <div className={`checkpoint-dot ${index === 0 ? 'highlight-orange' : ''}`}></div>
            <div>
              <p>{point.location} - <span className={index === 0 ? 'highlight-orange' : ''}>{point.status}</span></p>
              {point.time && <p className="checkpoint-time">Cập nhật lúc: {point.time}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
type OrderTrackingProps = {
  orderId?: string;
  currentStatus?: string;
  totalAmount?: number;
  currentLocation?: string;
  ETA?: string;
};


// --- Component Chính ---
export default function OrderTracking({ orderId, currentStatus, totalAmount, currentLocation, ETA }: OrderTrackingProps) {
  const params = useParams();
  const idFromRoute = params.orderId;
  // Allow passing orderId via props, route param, or query string (?orderId=...)
  const qp = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search).get('orderId') : null;
  const orderIdToUse = orderId || idFromRoute || qp;
  const navigate = useNavigate();
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const mapRef = useRef<any>(null);

  // whenever tracking events update, ensure map recenters on the latest known location (including IP-derived coords)
  useEffect(() => {
    const locEvents = trackingEvents.map((t:any) => {
      if (t && t.location && t.location.lat != null && t.location.lng != null) {
        return { ...t, location: { lat: Number(t.location.lat), lng: Number(t.location.lng) } };
      }
      if (t && t.lat != null && t.lng != null) {
        return { ...t, location: { lat: Number(t.lat), lng: Number(t.lng) } };
      }
      return null;
    }).filter(Boolean);

    if (locEvents.length > 0 && mapRef.current) {
      const last = locEvents[locEvents.length - 1];
      try {
        // react-leaflet Map instance supports setView / flyTo
        if (mapRef.current.setView) mapRef.current.setView([last.location.lat, last.location.lng], 13);
        else if (mapRef.current.flyTo) mapRef.current.flyTo([last.location.lat, last.location.lng], 13);
      } catch (e) {
        // ignore
      }
    } else if (!locEvents.length && orderData && orderData.shippingLocation && mapRef.current) {
      try {
        const sl = orderData.shippingLocation;
        const lat = sl.lat != null ? Number(sl.lat) : null;
        const lng = sl.lng != null ? Number(sl.lng) : null;
        if (lat != null && lng != null) {
          if (mapRef.current.setView) mapRef.current.setView([lat, lng], 13);
          else if (mapRef.current.flyTo) mapRef.current.flyTo([lat, lng], 13);
        }
      } catch (e) {}
    }
  }, [trackingEvents, orderData]);

  // Listen to auth state changes like Cart.tsx
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setShowLoginWarning(true);
      } else {
        setShowLoginWarning(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load order by id and listen to tracking events (with error handling)
  useEffect(() => {
    if (!orderIdToUse) return;
    const dRef = doc(db, 'orders', orderIdToUse);
    const off = onSnapshot(dRef, (snap) => {
      if (!snap.exists()) return;
      setOrderData({ id: snap.id, ...snap.data() });
    }, (err) => {
      handleFirestoreError(err, 'order snap err');
    });

    // listen to trackingEvents subcollection
    const evColl = collection(db, 'orders', orderIdToUse, 'trackingEvents');
    const evQuery = query(evColl, orderBy('ts', 'asc'));
    const offEvents = onSnapshot(evQuery, (snap) => {
      try {
        const arr: any[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
        setTrackingEvents(arr);
      } catch (err: any) {
        console.error('tracking events snap err', err);
        handleFirestoreError(err, 'tracking events processing error');
      }
    }, (err) => {
      handleFirestoreError(err, 'tracking events onSnapshot err');
    });

    return () => { off(); offEvents(); };
  }, [orderIdToUse]);

  const shippingAddress = orderData?.shippingAddress || orderData?.address || "";
  const orderItems = orderData?.items || [];
  const computedTotal = orderData?.total || orderData?.amount || orderData?.subtotal || (Array.isArray(orderItems) ? orderItems.reduce((s:any,i:any)=> s + ((i.price||i.unitPrice||i.amount||0) * (i.quantity||i.qty||1)), 0) : 0);
  const paymentMethod = orderData?.paymentMethod || orderData?.payment || '---';
  const customerName = orderData?.customerName || orderData?.customer || orderData?.userName || '';
  const customerPhone = orderData?.phone || orderData?.mobile || orderData?.customerPhone || '';
  // currentLocation text: last tracking event location or shippingLocation
  let currentLocationText = '---';
  const locEvents = trackingEvents.filter((t:any)=>t.location);
  if (locEvents.length > 0) {
    const last = locEvents[locEvents.length - 1];
    currentLocationText = `${last.location.lat.toFixed(5)}, ${last.location.lng.toFixed(5)}`;
  } else if (orderData?.shippingLocation) {
    currentLocationText = `${orderData.shippingLocation.lat?.toFixed ? orderData.shippingLocation.lat.toFixed(5) : orderData.shippingLocation.lat}, ${orderData.shippingLocation.lng?.toFixed ? orderData.shippingLocation.lng.toFixed(5) : orderData.shippingLocation.lng}`;
  }
  const displayETA = orderData?.ETA || orderData?.eta || ETA || '---';

  return (
    <div className="tracking-wrapper">
      <Header />

      <div className="tracking-content">
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <button className="btn-secondary" onClick={() => window.history.back()}>← Quay lại</button>
          <h1 style={{margin:0}}>Theo Dõi Đơn Hàng Của Bạn</h1>
        </div>
        <p>Mã đơn hàng: <span className="highlight-green">{orderIdToUse}</span></p>

        {/* Timeline */}
        <div className="timeline-card">
          <h2>Trạng Thái Hiện Tại: {orderData?.status || currentStatus || '---'}</h2>
          <TrackingTimeline currentStep={orderData?.status || currentStatus} />
          {customerName ? <div style={{marginTop:8}}>Khách hàng: <strong>{customerName}</strong> {customerPhone ? <span>— {customerPhone}</span> : null}</div> : null}
        </div>

        {/* Map */}
        <div className="map-card">
          <h3>Bản đồ hành trình</h3>
          {
            (() => {
              // build points from tracking events that have location
              // build points from tracking events supporting both t.location and top-level lat/lng
              const pts = trackingEvents.map((t:any) => {
                if (t && t.location && t.location.lat != null && t.location.lng != null) return [Number(t.location.lat), Number(t.location.lng)];
                if (t && t.lat != null && t.lng != null) return [Number(t.lat), Number(t.lng)];
                return null;
              }).filter(Boolean as any);
              // fallback to order shippingLocation if no tracking points available
              if (pts.length === 0 && orderData?.shippingLocation && orderData.shippingLocation.lat && orderData.shippingLocation.lng) {
                pts.push([orderData.shippingLocation.lat, orderData.shippingLocation.lng]);
              }
              if (pts.length === 0) {
                return <div className="map-placeholder">Chưa có dữ liệu vị trí để hiển thị bản đồ.</div>;
              }
              // center map on the most recent tracking point (latest delivery location)
              const center: any = pts[pts.length - 1];
              return (
                <div style={{height:400}}>
                  <MapContainer ref={(m: any) => { mapRef.current = m; }} style={{height:'100%', width:'100%'}} center={[center[0], center[1]]} zoom={13}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Polyline positions={pts} color="#4A6D56" />
                    {
                      // render shippingLocation as a distinct marker (different color)
                      orderData && orderData.shippingLocation && orderData.shippingLocation.lat != null && orderData.shippingLocation.lng != null ? (
                        <CircleMarker
                          center={[Number(orderData.shippingLocation.lat), Number(orderData.shippingLocation.lng)]}
                          pathOptions={{ color: '#1f8ef1', fillColor: '#1f8ef1' }}
                          radius={8}
                        >
                          <Popup>
                            <div style={{minWidth:180}}>
                              <div><strong>Địa điểm đặt hàng</strong></div>
                              <div style={{fontSize:12}}>{shippingAddress}</div>
                              <div style={{marginTop:6}}><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(Number(orderData.shippingLocation.lat) + ',' + Number(orderData.shippingLocation.lng))}`}>Mở Maps</a></div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ) : null
                    }
                    {
                      // Render each tracking point as a CircleMarker (Marker icons can be missing in some builds)
                      pts.map((p:any, idx:number) => {
                        const ev = trackingEvents[idx];
                        return (
                          <CircleMarker key={idx} center={[p[0], p[1]]} pathOptions={{ color: '#4A6D56', fillColor: '#4A6D56' }} radius={6}>
                            <Popup>
                              <div style={{minWidth:180}}>
                                <div><strong>{ev?.status || 'Vị trí'}</strong></div>
                                <div style={{fontSize:12}}>{ev?.note || ''}</div>
                                {ev?.image ? <div style={{marginTop:6}}><a target="_blank" rel="noreferrer" href={ev.image}><img src={ev.image} style={{width:180}} alt="proof"/></a></div> : null}
                                <div style={{marginTop:6}}><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p[0] + ',' + p[1])}`}>Mở Maps</a></div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        )
                      })
                    }
                  </MapContainer>
                </div>
              );
            })()
          }
        </div>

        {/* Chi tiết đơn hàng */}
        <div className="tracking-grid">
          <div className="tracking-info">
            <h3>Thông Tin Thanh Toán & Giao Nhận</h3>
            <p>Địa Chỉ Nhận: {shippingAddress}</p>
            <p>Hình Thức Thanh Toán: {paymentMethod}</p>
            <div className="summary">
              <div className="summary-row">
                <span>Tổng Sản Phẩm:</span>
                <span>{orderItems.length}</span>
              </div>
              <div className="summary-row">
                <span>Phí Vận Chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <div className="summary-row total">
                <span>Tổng Tiền Thanh Toán:</span>
                <span className="highlight-green">{formatCurrency(computedTotal)}</span>
              </div>
            </div>
          </div>

          <div className="tracking-products">
            <h3>Sản Phẩm Trong Đơn</h3>
                  {Array.isArray(orderItems) && orderItems.length > 0 ? orderItems.map((item:any, index:number) => (
                    <div key={index} className="product-row" style={{display:'flex', alignItems:'center', gap:12}}>
                      <div style={{width:64, height:64, overflow:'hidden', borderRadius:8, background:'#f7f7f7', flex:'0 0 64px'}}>
                        { (item.image || item.img || item.thumbnail) ? (
                          <img src={item.image || item.img || item.thumbnail} alt={item.name || 'product'} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                        ) : (
                          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#999'}}>No Image</div>
                        ) }
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600}}>{item.name || item.title || item.productName}</div>
                        <div style={{fontSize:13,color:'#666'}}>(x{item.quantity || item.qty || 1})</div>
                      </div>
                      <div style={{fontWeight:700}}>{formatCurrency((item.price || item.unitPrice || item.amount || 0) * (item.quantity || item.qty || 1))}</div>
                    </div>
                  )) : (<div>Không có sản phẩm chi tiết</div>)}
          </div>
        </div>

        <div className="tracking-support">
          <p>Bạn cần hỗ trợ thêm về đơn hàng? Đội ngũ Hai Tụi Mình luôn sẵn sàng!</p>
          <button className="btn-support">Liên Hệ Hỗ Trợ (Zalo/Hotline)</button>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để theo dõi đơn hàng"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </div>
  );
}
