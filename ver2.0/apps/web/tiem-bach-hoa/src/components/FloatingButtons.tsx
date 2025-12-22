import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, updateDoc, arrayUnion, serverTimestamp, setDoc, addDoc, query, where } from "firebase/firestore";

export default function FloatingButtons() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [showOrdersPanel, setShowOrdersPanel] = useState(false);

  // simple templates (can be expanded) — updated to be meaningful
  const templates = [
    { id: 'tpl_stock', title: 'Hỏi tồn kho', text: 'Cho mình hỏi sản phẩm [tên sản phẩm] còn hàng không?' },
    { id: 'tpl_promo', title: 'Hỏi khuyến mãi', text: 'Có khuyến mãi cho sản phẩm [tên sản phẩm] không?' },
    { id: 'tpl_support', title: 'Yêu cầu tư vấn', text: 'Mình cần tư vấn thêm, vui lòng liên hệ nhân viên tư vấn.' }
  ];

  const formatCurrency = (v: number) =>
    Number(v || 0).toLocaleString('vi-VN') + ' đ';

  // Hiện nút Back to Top khi scroll qua Hero
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight =
        document.querySelector(".hero-wrapper")?.clientHeight || 500;

      setShowBackToTop(window.scrollY > heroHeight - 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // create or load a chat session id in localStorage so history persists for the visitor
  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = `session-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // listen to the single chat document for this session — ensure auth exists before listening
  useEffect(() => {
    if (!sessionId) return;
    let unsub: (() => void) | null = null;

    const startListen = async () => {
      try {
        const uid = auth.currentUser ? auth.currentUser.uid : null;
        // Try to read the existing chat doc. If it exists but is owned by a different id
        // (e.g., legacy sessionId stored as userId), we avoid listening to that doc to prevent permission errors.
        const docRef = doc(db, 'chats', sessionId);
        try {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data() as any;
            // If the doc's owner matches our auth uid, we can safely listen.
            if ((uid && (data.userId === uid || data.userId == null)) || data.isPublic === true) {
              unsub = onSnapshot(docRef, (s) => {
                if (!s.exists()) { setMessages([]); return; }
                const d = s.data() as any;
                setMessages(Array.isArray(d.messages) ? d.messages : []);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
              }, (err) => {
                console.warn('chat doc listen failed -', err?.message || err);
                setMessages([]);
              });
            } else {
              // Ownership mismatch: create a new chat doc owned by this auth user and persist its id.
              const newId = uid ? `chat-${uid}-${Date.now()}` : `chat-public-${Date.now()}`;
              const newRef = doc(db, 'chats', newId);
              try {
                await setDoc(newRef, {
                  userId: uid || sessionId,
                  participants: uid ? [uid] : [],
                  isPublic: uid ? false : true,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  messages: []
                });
                localStorage.setItem('chat_session_id', newId);
                setSessionId(newId);
                // start listening to the new doc
                unsub = onSnapshot(newRef, (s) => {
                  if (!s.exists()) { setMessages([]); return; }
                  const d = s.data() as any;
                  setMessages(Array.isArray(d.messages) ? d.messages : []);
                  setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                }, (err) => {
                  console.warn('chat new doc listen failed -', err?.message || err);
                  setMessages([]);
                });
              } catch (inner) {
                // If creating new doc fails (rules), just skip listening.
                console.warn('Could not create personal chat doc; chat disabled');
                setMessages([]);
              }
            }
          } else {
            // No existing doc; create one owned by current auth uid
            try {
              await setDoc(docRef, {
                userId: uid || sessionId,
                participants: uid ? [uid] : [],
                isPublic: uid ? false : true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                messages: []
              });
              unsub = onSnapshot(docRef, (s) => {
                if (!s.exists()) { setMessages([]); return; }
                const d = s.data() as any;
                setMessages(Array.isArray(d.messages) ? d.messages : []);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
              }, (err) => {
                console.warn('chat doc listen failed -', err?.message || err);
                setMessages([]);
              });
            } catch (createErr: any) {
              console.warn('Failed to create chat doc (permissions?)', createErr?.message || createErr);
              setMessages([]);
            }
          }
        } catch (gErr:any) {
          console.warn('Failed to access chat doc (permissions or network)');
          setMessages([]);
        }
      } catch (e:any) {
        console.warn('startListen error', e?.message || e);
        setMessages([]);
      }
    };

    startListen();
    return () => { if (unsub) unsub(); };
  }, [sessionId]);

  // Detect admin user and start listening to pending orders for notification badge
  useEffect(() => {
    let ordersUnsub: (() => void) | null = null;
    const offAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setPendingOrdersCount(0);
        setPendingOrders([]);
        setShowOrdersPanel(false);
        if (ordersUnsub) { ordersUnsub(); ordersUnsub = null; }
        return;
      }

      try {
        // Check if an admin doc exists for this uid
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
          // listen to orders with status 'Chờ Xử Lý' (pending)
          const q = query(collection(db, 'orders'), where('status', '==', 'Chờ Xử Lý'));
          ordersUnsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => {
              const data = d.data() as any;
              return {
                id: d.id,
                customer: data.customerName || data.customer || data.userName || data.name || 'Khách lẻ',
                total: Number(data.total || data.amount || 0),
                createdAt: data.createdAt,
                status: data.status || 'Chờ Xử Lý'
              };
            }).sort((a, b) => {
              const da = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Number(a.createdAt || 0);
              const db = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Number(b.createdAt || 0);
              return db - da;
            }).slice(0, 5);
            setPendingOrders(list);
            setPendingOrdersCount(snap.size);
          }, (err) => {
            console.warn('orders notif listen failed', err.message);
            setPendingOrdersCount(0);
            setPendingOrders([]);
          });
        } else {
          setIsAdmin(false);
          setPendingOrdersCount(0);
          setPendingOrders([]);
          setShowOrdersPanel(false);
          if (ordersUnsub) { ordersUnsub(); ordersUnsub = null; }
        }
      } catch (e:any) {
        console.warn('admin check failed', e?.message || e);
        setIsAdmin(false);
        setPendingOrdersCount(0);
        setPendingOrders([]);
        setShowOrdersPanel(false);
      }
    });

    return () => {
      if (ordersUnsub) ordersUnsub();
      offAuth();
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text || !sessionId) return;
    try {
      // append message into single `chats/{sessionId}` document (messages array)
      const chatDoc = doc(db, 'chats', sessionId);
      const msgId = `m-${Date.now()}-${Math.floor(Math.random()*100000)}`;
      const messageObj = {
        id: msgId,
        role: 'customer',
        message: text,
        createdAt: serverTimestamp(),
        unread: true
      };

      try {
        const existing = await getDoc(chatDoc);
        if (!existing.exists()) {
          // create a new chat document tied to this auth.uid
          const uid2 = auth.currentUser ? auth.currentUser.uid : sessionId;
          await setDoc(chatDoc, {
            userId: uid2,
            participants: uid2 ? [uid2] : [],
            name: (auth.currentUser && (auth.currentUser as any).displayName) || 'Khách',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            messages: [messageObj],
            hasUnread: true
          });
        } else {
          await updateDoc(chatDoc, {
            messages: arrayUnion(messageObj),
            hasUnread: true,
            updatedAt: serverTimestamp()
          });
        }
      } catch (err:any) {
        // Silently fail if chat permissions not available
      }
      setInput('');
    } catch (e:any) {
      console.error('sendMessage failed', e);
      alert('Gửi tin nhắn thất bại: ' + (e.message || ''));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const t = input.trim();
      if (t) sendMessage(t);
    }
  };

  const sendTemplate = async (tpl: {id:string,title:string,text:string}) => {
    // support template opens modal
    if (tpl.id === 'tpl_support') {
      setShowSupportModal(true);
      return;
    }
    // allow filling placeholders via prompt
    let text = tpl.text;
    if (tpl.text.includes('[tên sản phẩm]')) {
      const name = window.prompt('Nhập tên sản phẩm:', '');
      if (!name) return;
      text = text.replace('[tên sản phẩm]', name);
    }
    // send
    await sendMessage(text);
  };

  const submitSupportRequest = async () => {
    if (!supportName && !supportPhone && !supportMsg) return;
    const composed = `Yêu cầu tư vấn: ${supportMsg} - ${supportName || ''} ${supportPhone || ''}`;
    try {
      await addDoc(collection(db, 'support_requests'), {
        name: supportName,
        phone: supportPhone,
        message: supportMsg,
        threadId: sessionId,
        status: 'new',
        createdAt: serverTimestamp()
      });
      // also send into chat thread for visibility
      await sendMessage(composed + ' (YÊU CẦU_TƯ_VẤN)');
      setShowSupportModal(false);
      setSupportName(''); setSupportPhone(''); setSupportMsg('');
    } catch (e:any) {
      console.error('submitSupportRequest failed', e);
      alert('Gửi yêu cầu thất bại: ' + (e.message || ''));
    }
  };

  return (
    <div className="floating-buttons">

      {/* BACK TO TOP */}
      {showBackToTop && (
        <div
          className="float-btn backtotop"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ⬆
        </div>
      )}

      {/* ZALO */}
      <a
        href="https://zalo.me/0931454176"
        target="_blank"
        className="float-btn zalo"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
          alt="Zalo"
        />
      </a>

      {/* MESSENGER */}
      <a
        href="https://m.me/61576489061227"
        target="_blank"
        className="float-btn messenger"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/63/Facebook_Messenger_logo_2025.svg"
          alt="Messenger"
        />
      </a>

      {/* ORDERS NOTIFICATION (admins only) */}
      {isAdmin && (
        <div style={{ position: 'relative' }}>
          <div
            className="float-btn orders-btn"
            title="Đơn chờ xử lý"
            aria-label="Thông báo đơn hàng mới"
            onClick={() => setShowOrdersPanel((p) => !p)}
          >
            🔔
            {pendingOrdersCount > 0 && <span className="orders-badge">{pendingOrdersCount}</span>}
          </div>
          {showOrdersPanel && (
            <div className="orders-panel">
              <div className="orders-panel__header">
                <div>
                  <strong>Đơn chờ xử lý</strong>
                  <div className="orders-panel__sub">Hiển thị tối đa 5 đơn mới nhất</div>
                </div>
                <button className="orders-panel__link" onClick={() => (window.location.href = '/admin/orders')}>
                  Mở trang
                </button>
              </div>
              {pendingOrders.length === 0 ? (
                <div className="orders-panel__empty">Chưa có đơn chờ xử lý</div>
              ) : (
                <ul className="orders-panel__list">
                  {pendingOrders.map((o) => {
                    const ts = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : Number(o.createdAt || 0);
                    const timeText = ts ? new Date(ts).toLocaleString('vi-VN') : '';
                    return (
                      <li key={o.id}>
                        <div className="orders-panel__row">
                          <div>
                            <div className="orders-panel__title">#{o.id}</div>
                            <div className="orders-panel__meta">{o.customer} · {o.status}</div>
                            {timeText && <div className="orders-panel__meta">{timeText}</div>}
                          </div>
                          <div className="orders-panel__total">{formatCurrency(o.total)}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* CHATBOT */}
      <div className="chatbot-wrapper">
        <span className="chatbot-tooltip">Chat với Chat Bot</span>

        <div
          className="float-btn chatbot-btn"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          💬
        </div>

        {isChatOpen && (
              <div className="chatbot-window">
                <div className="chatbot-header">
                  <span>Chat với Hai Tụi Mình</span>
                  <button onClick={() => setIsChatOpen(false)}>✖</button>
                </div>

                <div className="chatbot-body">
                  <div style={{maxHeight: '40vh', overflow: 'auto', paddingRight: 8}}>
                    {messages.length === 0 && (
                      <div className="chatbot-message bot">Xin chào 👋 Bạn muốn tìm sản phẩm nào ạ?</div>
                    )}
                    {messages.map(m => (
                      <div key={m.id} className={`chatbot-message ${m.role === 'bot' ? 'bot' : m.role === 'admin' ? 'admin' : 'user'}`} style={{whiteSpace:'pre-wrap'}}>
                        {m.message}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* templates area */}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
                    {templates.map(t => (
                      <button key={t.id} onClick={() => sendTemplate(t)} style={{padding:'6px 8px',borderRadius:6,border:'1px solid #ddd',background:'#fff'}}>{t.title}</button>
                    ))}
                  </div>

                  {/* support modal */}
                  {showSupportModal && (
                    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:99999}}>
                      <div style={{background:'#fff',padding:16,borderRadius:8,width:320,boxShadow:'0 8px 30px rgba(0,0,0,.3)'}}>
                        <h4 style={{marginTop:0}}>Yêu cầu tư vấn</h4>
                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                          <input placeholder="Họ và tên" value={supportName} onChange={e=>setSupportName(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid #ddd'}} />
                          <input placeholder="Số điện thoại" value={supportPhone} onChange={e=>setSupportPhone(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid #ddd'}} />
                          <textarea placeholder="Nội dung" value={supportMsg} onChange={e=>setSupportMsg(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid #ddd'}} />
                          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                            <button onClick={()=>setShowSupportModal(false)} style={{padding:'6px 10px',borderRadius:6}}>Hủy</button>
                            <button onClick={submitSupportRequest} style={{padding:'6px 10px',borderRadius:6,background:'#C75F4B',color:'#fff',border:'none'}}>Gửi yêu cầu</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="chatbot-input-wrapper">
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown} className="chatbot-input" placeholder="Nhập tin nhắn..." />
                  <button className="chatbot-send" onClick={() => { const t = input.trim(); if (t) sendMessage(t); }}>Gửi</button>
                </div>
              </div>
        )}
      </div>
    </div>
  );
}
