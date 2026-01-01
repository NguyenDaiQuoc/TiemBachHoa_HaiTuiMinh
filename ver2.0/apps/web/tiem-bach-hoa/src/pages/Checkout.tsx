// React CheckoutPage (CSS removed from JSX)
// Import Header, Footer, FloatingButtons normally
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "firebase/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import VoucherPicker from '../components/VoucherPicker';
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase-auth";
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { computeDistanceKm } from '../utils/distance';
import { storage } from '../firebase';
import { ref as storageRef } from 'firebase/storage';
import uploadWithRetries from '../utils/storage';
import { clearCart } from '../utils/cart';
import { fetchActiveDeals, applyDealsToPrice } from '../utils/deals';
import "../../css/checkout.css"

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  type CartItem = {
    id?: string;
    productId?: string;
    name?: string;
    price?: number;
    appliedPrice?: number;
    quantity?: number;
    qty?: number;
    image?: string;
    images?: string[];
  };
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState<boolean>(true);

  // form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD'|'BANK'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [addressLoadError, setAddressLoadError] = useState<string | null>(null);
  const [selectedVouchers, setSelectedVouchers] = useState<{cart?: any|null, shipping?: any|null}>({});
  const [manualVoucherCode, setManualVoucherCode] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<'thuong'|'nhanh'|'sieu-toc'>('thuong');
  const [computedDistanceKm, setComputedDistanceKm] = useState<number | null>(null);
  const [computedShippingFee, setComputedShippingFee] = useState<number | null>(null);
  const [computingDistance, setComputingDistance] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'momo'|'vnpay'|'zalopay'|'bank'|'none'>('none');
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [lastTransferNote, setLastTransferNote] = useState<string | null>(null);
  
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUrls, setProofUrls] = useState<string[]>([]);

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

  // auto-fill default address when user logs in
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const col = collection(db, 'users', currentUser.uid, 'addresses');
        const q = query(col, where('isDefault','==',true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0].data() as any;
          setFullName(d.recipient || '');
          setPhone(d.phone || '');
          setAddress(d.detail || '');
          setCity(d.city || '');
          setDistrict(d.district || '');
          setAddressLoadError(null);
        }
      } catch (err) {
        // handle permission errors gracefully: surface a friendly message
        try {
          const e:any = err;
          if (e && (e.code === 'permission-denied' || (e.message && e.message.toLowerCase().includes('permission')) || (String(e).toLowerCase().includes('missing or insufficient')))) {
            setAddressLoadError('Không thể tải địa chỉ mặc định — thiếu quyền truy cập. Vui lòng kiểm tra đăng nhập hoặc thêm địa chỉ thủ công.');
          } else {
            setAddressLoadError('Không thể tải địa chỉ mặc định. Vui lòng thêm địa chỉ thủ công.');
          }
        } catch (xx) {
          setAddressLoadError('Không thể tải địa chỉ mặc định.');
        }
      }
    })();
  }, [currentUser]);

  // load saved addresses when opening modal
  useEffect(() => {
    if (!addressModalOpen) return;
    if (!currentUser) { setShowLoginWarning(true); return; }
    (async () => {
      try {
        const col = collection(db, 'users', currentUser.uid, 'addresses');
        const snap = await getDocs(col);
        const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setSavedAddresses(docs);
      } catch (err) {
        // Handle permission errors gracefully and surface friendly message
        try {
          const e:any = err;
          if (e && (e.code === 'permission-denied' || (e.message && e.message.toLowerCase().includes('permission')) || (String(e).toLowerCase().includes('missing or insufficient')))) {
            setAddressLoadError('Không thể tải địa chỉ đã lưu — thiếu quyền truy cập. Hãy thêm địa chỉ thủ công hoặc kiểm tra quyền trong tài khoản.');
          } else {
            setAddressLoadError('Không thể tải địa chỉ đã lưu. Vui lòng thử lại sau.');
          }
        } catch (ee) {
          setAddressLoadError('Không thể tải địa chỉ đã lưu.');
        }
        setSavedAddresses([]);
      }
    })();
  }, [addressModalOpen, currentUser]);
  
  // Load cart from Firestore (single read)
  useEffect(() => {
    if (!currentUser) {
      setCartItems([]);
      setLoadingCart(false);
      return;
    }

    (async () => {
      try {
        const cartRef = doc(db, 'cart', currentUser.uid);
        const snap = await getDoc(cartRef);
        const items = snap.exists() ? (snap.data().items || []) : [];

        // apply active deals (client-side)
        const deals = await fetchActiveDeals();
        const applied = items.map((it:any) => {
          const { price } = applyDealsToPrice(it.price, String(it.productId || it.id || ''), deals);
          return { ...it, appliedPrice: price };
        });

        setCartItems(applied);
      } catch (err) {
        console.error('load cart in checkout', err);
        setCartItems([]);
      } finally {
        setLoadingCart(false);
      }
    })();
  }, [currentUser]);

  // Helper: create payment URL and QR image
  // NOTE: amount must be passed in to avoid using `total` before it's initialized
  // Normalize Vietnamese name and build transfer note
  const normalizeName = (name: string) =>
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');

  // Build a transfer note. If orderCode is provided (preferred), use it as the stable unique prefix.
  // Otherwise fall back to a short random token (temporary until server provides one).
  const buildTransferNote = (nameRaw: string, orderCode?: string) => {
    const now = new Date();
    const date =
      String(now.getDate()).padStart(2, '0') +
      String(now.getMonth() + 1).padStart(2, '0') +
      now.getFullYear();
    const code = orderCode ? String(orderCode).toUpperCase().slice(0, 8) : Math.random().toString(36).slice(2, 8).toUpperCase();
    const cleanName = normalizeName(nameRaw || '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 12);
    return `${code}${date}${cleanName}`;
  };

  const createBankQr = ({ bankBin, accountNo, amount, note } : { bankBin: string; accountNo: string; amount: number; note: string; }) => {
    return `https://img.vietqr.io/image/${bankBin}-${accountNo}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(note)}`;
  };

  const createMomoQr = ({ phone, amount, note } : { phone: string; amount: number; note: string; }) => {
    const uri = `momo://transfer?phone=${phone}&amount=${amount}&comment=${encodeURIComponent(note)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uri)}`;
  };

  const createZaloPayQr = ({ phone, amount, note } : { phone: string; amount: number; note: string; }) => {
    const uri = `zalopay://pay?phone=${phone}&amount=${amount}&note=${encodeURIComponent(note)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uri)}`;
  };

  const createPaymentQr = (provider: 'momo'|'vnpay'|'zalopay'|'bank'|'none', amount: number) => {
    if (!provider || provider === 'none') return;
    try {
      // Build transfer note using VN-friendly normalization
      // prefer Firestore name or fullName input
      let displayName = fullName || '';
      if (currentUser) {
        try {
          // try to read local cached displayName quickly (not awaiting Firestore here to keep UX snappy)
          if (currentUser.displayName) displayName = String(currentUser.displayName);
          else if (currentUser.email) displayName = String(currentUser.email).split('@')[0];
        } catch (e) { /* ignore */ }
      }
      const note = buildTransferNote(displayName || 'KHACHHANG');
      setLastTransferNote(note);

      // constants (from environment - easier to configure)
      const MB_BIN = (import.meta as any).env?.VITE_MB_BIN || '970422';
      const MB_ACCOUNT = (import.meta as any).env?.VITE_MB_ACCOUNT || '155186868';
      const MB_OWNER = (import.meta as any).env?.VITE_MB_OWNER || 'NGUYENDAIQUOC';
      // receiver phone for e-wallets (configurable)
      const RECEIVER_PHONE = (import.meta as any).env?.VITE_RECEIVER_PHONE || '0931454176';

      let qr: string | null = null;
      if (provider === 'bank' || provider === 'vnpay') {
        // use VietQR (NAPAS) for bank and VNPAY fallback
        qr = createBankQr({ bankBin: MB_BIN, accountNo: MB_ACCOUNT, amount, note });
      } else if (provider === 'momo') {
        qr = createMomoQr({ phone: RECEIVER_PHONE, amount, note });
      } else if (provider === 'zalopay') {
        qr = createZaloPayQr({ phone: RECEIVER_PHONE, amount, note });
      }

      if (!qr) {
        // as last resort, encode plain text bank info
        const bankInfo = `NGÂN HÀNG: MBBANK\nSTK: ${MB_ACCOUNT}\nCHỦ TK: ${MB_OWNER}\nSỐ TIỀN: ${amount}\nNỘI DUNG: ${note}`;
        qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bankInfo)}`;
      }

      setQrImageUrl(qr);
      // show a brief alert with transfer note for convenience
      setTimeout(()=>{
        alert(`Ghi chú chuyển khoản: ${note}\nSao chép ghi chú này vào nội dung chuyển khoản để hệ thống đối soát.`);
      }, 60);
    } catch (err) {
      console.error('createPaymentQr', err);
      alert('Không thể tạo QR thanh toán. Vui lòng thử lại.');
    }
  };

  // Auto-generate QR when user selects a payment provider while in BANK mode
  useEffect(() => {
    if (paymentMethod === 'BANK' && selectedProvider && selectedProvider !== 'none') {
      // generate QR automatically
      createPaymentQr(selectedProvider, total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, paymentMethod]);

  // Pre-generate a transfer note so it's available in the UI for any payment method
  useEffect(() => {
    const gen = async () => {
      try {
        const orderCode = (Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(2,10)) || `r${Date.now()}`;
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = String(now.getFullYear());
        const dateCompact = dd + mm + yyyy;
        let rawName = fullName || 'khachhang';
        if (currentUser) {
          try {
            if (currentUser.displayName) rawName = String(currentUser.displayName);
            else if (currentUser.email) rawName = String(currentUser.email).split('@')[0];
          } catch (e) { /* ignore */ }
        }
          setLastTransferNote(buildTransferNote(rawName || 'KHACHHANG'));
      } catch (e) {
        // ignore
      }
    };
    gen();
  }, [currentUser, fullName]);

  const getQty = (item: any) =>
    typeof item.quantity === 'number' ? item.quantity : typeof item.qty === 'number' ? item.qty : 1;

  const subtotal = cartItems.reduce((acc, item) => acc + ((item.appliedPrice ?? item.price ?? 0) * getQty(item)), 0);

  // compute voucher discount
  const getVoucherCategory = (v: any) => {
    if (!v) return 'cart';
    if (v.appliesTo === 'shipping' || v.isFreeShip || v.category === 'shipping') return 'shipping';
    return 'cart';
  };

  const cartVoucher = selectedVouchers.cart || null;
  const shippingVoucher = selectedVouchers.shipping || null;

  // base shipping fee depending on distance; there is no flat fee anymore
  const baseShippingFee = (computedShippingFee ?? null);

  const cartVoucherDiscount = (() => {
    if (!cartVoucher) return 0;
    try {
      if (cartVoucher.discountType === 'percentage') {
        return Math.floor(subtotal * (Number(cartVoucher.discountValue || 0) / 100));
      }
      return Number(cartVoucher.discountValue || 0);
    } catch (e) { return 0; }
  })();

  const shippingVoucherDiscount = (() => {
    if (!shippingVoucher) return 0;
    try {
      if (shippingVoucher.isFreeShip) return (baseShippingFee ?? 0); // make it free
      if (shippingVoucher.discountType === 'percentage') {
        return Math.floor((baseShippingFee ?? 0) * (Number(shippingVoucher.discountValue || 0) / 100));
      }
      return Math.min(Number(shippingVoucher.discountValue || 0), (baseShippingFee ?? 0));
    } catch (e) { return 0; }
  })();

  const shippingFeeAfterVoucher = Math.max(0, (baseShippingFee ?? 0) - shippingVoucherDiscount);
  // Free shipping threshold (if subtotal >= threshold, shipping is free)
  const FREE_SHIP_THRESHOLD = 500000;
  const effectiveShippingFee = subtotal >= FREE_SHIP_THRESHOLD ? 0 : shippingFeeAfterVoucher;
  const total = Math.max(0, subtotal - cartVoucherDiscount + effectiveShippingFee);

  // Recompute shipping fee when user changes shipping speed
  useEffect(() => {
    if (computedDistanceKm == null) return;

    const perKm = 3000;
    const base = 15000;
    const raw = Math.max(base, Math.round(computedDistanceKm * perKm));

    const speedMultiplier = shippingMethod === 'thuong' ? 1 : shippingMethod === 'nhanh' ? 1.4 : 1.8;

    setComputedShippingFee(Math.round(raw * speedMultiplier));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingMethod, computedDistanceKm]);

  return (
    <div className="checkout-wrapper">
      <Header />

      <div className="checkout-container">
        {/* Left */}
        <div className="checkout-left">
          <h1 className="checkout-title">Thanh Toán Đơn Hàng</h1>

          {addressLoadError && (
            <div className="notice error">{addressLoadError}</div>
          )}

          {/* Customer Info */}
          <section className="section-block">
            <h2 className="section-title">1. Thông Tin Nhận Hàng</h2>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:600}}>Chọn địa chỉ</div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn-secondary" onClick={()=>setAddressModalOpen(true)}>Chọn địa chỉ đã lưu</button>
                <a className="link" href="/address-book">Quản lý sổ địa chỉ</a>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Họ và Tên *</label>
                <input value={fullName} onChange={e=>setFullName(e.target.value)} type="text" placeholder="Ví dụ: Nguyễn Văn A" required />
              </div>

              <div className="form-group">
                <label>Số Điện Thoại *</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="Ví dụ: 090xxxxxxx" required />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Ví dụ: email@domain.com" />
            </div>

            <div className="form-group">
              <label>Địa Chỉ Chi Tiết *</label>
              <input value={address} onChange={e=>setAddress(e.target.value)} type="text" placeholder="Số nhà, tên đường, phường/xã" required />
            </div>
              

            <div className="grid-2">
              <div className="form-group">
                <label>Tỉnh / Thành phố *</label>
                <input value={city} onChange={e=>setCity(e.target.value)} type="text" required />
              </div>

              <div className="form-group">
                <label>Quận / Huyện *</label>
                <input value={district} onChange={e=>setDistrict(e.target.value)} type="text" required />
              </div>
            </div>

            <div className="form-group">
              <label>Ghi Chú</label>
              <input value={notes} onChange={e=>setNotes(e.target.value)} type="text" placeholder="Ví dụ: Giao giờ hành chính" />
            </div>
          </section>

            {/* Address picker modal (on demand) */}
            {addressModalOpen && (
              <div className="ab-modal-overlay" onClick={() => setAddressModalOpen(false)}>
                <div className="ab-modal" style={{maxWidth:600}} onClick={(e)=>e.stopPropagation()}>
                  <h3>Chọn địa chỉ đã lưu</h3>
                  <div style={{maxHeight:300,overflow:'auto',marginTop:8}}>
                    {savedAddresses.length === 0 ? (
                      <div>Không tìm thấy địa chỉ đã lưu.</div>
                    ) : (
                      savedAddresses.map(a => (
                          <div key={a.id} style={{borderBottom:'1px solid #eee',padding:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <div style={{fontWeight:600}}>{a.recipient}</div>
                            <div style={{fontSize:13}}>{a.phone}</div>
                            <div style={{fontSize:13}}>{a.detail}</div>
                          </div>
                          <div>
                            <button className="btn-primary" onClick={() => { setFullName(a.recipient||''); setPhone(a.phone||''); setAddress(a.detail||''); setCity(a.city||''); setDistrict(a.district||''); setAddressModalOpen(false); }}>Chọn</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{marginTop:12,display:'flex',gap:8}}>
                    <button className="btn-secondary" onClick={()=>setAddressModalOpen(false)}>Đóng</button>
                    <a className="btn-primary" href="/address-book">Quản lý địa chỉ</a>
                  </div>
                </div>
              </div>
            )}

          {/* Shipping */}
          <section className="section-block">
            <h2 className="section-title">2. Phương Thức Vận Chuyển</h2>

            <div className="shipping-option" style={{marginTop:0}}>
              <label style={{fontWeight:700}}>
                Tính phí theo khoảng cách (km)
              </label>
              <div style={{marginLeft:24}}>
                <div style={{fontSize:12,color:'#666'}}>Khoảng cách tới kho: {computedDistanceKm !== null ? `${computedDistanceKm.toFixed(2)} km` : 'chưa tính'}</div>
                <div style={{fontSize:14,fontWeight:600}}>{computedShippingFee !== null ? computedShippingFee.toLocaleString() + ' VNĐ' : 'Chưa tính phí'}</div>
                <div style={{marginTop:6}}>
                  <button className="btn-secondary" onClick={async ()=>{
                    // calculate distance and fee
                    if (!address) return alert('Vui lòng nhập địa chỉ để tính khoảng cách');
                    setComputingDistance(true);
                    try {
                      const proxyUrl = `/api/geocode-opencage.php?address=${encodeURIComponent(address + ', ' + district + ', ' + city)}`;
                        const pr = await fetch(proxyUrl);
                        if (!pr.ok) {
                          // give a clearer error when the proxy endpoint is missing or returns non-200
                          const text = await pr.text().catch(()=>'<no body>');
                          console.warn('Geocode proxy responded with non-OK status', pr.status, text.slice ? text.slice(0,200) : text);
                          throw new Error('Geocode proxy failed: ' + pr.status);
                        }

                        // Robust parsing: some dev setups may return the source JS file (starting with // ...) instead of JSON.
                        let jd: any = null;
                        const contentType = (pr.headers.get('content-type') || '').toLowerCase();
                        if (contentType.includes('application/json') || contentType.includes('application/geo+json')) {
                          jd = await pr.json();
                        } else {
                          // Try to parse body safely; if it's not JSON, throw a helpful error instead of letting JSON.parse blow up with unexpected token '/'
                          const bodyText = await pr.text();
                          try {
                            jd = JSON.parse(bodyText);
                          } catch (parseErr) {
                            // If the proxy returned PHP source (server not executing PHP), avoid dumping source to console
                            const brief = String(bodyText || '').trim().slice(0,200);
                            if (brief.startsWith('<?php') || brief.indexOf('<?php') !== -1) {
                              console.warn('Geocode proxy appears to be serving PHP source instead of executing it. Falling back to external geocoders.');
                            } else {
                              console.warn('Geocode proxy returned non-JSON response (preview):', brief);
                            }
                            // Fallback sequence: OpenCage (if client key present) -> Nominatim -> IP-based
                            try {
                              const OC_KEY = (import.meta as any).env?.VITE_OPENCAGE_KEY;
                              if (OC_KEY) {
                                try {
                                  const ocUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address + ', ' + district + ', ' + city)}&key=${OC_KEY}&limit=1&language=vi`;
                                  const ocResp = await fetch(ocUrl, { headers: { 'Accept': 'application/json' } });
                                  if (ocResp.ok) {
                                    const ocj = await ocResp.json();
                                    if (ocj && ocj.results && ocj.results[0] && ocj.results[0].geometry) {
                                      jd = { lat: ocj.results[0].geometry.lat, lng: ocj.results[0].geometry.lng };
                                      console.info('Geocode fallback: used OpenCage direct API result');
                                    }
                                  } else {
                                    console.warn('OpenCage direct fetch failed', ocResp.status);
                                  }
                                } catch (ocErr) {
                                  console.warn('OpenCage direct attempt failed', ocErr);
                                }
                              }

                              if (!jd) {
                                const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address + ', ' + district + ', ' + city)}`;
                                const nom = await fetch(nomUrl, { headers: { 'Accept': 'application/json', 'User-Agent': 'tiembachhoa-app/1.0' } });
                                if (nom.ok) {
                                  const nomj = await nom.json();
                                  if (Array.isArray(nomj) && nomj.length > 0) {
                                    jd = { lat: nomj[0].lat, lng: nomj[0].lon };
                                    console.info('Geocode fallback: used Nominatim result');
                                  } else {
                                    throw new Error('Nominatim returned no results');
                                  }
                                } else {
                                  throw new Error('Nominatim fetch failed');
                                }
                              }
                            } catch (nomErr) {
                              console.warn('Nominatim fallback failed', nomErr);
                              // Try IP-based approximate geolocation
                              try {
                                const ipresp = await fetch('https://ipapi.co/json/');
                                if (!ipresp.ok) throw new Error('IP geolocation fetch failed');
                                const ipj = await ipresp.json();
                                // ipapi returns latitude/longitude keys
                                if (ipj && (ipj.latitude || ipj.lat || ipj.loc || ipj.longitude)) {
                                  const latv = ipj.latitude || ipj.lat || (ipj.loc ? String(ipj.loc).split(',')[0] : null);
                                  const lonv = ipj.longitude || ipj.lon || (ipj.loc ? String(ipj.loc).split(',')[1] : null);
                                  if (latv && lonv) {
                                    jd = { lat: latv, lng: lonv };
                                    console.info('Geocode fallback: used IP-based location');
                                  } else {
                                    throw new Error('IP geolocation returned no coords');
                                  }
                                } else {
                                  throw new Error('IP geolocation returned unexpected payload');
                                }
                              } catch (ipErr) {
                                console.warn('IP-based fallback failed', ipErr);
                                throw new Error('Geocode proxy returned unexpected response (not JSON). Fallback attempts failed.');
                              }
                            }
                          }
                        }

                        // expect { lat, lng } in multiple possible shapes
                        const lat = jd.lat || (jd.results && jd.results[0] && ((jd.results[0].geometry && jd.results[0].geometry.lat) || jd.results[0].geometry.lat));
                        const lng = jd.lng || (jd.results && jd.results[0] && ((jd.results[0].geometry && jd.results[0].geometry.lng) || jd.results[0].geometry.lng));
                      if (!lat || !lng) {
                        // try parse other shapes
                        if (jd.results && jd.results[0] && jd.results[0].geometry) {
                          const g = jd.results[0].geometry;
                          if (g.lat && g.lng) { /* ok */ }
                        }
                      }
                      const foundLat = Number(lat);
                      const foundLng = Number(lng);
                      if (!foundLat || !foundLng) throw new Error('Không tìm thấy toạ độ');
                      const WAREHOUSE = { lat: 10.762622, lng: 106.660172 };
                      const km = computeDistanceKm({lat: foundLat, lng: foundLng}, WAREHOUSE);
                      const perKm = 3000;
                      const base = 15000;
                      const raw = Math.max(base, Math.round(km * perKm));
                      // Apply shipping method multiplier
                      const speedMultiplier = shippingMethod === 'thuong' ? 1 : shippingMethod === 'nhanh' ? 1.4 : 1.8;
                      let finalFee = Math.round(raw * speedMultiplier);
                      // Free shipping threshold
                      const FREE_SHIP_THRESHOLD = 500000;
                      if (subtotal >= FREE_SHIP_THRESHOLD) {
                        finalFee = 0;
                      }
                      setComputedDistanceKm(km);
                      setComputedShippingFee(finalFee);
                    } catch (err) {
                      console.error('calc distance', err);
                      alert('Không thể tính khoảng cách tự động. Vui lòng kiểm tra địa chỉ hoặc thử chọn địa chỉ đã lưu.');
                    } finally {
                      setComputingDistance(false);
                    }
                  }}>{computingDistance ? 'Đang tính...' : 'Tính phí vận chuyển'}</button>
                </div>
              </div>
            </div>
            <div style={{marginTop:8}}>
                <div style={{fontWeight:600,marginBottom:6}}>Phương thức giao hàng</div>
              <div style={{display:'flex',gap:12}}>
                <label><input type="radio" name="shippingMethod" checked={shippingMethod==='thuong'} onChange={()=>setShippingMethod('thuong')} /> Thường (5-7 ngày) — giá mềm</label>
                <label><input type="radio" name="shippingMethod" checked={shippingMethod==='nhanh'} onChange={()=>setShippingMethod('nhanh')} /> Nhanh (3-5 ngày) — giá cao hơn</label>
                <label><input type="radio" name="shippingMethod" checked={shippingMethod==='sieu-toc'} onChange={()=>setShippingMethod('sieu-toc')} /> Siêu tốc (1-2 ngày) — giá cao nhất</label>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="section-block">
            <h2 className="section-title">3. Phương Thức Thanh Toán</h2>

            <div className="payment-option">
              <label>
                <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={()=>setPaymentMethod('COD')} /> COD - Thanh toán khi nhận hàng
              </label>
            </div>

            <div className="payment-option">
              <label>
                <input type="radio" name="payment" checked={paymentMethod === 'BANK'} onChange={()=>setPaymentMethod('BANK')} /> Chuyển khoản ngân hàng
              </label>
            </div>

              {paymentMethod === 'BANK' && (
              <div className="bank-panel" style={{marginTop:8}}>
                <div style={{fontWeight:600,marginBottom:6}}>Hình thức chuyển khoản</div>
                <div style={{display:'flex',gap:12,alignItems:'center'}}>
                  <label><input type="radio" name="provider" checked={selectedProvider==='momo'} onChange={()=>setSelectedProvider('momo')} /> Momo</label>
                  <label><input type="radio" name="provider" checked={selectedProvider==='vnpay'} onChange={()=>setSelectedProvider('vnpay')} /> VNPAY</label>
                  <label><input type="radio" name="provider" checked={selectedProvider==='zalopay'} onChange={()=>setSelectedProvider('zalopay')} /> ZaloPay</label>
                  <label><input type="radio" name="provider" checked={selectedProvider==='bank'} onChange={()=>setSelectedProvider('bank')} /> Ngân hàng (chuyển khoản)
                  </label>
                </div>
                <div style={{marginTop:8}}>
                  <button className="btn-primary" onClick={async ()=>{
                    if (!currentUser) { setShowLoginWarning(true); return; }
                    if (!selectedProvider || selectedProvider==='none') return alert('Chọn nhà cung cấp thanh toán');
                    await createPaymentQr(selectedProvider, total);
                  }}>Tạo QR/Đường dẫn thanh toán</button>
                </div>

                {qrImageUrl && (
                  <div className="qr-panel">
                    <div>Quét QR để thanh toán:</div>
                    <img className="qr-image" src={qrImageUrl} alt="QR Payment" />
                  </div>
                )}

                {/* Manual bank details panel for bank transfers (two options: quét mã hoặc chuyển thủ công) */}
                
                  <div className="bank-panel" style={{marginTop:12,background:'#fafafa'}}>
                    <div style={{fontWeight:700,marginBottom:6}}>Thông tin chuyển khoản</div>
                    <div className="bank-info">
                      <div className="bank-meta">
                        <div><strong>Ngân hàng:</strong> MBBANK</div>
                        <div><strong>STK:</strong> 155186868</div>
                        <div><strong>Chủ tài khoản:</strong> NGUYENDAIQUOC</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <button className="copy-btn" onClick={()=>{ const t = 'MBBANK - 155186868 - NGUYENDAIQUOC'; (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : (window as any).clipboardData && (window as any).clipboardData.setData ? (window as any).clipboardData.setData('text', t) : null); alert('Đã sao chép thông tin ngân hàng') }}>Sao chép</button>
                      </div>
                    </div>
                    <div style={{marginTop:8,fontSize:14}}>
                      <div style={{fontWeight:600}}>Nội dung chuyển khoản</div>
                      <div style={{marginTop:6,wordBreak:'break-word'}}><span className="transfer-note">{lastTransferNote || 'Nhấn "Tạo QR/Đường dẫn thanh toán" để tạo ghi chú chuyển khoản.'}</span></div>
                      <div style={{marginTop:8}}>
                        <button className="copy-btn" onClick={()=>{ if (!lastTransferNote) return alert('Chưa có ghi chú chuyển khoản'); const t = String(lastTransferNote); (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : (window as any).clipboardData && (window as any).clipboardData.setData ? (window as any).clipboardData.setData('text', t) : null); alert('Đã sao chép ghi chú chuyển khoản') }}>Sao chép</button>
                      </div>
                    </div>
                  </div>
                )

                <div style={{marginTop:10}}>
                  <div style={{fontWeight:600}}>Tải lên bằng chứng chuyển khoản (nếu có)</div>
                  <input type="file" accept="image/*" multiple onChange={(e)=>{ const f = e.target.files ? Array.from(e.target.files) : []; setProofFiles(f); }} />
                  <div style={{marginTop:8}}>
                    <button className="btn-primary" onClick={async ()=>{
                      if (!currentUser) { setShowLoginWarning(true); return; }
                      if (!proofFiles || proofFiles.length === 0) return alert('Chọn hình để tải lên');
                      setUploadingProof(true);
                      try {
                        const urls: string[] = [];
                        for (const f of proofFiles) {
                          const path = `transfer_proofs/${currentUser.uid}/${Date.now()}_${f.name}`;
                          const sRef = storageRef(storage, path);
                          const r = await uploadWithRetries(sRef, f, { maxRetries: 3 });
                          urls.push(r.url);
                        }
                        setProofUrls(urls);
                        alert('Tải lên thành công');
                      } catch (err) {
                        console.error('upload proofs', err);
                        alert('Tải lên thất bại');
                      } finally { setUploadingProof(false); }
                    }}>{uploadingProof ? 'Đang tải...' : 'Tải lên bằng chứng'}</button>
                  </div>

                  {proofUrls.length > 0 && (
                    <div style={{marginTop:8}}>
                      <div>Đã tải lên:</div>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {proofUrls.map(u => (<img key={u} src={u} style={{width:80,height:80,objectFit:'cover',borderRadius:6}} />))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right */}
        <div className="checkout-right">
          <div className="summary-box">
            <h2 className="summary-title">Đơn Hàng Của Bạn ({cartItems.length} sản phẩm)</h2>

            <div className="summary-items">
              {loadingCart ? (
                <div>Đang tải giỏ hàng...</div>
              ) : cartItems.map((item) => (
                <div key={item.productId || item.id} className="summary-item">
                  <div style={{display:'flex',alignItems:'center'}}>
                    {((item.image || (item.images && item.images[0]))) ? (
                      <img className="thumb" src={(item.image || (item.images && item.images[0]))} alt={item.name} />
                    ) : null}
                    <div className="meta">
                      <div className="name">{item.name}</div>
                      <div className="qty">Số lượng: {item.quantity || item.qty}</div>
                    </div>
                  </div>
                  <div style={{minWidth:110,textAlign:'right'}}>{(((item.appliedPrice ?? item.price ?? 0) * getQty(item))).toLocaleString()} VNĐ</div>
                </div>
              ))}
            </div>

            <div className="summary-line"><span>Tạm tính</span><span>{subtotal.toLocaleString()} VNĐ</span></div>
            <div className="summary-line"><span>Phí vận chuyển</span><span>{effectiveShippingFee === 0 ? "Miễn phí" : effectiveShippingFee.toLocaleString() + " VNĐ"}</span></div>
            <div className="summary-line"><span>Mã giảm giá (vận chuyển)</span><span>-{shippingVoucherDiscount.toLocaleString()} VNĐ</span></div>
            <div className="summary-line"><span>Mã giảm giá (đơn hàng)</span><span>-{cartVoucherDiscount.toLocaleString()} VNĐ</span></div>

            <div style={{marginTop:8,marginBottom:8}}>
              {shippingVoucher && (
                <div style={{marginBottom:6}}>
                  <div>Voucher vận chuyển: <strong>{shippingVoucher.name || shippingVoucher.id}</strong></div>
                  <div style={{fontSize:12,color:'#666'}}>{shippingVoucher.description}</div>
                  <button className="btn-secondary" onClick={()=>setSelectedVouchers(s=>({...s,shipping:null}))} style={{marginTop:6}}>Bỏ voucher vận chuyển</button>
                </div>
              )}
              {cartVoucher && (
                <div style={{marginBottom:6}}>
                  <div>Voucher đơn hàng: <strong>{cartVoucher.name || cartVoucher.id}</strong></div>
                  <div style={{fontSize:12,color:'#666'}}>{cartVoucher.description}</div>
                  <button className="btn-secondary" onClick={()=>setSelectedVouchers(s=>({...s,cart:null}))} style={{marginTop:6}}>Bỏ voucher đơn</button>
                </div>
              )}
              {!shippingVoucher && !cartVoucher && (
                <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
                  <button className="btn-secondary" onClick={()=>setVoucherModalOpen(true)}>Chọn voucher</button>
                  <div className="voucher-input">
                    <input placeholder="Nhập mã giảm giá" value={manualVoucherCode} onChange={e=>setManualVoucherCode(e.target.value)} />
                    <button className="apply-btn" onClick={async ()=>{
                      const code = (manualVoucherCode || '').trim();
                      if (!code) return alert('Nhập mã voucher');
                      try {
                        const { doc, getDoc } = await import('firebase/firestore');
                        const promoDoc = await getDoc(doc(db, 'promotions', code));
                        if (promoDoc.exists()) {
                          const v = { id: promoDoc.id, ...(promoDoc.data() as any) };
                          const cat = getVoucherCategory(v);
                          setSelectedVouchers(s=>({ ...s, [cat]: v }));
                          setManualVoucherCode('');
                          return;
                        }
                        const { collection, query, where, getDocs } = await import('firebase/firestore');
                        const q2 = query(collection(db,'promotions'), where('name','==',code));
                        const snap = await getDocs(q2);
                        if (!snap.empty) {
                          const d = snap.docs[0];
                          const v = { id: d.id, ...(d.data() as any) };
                          const cat = getVoucherCategory(v);
                          setSelectedVouchers(s=>({ ...s, [cat]: v }));
                          setManualVoucherCode('');
                          return;
                        }
                        alert('Không tìm thấy mã giảm giá hợp lệ');
                      } catch (err) {
                        console.error('apply manual voucher', err);
                        alert('Không thể áp dụng mã. Vui lòng thử lại.');
                      }
                    }}>Áp dụng</button>
                  </div>
                </div>
              )}
            </div>
            <div className="summary-total">
              <span>Tổng Thanh Toán</span>
              <span>{total.toLocaleString()} VNĐ</span>
            </div>

            <button className="btn-submit" disabled={isSubmitting} onClick={async ()=>{
              // basic validation + prevent double submit
              if (isSubmitting) return;
              if (!currentUser) { setShowLoginWarning(true); return; }
              if (!fullName || !phone || !address) { alert('Vui lòng điền tên, số điện thoại và địa chỉ'); return; }
              // Ensure shipping fee computed (no flat fee now) unless subtotal already qualifies for free shipping
              if (computedShippingFee === null && subtotal < FREE_SHIP_THRESHOLD) { alert('Vui lòng tính phí vận chuyển trước khi gửi đơn (nhấn nút "Tính phí vận chuyển").'); return; }
              // If BANK payment selected, ensure provider chosen
              if (paymentMethod === 'BANK' && (!selectedProvider || selectedProvider === 'none')) { alert('Vui lòng chọn hình thức chuyển khoản'); return; }
              setIsSubmitting(true);
              try {
                // Check if user is blocked in users collection
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && (userDocSnap.data() as any).isDeactivated === 'blocked') {
                  alert('Tài khoản của bạn đang bị chặn. Vui lòng liên hệ CSKH để được hỗ trợ.');
                  setIsSubmitting(false);
                  return;
                }

                // Validate selected vouchers against promotions collection before creating order
                const validatePromotion = async (v:any) => {
                  if (!v) return { valid: false };
                  try {
                    const pRef = doc(db, 'promotions', v.id);
                    const pSnap = await getDoc(pRef);
                    if (!pSnap.exists()) return { valid: false };
                    const data = pSnap.data() as any;
                    if (!data.active) return { valid: false };
                    const now = new Date();
                    if (data.startDate) {
                      const s = data.startDate.toDate ? data.startDate.toDate() : new Date(data.startDate);
                      if (now < s) return { valid: false };
                    }
                    if (data.endDate) {
                      const e = data.endDate.toDate ? data.endDate.toDate() : new Date(data.endDate);
                      if (now > e) return { valid: false };
                    }
                    if (data.minPurchase && subtotal < Number(data.minPurchase)) return { valid: false };
                    return { valid: true, data };
                  } catch (err) {
                    console.error('validatePromotion', err);
                    return { valid: false };
                  }
                };

                // validate selected vouchers
                const validatedCart = await validatePromotion(cartVoucher);
                const validatedShipping = await validatePromotion(shippingVoucher);
                if (cartVoucher && !validatedCart.valid) { alert('Voucher đơn hàng không hợp lệ hoặc đã hết hạn'); setIsSubmitting(false); return; }
                if (shippingVoucher && !validatedShipping.valid) { alert('Voucher vận chuyển không hợp lệ hoặc đã hết hạn'); setIsSubmitting(false); return; }

                // Create a minimal order first to obtain a server-generated unique id (Firestore doc id)
                const minimalOrder: any = {
                  userID: currentUser.uid,
                  customerName: fullName,
                  phone,
                  email,
                  address,
                  city,
                  district,
                  notes,
                  items: cartItems,
                  subtotal,
                  shippingFee: effectiveShippingFee,
                  voucherApplied: {
                    cart: cartVoucher ? { id: cartVoucher.id, name: cartVoucher.name, discountType: cartVoucher.discountType, discountValue: cartVoucher.discountValue } : null,
                    shipping: shippingVoucher ? { id: shippingVoucher.id, name: shippingVoucher.name, discountType: shippingVoucher.discountType, discountValue: shippingVoucher.discountValue, isFreeShip: shippingVoucher.isFreeShip } : null
                  },
                  discountSummary: {
                    cart: cartVoucher ? cartVoucherDiscount : 0,
                    shipping: shippingVoucher ? shippingVoucherDiscount : 0
                  },
                  total,
                  paymentMethod,
                  // lock the order for non-COD payment methods until reconciliation
                  locked: paymentMethod !== 'COD',
                  reconciled: false,
                  status: paymentMethod === 'COD' ? 'Chờ Xử Lý' : 'Chưa thanh toán',
                  createdAt: serverTimestamp(),
                };

                const docRef = await addDoc(collection(db,'orders'), minimalOrder);

                // Build a stable transfer note using the server-generated doc id
                const orderIdForCode = docRef.id || (`R${Date.now()}`);
                let rawName = fullName || 'khachhang';
                if (currentUser) {
                  try {
                    if (currentUser.displayName) rawName = String(currentUser.displayName);
                    else if (currentUser.email) rawName = String(currentUser.email).split('@')[0];
                  } catch (e) { /* ignore */ }
                }
                const transferNoteFinal = buildTransferNote(rawName || 'KHACHHANG', orderIdForCode);
                setLastTransferNote(transferNoteFinal);

                // Generate final QR if needed (use env-configured constants)
                let finalQr: string | null = qrImageUrl;
                if (paymentMethod === 'BANK') {
                  const MB_BIN = (import.meta as any).env?.VITE_MB_BIN || '970422';
                  const MB_ACCOUNT = (import.meta as any).env?.VITE_MB_ACCOUNT || '155186868';
                  const MB_OWNER = (import.meta as any).env?.VITE_MB_OWNER || 'NGUYENDAIQUOC';
                  const RECEIVER_PHONE = (import.meta as any).env?.VITE_RECEIVER_PHONE || '0931454176';

                  if (selectedProvider === 'bank' || selectedProvider === 'vnpay') {
                    finalQr = createBankQr({ bankBin: MB_BIN, accountNo: MB_ACCOUNT, amount: total, note: transferNoteFinal });
                  } else if (selectedProvider === 'momo') {
                    finalQr = createMomoQr({ phone: RECEIVER_PHONE, amount: total, note: transferNoteFinal });
                  } else if (selectedProvider === 'zalopay') {
                    finalQr = createZaloPayQr({ phone: RECEIVER_PHONE, amount: total, note: transferNoteFinal });
                  } else {
                    // fallback: encode plain bank info
                    const bankInfo = `NGAN HANG: MBBANK\nSTK: ${MB_ACCOUNT}\nCHU TK: ${MB_OWNER}\nSO TIEN: ${total}\nNOI DUNG: ${transferNoteFinal}`;
                    finalQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bankInfo)}`;
                  }
                }

                // Prepare final payment object
                const paymentObj = paymentMethod === 'BANK' ? { method: 'BANK', provider: selectedProvider, qrImageUrl: finalQr, proofUrls, transferStatus: proofUrls.length > 0 ? 'uploaded' : 'pending', transferNote: transferNoteFinal } : { method: paymentMethod, transferNote: transferNoteFinal };

                // Update the order document with final payment info and status
                await updateDoc(docRef, { payment: paymentObj, transferNote: transferNoteFinal, qrImageUrl: finalQr, status: 'Chờ Xử Lý' });

                // clear cart
                await clearCart();

                // navigate to confirmation page and pass orderId so OrderConfirm can load full details
                navigate(`/order-confirm?orderId=${docRef.id}`);
              } catch (err) {
                console.error('create order', err);
                alert('Không thể tạo đơn hàng. Vui lòng thử lại.');
                setIsSubmitting(false);
              }
            }}>{isSubmitting ? 'Đang gửi đơn...' : 'Hoàn tất đặt hàng'}</button>
          </div>
        </div>
      </div>

      <FloatingButtons />
      {voucherModalOpen && (
        <VoucherPicker subtotal={subtotal} onSelect={(v:any)=>{ const cat = getVoucherCategory(v); setSelectedVouchers(s=>({ ...s, [cat]: v })); setVoucherModalOpen(false); }} onClose={()=>setVoucherModalOpen(false)} />
      )}
      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để tiến hành thanh toán"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </div>
  );
}