import React, { useState, useEffect } from "react";
// Import các icon cần thiết cho Social Links
import { Phone, ShoppingBag, Facebook, Instagram } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

// (Header helper components)

// Dữ liệu cho Dropdown "Xem thêm"
const moreMenuData = [
  { name: "Liên hệ", link: "/contact" },
  { name: "Blog", link: "/blog" },
  { name: "Về chúng tôi", link: "/about" },
  { name: "Câu chuyện", link: "/about/story" },
];

// ----------------------------------------------------------------------
// Component con: 1. Thanh Social Link (Dòng trên cùng)
// ----------------------------------------------------------------------

function TopSocialBar() {
  const socialLinks = [
    { name: "Hotline: 0912.345.678", icon: <Phone size={14} />, link: "tel:0912345678" },
    { name: "Shopee: HaiTuiMinhShop", icon: <ShoppingBag size={14} />, link: "https://shopee.vn/haituiminh" },
    { name: "Facebook", icon: <Facebook size={14} />, link: "https://facebook.com/haituiminh" },
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

  useEffect(() => {
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
        setUserRecord(null);
      }
    });
    return () => unsub();
  }, []);


  // Subscribe to cart documents for the current userID (user doc id should be the same as auth uid)
  useEffect(() => {
    let unsubCart: (() => void) | null = null;
    setCartLoading(true);
    if (currentUser) {
      try {
        const q = query(collection(db, 'cart'), where('userID', '==', currentUser.uid));
        unsubCart = onSnapshot(q, (snap) => {
          const items: any[] = [];
          snap.forEach((d) => {
            const data = d.data();
            if (Array.isArray(data.items)) items.push(...data.items);
          });
          setCartItems(items);
          setCartLoading(false);
        }, (err) => {
          console.error('cart onSnapshot error', err);
          setCartItems([]);
          setCartLoading(false);
        });
      } catch (err) {
        console.error('subscribe cart error', err);
        setCartItems([]);
        setCartLoading(false);
      }
    } else {
      // not logged in -> empty cart
      setCartItems([]);
      setCartLoading(false);
    }

    return () => { if (unsubCart) unsubCart(); };
  }, [currentUser]);

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

  return (
    <div className="main-header-wrapper">

      {/* 1. Dòng Social Links */}
      <TopSocialBar />

      <div className="header">
        {/* Class gốc: flex justify-between items-center p-4 */}
        <div className="header-container flex justify-between items-center p-4">

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
                    {!currentUser ? (
                      <>
                        <a href="/login">Đăng nhập</a>
                        <a href="/register">Đăng ký</a>
                      </>
                    ) : (
                      <>
                        <div className="user-dropdown-top" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                          <img src={userRecord?.profilePictureURL || ''} alt="avatar" style={{ width: 40, height: 40, borderRadius: 999 }} onError={(e:any)=>{ e.currentTarget.style.display='none'; }} />
                          <div>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{(userRecord?.fullName || currentUser.displayName || currentUser.email || '').split(' ').pop() || 'User'}</span>
                              <span style={{ width: 16, height: 16, borderRadius: 4, background: vipColor(userRecord?.vip), display: 'inline-block' }} title={userRecord?.vip || ''}></span>
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{userRecord?.email || currentUser.email}</div>
                          </div>
                        </div>
                        <a href="/profile">Thông tin cá nhân</a>
                        <a href="/wishlist">❤️ Danh mục yêu thích</a>
                        <a href="/orders">Đơn mua hàng</a>
                        <a href="/coupons">Mã giảm giá</a>
                        <a className="user-logout" href="#" onClick={(e) => { e.preventDefault(); auth.signOut(); }}>Đăng xuất</a>
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

                    <button className="cart-checkout-button">
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