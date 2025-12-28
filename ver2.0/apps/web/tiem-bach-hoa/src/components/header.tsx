import { useState, useEffect, useCallback } from "react";
// Import các icon cần thiết cho Social Links
import { Phone, ShoppingBag, Facebook, Instagram } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { showSuccess } from '../utils/toast';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// (Header helper components)

// Dữ liệu cho Dropdown "Xem thêm"
const moreMenuData = [
  { name: "Liên hệ", link: "/contact" },
  { name: "Blog", link: "/blog" },
  { name: "Về chúng tôi", link: "/about-us" },
  { name: "Câu chuyện", link: "/story" },
];

// ----------------------------------------------------------------------
// Component con: 1. Thanh Social Link (Dòng trên cùng)
// ----------------------------------------------------------------------

function TopSocialBar() {
  const socialLinks = [
    { name: "Hotline: 0931.454.176", icon: <Phone size={14} />, link: "tel:0912345678" },
    { name: "Shopee: HaiTuiMinhShop", icon: <ShoppingBag size={14} />, link: "https://shopee.vn/haituiminh" },
    { name: "Facebook", icon: <Facebook size={14} />, link: "https://www.facebook.com/profile.php?id=61576489061227" },
    { name: "Instagram", icon: <Instagram size={14} />, link: "https://instagram.com/haituiminh" },
  ];

  return (
    <div className="top-social-bar">
      <div className="top-social-container">
        <div className="social-links-group">
          {socialLinks.map((item, index) => (
            <a
              key={index}
              href={item.link}
              className="social-link-item"
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.icon}
              <span className="social-link-text">{item.name}</span>
            </a>
          ))}
        </div>
        <div className="top-greeting">
          👋 Chào mừng bạn đến với Tiệm Bách Hóa Hai Tụi Mình!
        </div>
      </div>
    </div>
  );
}


// ----------------------------------------------------------------------
// Component con: 2. Dòng thông báo chạy (Marquee)
// ----------------------------------------------------------------------

function AnnouncementMarquee() {
  const announcementText = "🎉 SẮM THẢ GA, KHÔNG LO VỀ GIÁ! Miễn phí vận chuyển cho đơn hàng từ 500.000đ. Giảm thêm 10% khi đăng ký thành viên VIP. 🚀";

  return (
    <div className="announcement-marquee-wrapper">
      <div className="announcement-marquee-content">
        <div className="marquee"><div className="marquee-track">{announcementText}</div></div>
      </div>
    </div>
  );
}


// ----------------------------------------------------------------------
// Component con: Mega Menu cho Danh mục sản phẩm
// ----------------------------------------------------------------------
// Mega menu removed (not used in header)

