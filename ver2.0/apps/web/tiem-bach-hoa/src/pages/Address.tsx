import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase-auth";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";

import "../../css/address.css";

function AddressCard({ address, onEdit, onDelete, onSetDefault }: any) {
  return (
    <div className={`ab-card ${address.isDefault ? "ab-card-default" : ""}`}>
      <div className="ab-card-header">
        <h3 className="ab-card-title">
          {address.recipient}
          {address.isDefault && <span className="ab-badge-default">Mặc định</span>}
        </h3>

        <div className="ab-actions">
          <button className="ab-action-edit" onClick={() => onEdit && onEdit(address)}>Sửa</button>
          <span className="ab-divider">|</span>
          <button className="ab-action-delete" onClick={() => onDelete && onDelete(address)}>Xóa</button>
        </div>
      </div>

      <p className="ab-info"><strong>SĐT:</strong> {address.phone}</p>
      <p className="ab-info"><strong>Địa chỉ:</strong> {address.detail}</p>

      {!address.isDefault && (
        <button className="ab-set-default" onClick={() => onSetDefault && onSetDefault(address)}>Đặt làm mặc định</button>
      )}
    </div>
  );
}

export default function AddressBookPage() {
  const navigate = useNavigate();
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ recipient: '', phone: '', detail: '', city: '', district: '', isDefault: false });

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setShowLoginWarning(true);
        setAddresses([]);
        setLoading(false);
      } else {
        setShowLoginWarning(false);
        // subscribe to addresses subcollection
        const col = collection(db, 'users', user.uid, 'addresses');
        const q = query(col);
        const unsub = onSnapshot(q, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          setAddresses(docs);
          setLoading(false);
        }, (err) => {
          console.error('addresses onSnapshot', err);
          setAddresses([]);
          setLoading(false);
        });
        return () => unsub();
      }
    });
    return () => unsubscribe();
  }, []);

  const openAdd = () => { setEditing(null); setForm({ recipient: '', phone: '', detail: '', city: '', district: '', isDefault: false }); setShowForm(true); };
  const openEdit = (a:any) => { setEditing(a); setForm({ recipient: a.recipient || '', phone: a.phone || '', detail: a.detail || '', city: a.city || '', district: a.district || '', isDefault: !!a.isDefault }); setShowForm(true); };

  const handleSave = async () => {
    if (!currentUser) { setShowLoginWarning(true); return; }
    try {
      // if isDefault, clear other defaults
      if (form.isDefault) {
        const colRef = collection(db, 'users', currentUser.uid, 'addresses');
        const snap = await getDocs(colRef);
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          if ((d.data() as any).isDefault) batch.update(d.ref, { isDefault: false });
        });
        await batch.commit();
      }

      if (editing) {
        const docRef = doc(db, 'users', currentUser.uid, 'addresses', editing.id);
        await updateDoc(docRef, { recipient: form.recipient, phone: form.phone, detail: form.detail, city: form.city, district: form.district, isDefault: form.isDefault });
      } else {
        const colRef = collection(db, 'users', currentUser.uid, 'addresses');
        await addDoc(colRef, { recipient: form.recipient, phone: form.phone, detail: form.detail, city: form.city, district: form.district, isDefault: form.isDefault });
      }
      setShowForm(false);
    } catch (err) {
      console.error('save address', err);
      alert('Lưu địa chỉ thất bại');
    }
  };

  const handleDelete = async (a:any) => {
    if (!currentUser) { setShowLoginWarning(true); return; }
    if (!confirm('Xóa địa chỉ này?')) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'addresses', a.id));
    } catch (err) { console.error('delete address', err); alert('Xóa thất bại'); }
  };

  const handleSetDefault = async (a:any) => {
    if (!currentUser) { setShowLoginWarning(true); return; }
    try {
      const colRef = collection(db, 'users', currentUser.uid, 'addresses');
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { isDefault: d.id === a.id }));
      await batch.commit();
    } catch (err) { console.error('set default', err); alert('Thất bại'); }
  };

  return (
    <>
      <Header />
      <FloatingButtons />

      <div className="ab-wrapper">
        <h2 className="ab-title">Sổ Địa Chỉ Giao Hàng</h2>

        <button className="ab-add-btn" onClick={openAdd}>
          <span className="ab-add-icon">+</span> Thêm Địa Chỉ Mới
        </button>

        <div className="ab-grid">
          {loading ? (<div>Đang tải địa chỉ...</div>) : (
            addresses.map((item) => (
              <AddressCard key={item.id} address={item} onEdit={openEdit} onDelete={handleDelete} onSetDefault={handleSetDefault} />
            ))
          )}
        </div>

        {!loading && addresses.length === 0 && (
          <div className="ab-empty-box">
            Bạn chưa lưu địa chỉ nào. Hãy thêm địa chỉ đầu tiên!
          </div>
        )}
      </div>

      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để quản lý sổ địa chỉ"
          onClose={() => setShowLoginWarning(false)}
        />
      )}

      {showForm && (
        <div className="ab-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="ab-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="ab-modal-close" onClick={() => setShowForm(false)} aria-label="Đóng">×</button>
            <h3 style={{marginTop:0}}>{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</h3>
            <div className="form-group"><label>Người nhận</label><input placeholder="Tên người nhận" value={form.recipient} onChange={e=>setForm({...form,recipient:e.target.value})} /></div>
            <div className="form-group"><label>Số điện thoại</label><input placeholder="Số điện thoại (ví dụ: 0912345678)" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div className="form-group"><label>Địa chỉ chi tiết</label><input placeholder="Số nhà, tên đường, khu phố" value={form.detail} onChange={e=>setForm({...form,detail:e.target.value})} /></div>
            <div className="grid-2">
              <div className="form-group"><label>Tỉnh / Thành phố</label><input placeholder="Tỉnh / Thành phố" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></div>
              <div className="form-group"><label>Quận / Huyện</label><input placeholder="Quận / Huyện" value={form.district} onChange={e=>setForm({...form,district:e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="checkbox-inline"><input type="checkbox" checked={form.isDefault} onChange={e=>setForm({...form,isDefault:e.target.checked})} /> Đặt làm mặc định</label></div>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button className="btn-primary" onClick={handleSave}>{editing ? 'Lưu' : 'Thêm'}</button>
              <button className="btn-secondary" onClick={()=>setShowForm(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
