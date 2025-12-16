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

  // simple templates (can be expanded) — updated to be meaningful
  const templates = [
    { id: 'tpl_stock', title: 'Hỏi tồn kho', text: 'Cho mình hỏi sản phẩm [tên sản phẩm] còn hàng không?' },
    { id: 'tpl_promo', title: 'Hỏi khuyến mãi', text: 'Có khuyến mãi cho sản phẩm [tên sản phẩm] không?' },
    { id: 'tpl_support', title: 'Yêu cầu tư vấn', text: 'Mình cần tư vấn thêm, vui lòng liên hệ nhân viên tư vấn.' }
  ];

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
        if (!auth.currentUser) {
          try { await signInAnonymously(auth); } catch (e) { 
            console.warn('Anonymous sign-in failed, chat may not work', e);
            return;
          }
        }
        const docRef = doc(db, 'chats', sessionId);
        unsub = onSnapshot(docRef, (snap) => {
          if (!snap.exists()) {
            setMessages([]);
            return;
          }
          const data = snap.data() as any;
          setMessages(Array.isArray(data.messages) ? data.messages : []);
          // scroll to bottom
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }, (err) => {
          console.warn('chat doc listen failed - permissions issue:', err.message);
          setMessages([]);
          // Don't throw error, just silently fail
        });
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
            setPendingOrdersCount(snap.size);
          }, (err) => {
            console.warn('orders notif listen failed', err.message);
            setPendingOrdersCount(0);
          });
        } else {
          setIsAdmin(false);
          setPendingOrdersCount(0);
          if (ordersUnsub) { ordersUnsub(); ordersUnsub = null; }
        }
      } catch (e:any) {
        console.warn('admin check failed', e?.message || e);
        setIsAdmin(false);
        setPendingOrdersCount(0);
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
      // ensure we have an auth session; anonymous sign-in if not
      if (!auth.currentUser) {
        try { await signInAnonymously(auth); } catch (e) { /* ignore */ }
      }
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
          await setDoc(chatDoc, {
            userId: auth.currentUser ? auth.currentUser.uid : sessionId,
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
        console.warn('Failed to write chats doc - permissions issue, chat may not work properly');
        // Không fallback nữa, chỉ log warning
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
        <div className="float-btn orders-btn" title="Đơn hàng mới" onClick={() => { window.location.href = '/admin/orders'; }}>
          🔔
          {pendingOrdersCount > 0 && <span className="orders-badge">{pendingOrdersCount}</span>}
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