// ----------------------------------------------------------------------
// Component Chính: Header
// ----------------------------------------------------------------------
export default function Header() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  // State cho More Menu
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

  // Cart state will be loaded live from Firestore `cart` collection (queried by userID)
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartLoading, setCartLoading] = useState<boolean>(true);

  const cartTotalCount = cartItems.reduce((t, i) => t + (i.qty || 1), 0);
  const cartTotalPrice = cartItems.reduce((t, i) => t + ((i.qty || 1) * (i.price || 0)), 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRecord, setUserRecord] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [monthlySpend, setMonthlySpend] = useState<number>(0);
  const [vipRank, setVipRank] = useState<string>('Thường');
  const [vipProgressPercent, setVipProgressPercent] = useState<number>(0);

  const RANKS: { name: string; threshold: number; discount: number }[] = [
    { name: 'Thường', threshold: 0, discount: 0 },
    { name: 'Đồng', threshold: 500000, discount: 1 },
    { name: 'Bạc', threshold: 1000000, discount: 2.5 },
    { name: 'Vàng', threshold: 2000000, discount: 3.5 },
    { name: 'Bạch kim', threshold: 3000000, discount: 5 },
    { name: 'Kim cương', threshold: 5000000, discount: 7.5 },
  ];

  const getRankFor = (amount: number) => {
    let current = RANKS[0];
    for (let i = 0; i < RANKS.length; i++) {
      if (amount >= RANKS[i].threshold) current = RANKS[i];
      else break;
    }
    const next = RANKS.find(r => r.threshold > current.threshold) || RANKS[RANKS.length - 1];
    const pct = next.threshold === current.threshold ? 100 : Math.min(100, Math.round((amount - current.threshold) / (next.threshold - current.threshold) * 100));
    return { current: current.name, next: next.name, percent: pct, nextThreshold: next.threshold };
  };

  useEffect(() => {
    // Restore user from localStorage first (instant)
    try {
      const saved = localStorage.getItem('tiem_user');
      if (saved) {
        const userData = JSON.parse(saved);
        // Create a partial User object from saved data for instant UI update
        // This will be verified by onAuthStateChanged below
        setCurrentUser(userData as any);
        setAuthLoading(false);
      }
    } catch (e) {
      console.warn('restore user from localStorage failed', e);
    }

    // Then verify with Firebase Auth (async)
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u);
      if (u) {
        try {
          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) setUserRecord(snap.data());
          else setUserRecord(null);
        } catch (err) {
          console.error('load user record error', err);
          setUserRecord(null);
        }
      } else {
        // User logged out - clear localStorage
        try {
          localStorage.removeItem('tiem_user');
        } catch (e) {
          console.warn('clear tiem_user from localStorage failed', e);
        }
        setUserRecord(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Suppress known extension spam/errors from polluting console (MetaMask/Solana inpage scripts)
  useEffect(() => {
    const onUnhandled = (ev: PromiseRejectionEvent) => {
      try {
        const reason = (ev && (ev.reason || ev.detail || ev)) as any;
        const text = String(reason && (reason.message || reason.stack || reason)).toLowerCase();
        if (text.includes('metamask') || text.includes('inpage') || text.includes('solana') || text.includes('phantom') || text.includes('solanaaction')) {
          // suppress default logging for extension-related noise
          ev.preventDefault();
          console.warn('Suppressed extension error:', text.split('\n')[0]);
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('unhandledrejection', onUnhandled as EventListener);
    return () => window.removeEventListener('unhandledrejection', onUnhandled as EventListener);
  }, []);


  // Load cart using polling approach (avoids onSnapshot permission issues)
  const loadCart = useCallback(async () => {
    if (!currentUser || currentUser.isAnonymous) {
      setCartItems([]);
      setCartLoading(false);
      return;
    }

    try {
      const cartRef = doc(db, 'cart', currentUser.uid);
      const cartSnap = await getDoc(cartRef);
      
      if (cartSnap.exists()) {
        const data = cartSnap.data();
        const rawItems = Array.isArray(data.items) ? data.items : [];
        // Normalize items so older docs using `quantity` or different price keys still work
        const items = rawItems.map((it: any) => {
          const qty = Number(it.qty ?? it.quantity ?? 1) || 1;
          const price = Number(it.price ?? it.newPrice ?? it.appliedPrice ?? 0) || 0;
          return {
            ...it,
            qty,
            price,
          };
        });
        setCartItems(items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('[Header] Error loading cart:', error, { currentUser: currentUser?.uid });
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  }, [currentUser]);

  // Load cart when user changes
  useEffect(() => {
    setCartLoading(true);
    loadCart();
  }, [currentUser, loadCart]);

  // Poll cart every 2 seconds when user is logged in
  useEffect(() => {
    if (!currentUser || currentUser.isAnonymous) return;

    const interval = setInterval(() => {
      loadCart();
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser, loadCart]);

  // Listen for explicit cart-updated events (dispatched after addToCart)
  useEffect(() => {
    const onCartUpdated = (e: any) => {
      // If event is for this user or no detail, just reload
      try {
        const uid = e?.detail?.uid;
        if (!uid || (currentUser && uid === currentUser.uid)) {
          loadCart();
        }
      } catch (err) {
        loadCart();
      }
    };

    window.addEventListener('cart-updated', onCartUpdated as EventListener);
    return () => window.removeEventListener('cart-updated', onCartUpdated as EventListener);
  }, [currentUser, loadCart]);


  // compute monthly spend for current user
  useEffect(() => {
    const compute = async () => {
      if (!currentUser) {
        setMonthlySpend(0);
        setVipRank('Thường');
        setVipProgressPercent(0);
        return;
      }
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const q = query(collection(db, 'orders'), where('userID', '==', currentUser.uid), where('createdAt', '>=', start));
        const snap = await getDocs(q);
        let sum = 0;
        snap.forEach(d => {
          const data: any = d.data();
          const n = Number(data.total || data.amount || data.subtotal || 0) || 0;
          sum += n;
        });
        setMonthlySpend(sum);
        const r = getRankFor(sum);
        setVipRank(r.current);
        setVipProgressPercent(r.percent);
      } catch (e) {
        console.error('compute monthly spend error', e);
      }
    };
    compute();
  }, [currentUser, userRecord]);

  const vipColor = (vip: string | undefined) => {
    if (!vip) return '#111827';
    const v = String(vip).toLowerCase();
    if (v.includes('đồng') || v.includes('dong')) return '#8B5A2B';
    if (v.includes('bạc') || v.includes('bac')) return '#9CA3AF';
    if (v.includes('vàng') || v.includes('vang')) return '#D4AF37';
    if (v.includes('bạch') || v.includes('bach')) return '#E5E4E2';
    if (v.includes('kim') || v.includes('diamond')) return '#0EA5E9';
    return '#111827';
  };

  // Prefer values from Firestore users document (userRecord), fallback to auth user
  const displayName = userRecord?.fullName || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  const avatarUrl = userRecord?.profilePictureURL || (currentUser as any)?.photoURL || '';
  const emailForDisplay = userRecord?.email || currentUser?.email || '';

  return (
    <div className="main-header-wrapper">
      <Toaster />
      {/* 1. Dòng Social Links */}
      <TopSocialBar />

      <div className="header">
        {/* Class gốc: flex justify-between items-center p-4 */}
        <div className="header-container justify-between items-center p-4">

          {/* LOGO */}
          <a href="/" className="header-logo-text font-bold text-lg">
            Tiệm Bách Hóa Hai Tụi Mình
          </a>

          {/* MENU */}
          <div className="header-menu flex gap-6">
            <a href="/" className="menu-item">Trang chủ</a>

            {/* 1. DANH MỤC SẢN PHẨM (MEGA MENU) */}
            {/* <div 
                            className="menu-item menu-dropdown-trigger has-indicator"
                            onMouseEnter={() => setIsMegaMenuOpen(true)}
                            onMouseLeave={() => setIsMegaMenuOpen(false)}
                        >
                            Danh mục sản phẩm <span className="dropdown-indicator">▼</span>
                            {isMegaMenuOpen && <MegaMenu />}
                        </div> */}

            <a href="/categories">Danh mục</a>
            <a href="/products" className="menu-item">Sản phẩm</a>
            {/* <a href="/combo" className="menu-item">Ưu đãi</a> */}
            <a href="/vip" className="menu-item">VIP</a>

            {/* 2. XEM THÊM (DROPDOWN ĐƠN) */}
            <div
              className="menu-item menu-dropdown-trigger has-indicator"
              onMouseEnter={() => setIsMoreDropdownOpen(true)}
              onMouseLeave={() => setIsMoreDropdownOpen(false)}
            >
              Xem thêm <span className="dropdown-indicator">▼</span>
              {isMoreDropdownOpen && (
                <div className="simple-dropdown more-menu">
                  {moreMenuData.map((item, index) => (
                    <a key={index} href={item.link} className="dropdown-link">
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEARCH + USER + CART (KHÔI PHỤC CẤU TRÚC GỐC) */}
          <div className="header-icons flex items-center gap-4">

            {/* SEARCH */}
            <div className="search-field">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                id="header-search"
                name="search"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>

            {/* USER */}
            <div
              className="relative"
              onMouseEnter={() => setIsUserDropdownOpen(true)}
              onMouseLeave={() => setIsUserDropdownOpen(false)}
            >
              <span className="user-icon">👤</span>

              {isUserDropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-list">
                    {authLoading ? (
                      <div style={{ padding: 12, textAlign: 'center', color: '#6b7280' }}>Đang tải...</div>
                    ) : (!currentUser || currentUser.isAnonymous) ? (
                      <>
                        <a href="/login">Đăng nhập</a>
                        <a href="/register">Đăng ký</a>
                      </>
                    ) : (
                      <>
                        <div className="user-dropdown-top" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                          {userRecord?.profilePictureURL ? (
                            <img src={userRecord.profilePictureURL} alt="avatar" style={{ width: 40, height: 40, borderRadius: 999 }} onError={(e:any)=>{ e.currentTarget.style.display='none'; }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 999, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{displayName}</span>
                              <span style={{ width: 16, height: 16, borderRadius: 4, background: vipColor(userRecord?.vip), display: 'inline-block' }} title={userRecord?.vip || ''}></span>
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{emailForDisplay}</div>
                            {/* VIP progress summary */}
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontSize: 12, color: '#374151' }}>Chi tiêu tháng: <strong>{formatCurrency(monthlySpend || 0)}</strong></div>
                              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 8, marginTop: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${vipProgressPercent}%`, height: '100%', background: vipColor(userRecord?.vip), transition: 'width 400ms ease' }} />
                              </div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{vipRank} • {vipProgressPercent}%</span>
                                <a href="/vip" style={{ fontSize: 12, color: '#2563eb' }}>Tìm hiểu thêm</a>
                              </div>
                            </div>
                          </div>
                        </div>
                        <a href="/profile">Thông tin cá nhân</a>
                        <a href="/wish-list"> Danh mục yêu thích</a>
                        <a href="/order-history">Đơn mua hàng</a>
                        <a href="/coupons">Mã giảm giá</a>
                        <a className="user-logout" href="#" onClick={(e) => { 
                          e.preventDefault(); 
                          try {
                            localStorage.removeItem('tiem_user');
                            localStorage.removeItem('remember_until');
                          } catch (e) {
                            console.warn('clear localStorage failed', e);
                          }
                          auth.signOut(); 
                          showSuccess('Đăng xuất thành công!');
                          setTimeout(() => window.location.reload(), 800);
                        }}>Đăng xuất</a>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CART */}
            <div
              className="relative"
              onMouseEnter={() => setIsCartDropdownOpen(true)}
              onMouseLeave={() => setIsCartDropdownOpen(false)}
            >
              <span className="cart-dropdown">
                🛒
                {cartTotalCount > 0 && (
                  <span className="cart-count">{cartTotalCount}</span>
                )}
              </span>

              {isCartDropdownOpen && (
                <div className="cart-dropdown-menu">
                  <div className="cart-header">
                    Giỏ hàng ({cartTotalCount} SP)
                  </div>
                  <div className="cart-dropdown-list">
                    {cartLoading ? (
                      <div style={{ padding: 12 }}>Đang tải giỏ hàng...</div>
                    ) : cartItems.length === 0 ? (
                      <div className="cart-empty" style={{ padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 28 }}>🛒</div>
                        <div>Giỏ hàng trống</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Bạn chưa có sản phẩm nào trong giỏ.</div>
                      </div>
                    ) : (
                      cartItems.map((item, index) => (
                        <div key={index} className="cart-items">
                          <div className="cart-content">
                            {item.image ? (
                              <img src={item.image} alt={item.name || 'item'} className="cart-img" />
                            ) : (
                              <div className="cart-img" style={{ background: '#f3f4f6', width: 48, height: 48, display: 'inline-block' }}>📦</div>
                            )}
                            <div>
                              <div className="cart-name">{item.name || 'Sản phẩm'}</div>
                              <div className="cart-price">
                                SL: {item.qty || 1} x {formatCurrency(item.price || 0)}
                              </div>
                            </div>
                          </div>
                          <span className="cart-total">
                            {formatCurrency((item.qty || 1) * (item.price || 0))}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="cart-footer">
                    <div className="cart-totalprice">
                      <span>Tổng cộng:</span>
                      <span className="cart-totalprice-value">
                        {formatCurrency(cartTotalPrice)}
                      </span>
                    </div>

                    <button 
                      className="cart-checkout-button"
                      onClick={() => navigate('/cart')}
                    >
                      Xem Giỏ Hàng & Thanh Toán
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>


    {/* 2. Dòng thông báo chạy */ }
    < AnnouncementMarquee />
    </div >
  );
}