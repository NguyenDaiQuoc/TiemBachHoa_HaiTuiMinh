import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, arrayUnion, getDocs, limit } from 'firebase/firestore';
import { adminDb as db } from '../../firebase';
import { showSuccess, showError } from '../../utils/toast';

type NotificationItem = {
    id: string;
    type: 'low_stock' | 'order' | 'chat';
    title: string;
    body?: string;
    meta?: any;
};

export default function AdminNotifications() {
    // which panel is open: 'none'|'warehouse'|'orders'|'chat'
    const [openPanel, setOpenPanel] = useState<'none' | 'warehouse' | 'orders' | 'chat'>('none');
    const [lowStock, setLowStock] = useState<NotificationItem[]>([]);
    const [orders, setOrders] = useState<NotificationItem[]>([]);
    const [chats, setChats] = useState<NotificationItem[]>([]);
        const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
        const [selectedThreadName, setSelectedThreadName] = useState<string | null>(null);
        const [threadMessages, setThreadMessages] = useState<any[]>([]);
        const [messageInput, setMessageInput] = useState('');
    // loading state removed (not used)
    const [read, setRead] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let unsubWarehouse: (() => void) | null = null;
        let unsubOrders: (() => void) | null = null;
        let unsubChats: (() => void) | null = null;

        // Warehouse listener - sử dụng getDocs thay vì onSnapshot để tránh lỗi internal assertion
        const fetchLowStock = async () => {
            try {
                const q1 = query(collection(db, 'warehouse'), orderBy('stock', 'asc'), limit(20));
                const snap = await getDocs(q1);
                const items: NotificationItem[] = snap.docs
                    .filter(d => ((d.data() as any).stock ?? 0) <= 5)
                    .map(d => ({
                        id: `w-${d.id}`,
                        type: 'low_stock',
                        title: (d.data() as any).productName || d.id,
                        body: `Tồn: ${(d.data() as any).stock ?? 0}`,
                        meta: { docId: d.id, ...d.data() }
                    }));
                setLowStock(items);
            } catch (e: any) {
                console.warn('Low stock fetch failed', e);
                setLowStock([]);
            }
        };
        fetchLowStock();
        const warehouseInterval = setInterval(fetchLowStock, 30000); // Refresh every 30s

        // Orders listener - sử dụng getDocs
        const fetchOrders = async () => {
            try {
                const q2 = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(20));
                const snap = await getDocs(q2);
                const now = Date.now();
                const items: NotificationItem[] = snap.docs.map(d => ({
                    id: `o-${d.id}`,
                    type: 'order',
                    title: `Đơn hàng ${d.id}`,
                    body: JSON.stringify((d.data() as any).items || {}).slice(0, 200),
                    meta: { docId: d.id, ...d.data() }
                }));
                // Only include recent orders (last 48h) AND ensure these are user-placed orders (have customer info)
                setOrders(items.filter(i => {
                    const data = i.meta || {};
                    const c = data.createdAt;
                    const t = (c && c.toDate) ? c.toDate().getTime() : (typeof c === 'number' ? c : 0);
                    const recent = !c || (now - t) < 1000 * 60 * 60 * 24 * 2;
                    // Heuristic: consider it a user-placed order if it has items and any customer identifier
                    const hasCustomer = Array.isArray(data.items) && data.items.length > 0 && (data.userId || data.customerId || data.customerName || data.shippingAddress || data.phone);
                    return recent && hasCustomer;
                }));
            } catch (e: any) {
                console.warn('Orders fetch failed', e);
                setOrders([]);
            }
        };
        fetchOrders();
        const ordersInterval = setInterval(fetchOrders, 30000); // Refresh every 30s

        // Chats listener - sử dụng getDocs
        const fetchChats = async () => {
            try {
                const q3 = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'), limit(20));
                const snap = await getDocs(q3);
                const items: NotificationItem[] = snap.docs
                    .filter(d => (d.data() as any).hasUnread === true)
                    .map(d => ({
                        id: `c-${d.id}`,
                        type: 'chat',
                        title: (d.data() as any).name || `Khách ${d.id}`,
                        body: ((d.data() as any).messages || []).slice(-1)[0]?.message || '',
                        meta: { docId: d.id, ...d.data() }
                    }));
                setChats(items);
            } catch (e: any) {
                console.warn('Chats fetch failed', e);
                setChats([]);
            }
        };
        fetchChats();
        const chatsInterval = setInterval(fetchChats, 30000); // Refresh every 30s


        return () => {
            clearInterval(warehouseInterval);
            clearInterval(ordersInterval);
            clearInterval(chatsInterval);
        };
    }, []);

    const unreadWarehouse = lowStock.filter(i => !read[i.id]).length;
    const unreadOrders = orders.filter(i => !read[i.id]).length;
    const unreadChats = chats.filter(i => !read[i.id]).length;

    const markRead = (id: string) => {
        setRead(prev => ({ ...prev, [id]: true }));
        // Persist chat read state in Firestore for chat messages (ids prefixed with c-)
        if (id.startsWith('c-')) {
            const docId = id.replace(/^c-/, '');
            try {
                const d = doc(db, 'chat_messages', docId);
                updateDoc(d, { unread: false }).catch(() => null);
            } catch (e) {
                // ignore write errors (permissions may block)
            }
        }
        showSuccess('Đã đánh dấu đã đọc');
    };

    const openChat = (item: NotificationItem) => {
            // Open the chat thread for this user
            console.log('Open chat for', item);
            showSuccess('Mở chat');
            markRead(item.id);
            // the chat document id is the thread id
            const threadId = item.meta?.docId || item.id.replace(/^c-/, '');
            setSelectedThreadId(String(threadId));
            setSelectedThreadName(item.title || `Khách ${threadId}`);
            setOpenPanel('chat');
            // also mark all messages in this thread as read (best-effort)
            (async () => {
                try {
                    const chatRef = doc(db, 'chats', threadId);
                    // mark the chat doc hasUnread = false
                    await updateDoc(chatRef, { hasUnread: false }).catch(() => null);
                } catch (e) { /* ignore */ }
            })();
    };

    const openOrder = (item: NotificationItem) => {
        markRead(item.id);
        window.location.href = `/admin/orders?focus=${item.meta?.docId || item.id}`;
    };

    const openWarehouseItem = (item: NotificationItem) => {
        markRead(item.id);
        window.location.href = `/admin/warehouse`;
    };

    // toggle panel helper
    const togglePanel = (p: 'warehouse' | 'orders' | 'chat') => {
        setOpenPanel(prev => (prev === p ? 'none' : p));
    };

        // Listen to messages for selected thread
        useEffect(() => {
            if (!selectedThreadId) {
                setThreadMessages([]);
                return;
            }
            
            const fetchThread = async () => {
                try {
                    const chatRef = doc(db, 'chats', selectedThreadId);
                    const snap = await getDocs(query(collection(db, 'chats')));
                    const chatDoc = snap.docs.find(d => d.id === selectedThreadId);
                    if (!chatDoc || !chatDoc.exists()) { 
                        setThreadMessages([]); 
                        return; 
                    }
                    const data = chatDoc.data() as any;
                    setThreadMessages(Array.isArray(data.messages) ? data.messages : []);
                } catch (e: any) {
                    console.warn('Thread fetch failed', e);
                    setThreadMessages([]);
                }
            };
            
            fetchThread();
            const threadInterval = setInterval(fetchThread, 5000); // Refresh every 5s
            return () => clearInterval(threadInterval);
        }, [selectedThreadId]);

        const sendMessage = async () => {
            const text = messageInput.trim();
            if (!text || !selectedThreadId) return;
            try {
                const chatRef = doc(db, 'chats', selectedThreadId);
                const msgId = `a-${Date.now()}-${Math.floor(Math.random()*100000)}`;
                const messageObj = {
                    id: msgId,
                    role: 'admin',
                    message: text,
                    createdAt: serverTimestamp(),
                    unread: false
                };
                // append admin message and mark hasUnread false
                await updateDoc(chatRef, {
                    messages: arrayUnion(messageObj),
                    hasUnread: false,
                    updatedAt: serverTimestamp()
                });
                setMessageInput('');
                // mark thread as read locally
                setThreadMessages(prev => [...prev]);
            } catch (e:any) {
                console.error('Send message failed', e);
                showError('Gửi tin nhắn thất bại: ' + (e.message || ''));
            }
        };

        const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };

    return (
        <>
            <style>{`
        .admin-float-wrap{position:fixed;right:16px;bottom:16px;z-index:99999;display:flex;flex-direction:column;gap:10px;align-items:flex-end}
        .admin-float-btn{width:56px;height:56px;border-radius:999px;background:#C75F4B;color:#fff;border:none;box-shadow:0 8px 20px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px}
        .admin-float-badge{position:relative}
        .admin-float-badge::after{content:'';position:absolute;right:-6px;top:-6px;background:#111;color:#fff;border-radius:12px;padding:2px 6px;font-size:11px}
        .admin-panel{width:360px;max-height:60vh;overflow:auto;background:#fff;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,0.25);padding:12px;margin-bottom:8px}
        @media(max-width:640px){.admin-float-wrap{right:10px;bottom:10px;flex-direction:row;gap:8px}.admin-panel{width:320px}}
      `}</style>

            <div className="admin-float-wrap">
                {/* Warehouse button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative' }}>
                    <button className="admin-float-btn" aria-label="Kho hàng" onClick={() => togglePanel('warehouse')} title="Kho hàng">
                        📦
                        {unreadWarehouse > 0 && <span style={{ position: 'absolute', right: 10, top: 6, background: '#111', color: '#fff', borderRadius: 12, padding: '2px 6px', fontSize: 11 }}>{unreadWarehouse}</span>}
                    </button>
                    {openPanel === 'warehouse' && (
                        // panel positioned to the left of the button
                        <div className="admin-panel" style={{ position: 'absolute', right: 70, bottom: 0 }}>
                            <h4 style={{ margin: 0, marginBottom: 8 }}>Thiếu hàng (tồn ≤ 5)</h4>
                            {lowStock.length === 0 && <div style={{ color: '#777' }}>Không có sản phẩm sắp hết</div>}
                            {lowStock.map(i => (
                                <div key={i.id} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{i.title}</div>
                                        <div style={{ fontSize: 13, color: '#444' }}>{i.body}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => openWarehouseItem(i)} style={{ background: 'transparent', border: '1px solid #ddd', padding: '6px', borderRadius: 6 }}>Mở</button>
                                        <button onClick={() => markRead(i.id)} style={{ background: '#eee', border: 'none', padding: '6px', borderRadius: 6 }}>Đã đọc</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Orders button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative' }}>
                    <button className="admin-float-btn" aria-label="Đơn hàng" onClick={() => togglePanel('orders')} title="Đơn hàng">
                        🧾
                        {unreadOrders > 0 && <span style={{ position: 'absolute', right: 10, top: 6, background: '#111', color: '#fff', borderRadius: 12, padding: '2px 6px', fontSize: 11 }}>{unreadOrders}</span>}
                    </button>
                    {openPanel === 'orders' && (
                        <div className="admin-panel" style={{ position: 'absolute', right: 70, bottom: 0 }}>
                            <h4 style={{ margin: 0, marginBottom: 8 }}>Đơn hàng mới</h4>
                            {orders.length === 0 && <div style={{ color: '#777' }}>Không có đơn hàng mới</div>}
                            {orders.map(i => (
                                <div key={i.id} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{i.title}</div>
                                        <div style={{ fontSize: 13, color: '#444' }}>{i.body}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => openOrder(i)} style={{ background: 'transparent', border: '1px solid #ddd', padding: '6px', borderRadius: 6 }}>Mở</button>
                                        <button onClick={() => markRead(i.id)} style={{ background: '#eee', border: 'none', padding: '6px', borderRadius: 6 }}>Đã đọc</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative' }}>
                    <button className="admin-float-btn" aria-label="Tin nhắn" onClick={() => togglePanel('chat')} title="Tin nhắn">
                        💬
                        {unreadChats > 0 && <span style={{ position: 'absolute', right: 10, top: 6, background: '#111', color: '#fff', borderRadius: 12, padding: '2px 6px', fontSize: 11 }}>{unreadChats}</span>}
                    </button>
                    {openPanel === 'chat' && (
                        <div className="admin-panel" style={{ position: 'absolute', right: 70, bottom: 0, display: 'flex', flexDirection: 'column' }}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                                {selectedThreadId ? (
                                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                                        <button onClick={() => setSelectedThreadId(null)} style={{padding:6,borderRadius:6,border:'1px solid #ddd',background:'#fff'}}>←</button>
                                        <strong>{selectedThreadName || 'Cuộc trò chuyện'}</strong>
                                    </div>
                                ) : (
                                    <strong>Tin nhắn</strong>
                                )}
                                <div style={{fontSize:12,color:'#666'}}>{selectedThreadId ? '' : `${chats.length} mới`}</div>
                            </div>

                            {selectedThreadId ? (
                                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                    <div style={{maxHeight:'50vh',overflow:'auto',paddingRight:8}}>
                                        {threadMessages.length === 0 && <div style={{color:'#777'}}>Không có tin nhắn trong cuộc trò chuyện này</div>}
                                        {threadMessages.map(m => (
                                            <div key={m.id} style={{marginBottom:8,display:'flex',flexDirection:'column',alignItems: m.role === 'admin' ? 'flex-end' : 'flex-start'}}>
                                                <div style={{background: m.role === 'admin' ? '#e6f7ff' : '#f3f3f3', padding:8, borderRadius:8, maxWidth:320}}>
                                                    <div style={{fontSize:13}}>{m.message}</div>
                                                    <div style={{fontSize:11,color:'#666',marginTop:6}}>{m.role} {m.createdAt?.toDate ? new Date(m.createdAt.toDate()).toLocaleString() : ''}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{display:'flex',gap:8,marginTop:8}}>
                                        <textarea value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={onInputKeyDown} placeholder="Nhập tin nhắn và nhấn Enter để gửi" style={{flex:1,minHeight:42,padding:8,borderRadius:6,border:'1px solid #ddd'}} />
                                        <button onClick={sendMessage} style={{padding:'8px 12px',borderRadius:6,background:'#C75F4B',color:'#fff',border:'none'}}>Gửi</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {chats.length === 0 && <div style={{ color: '#777' }}>Không có tin nhắn mới</div>}
                                    {chats.map(i => (
                                        <div key={i.id} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{cursor:'pointer'}} onClick={() => openChat(i)}>
                                                <div style={{ fontWeight: 600 }}>{i.title}</div>
                                                <div style={{ fontSize: 13, color: '#444' }}>{i.body}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => openChat(i)} style={{ background: 'transparent', border: '1px solid #ddd', padding: '6px', borderRadius: 6 }}>Trả lời</button>
                                                <button onClick={() => markRead(i.id)} style={{ background: '#eee', border: 'none', padding: '6px', borderRadius: 6 }}>Đã đọc</button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* small canned replies admin can send quickly (optional) */}
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Canned replies</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {['Cảm ơn bạn đã quan tâm, chúng tôi sẽ phản hồi sớm.', 'Sản phẩm hiện có sẵn, mời bạn kiểm tra giỏ hàng.', 'Bạn muốn được tư vấn bởi nhân viên? Chúng tôi sẽ kết nối ngay.'].map((t, i) => (
                                                <button key={i} onClick={() => { navigator.clipboard?.writeText(t); showSuccess('Copied canned reply to clipboard'); }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fafafa' }}>{t.length > 22 ? t.slice(0,20) + '…' : t}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}
