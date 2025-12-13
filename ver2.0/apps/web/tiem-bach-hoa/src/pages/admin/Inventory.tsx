import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, increment, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import AdminSidebar from '../../components/admin/Sidebar';
import '../../../css/admin/inventory.css';
import { showSuccess, showError } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [entries, setEntries] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // form state
  const [date, setDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productNameInput, setProductNameInput] = useState<string>('');
  const [showProductPicker, setShowProductPicker] = useState<boolean>(false);
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Tất cả');
  // New: purchase order and line items
  const [poSupplier, setPoSupplier] = useState<string>('');
  const [poDate, setPoDate] = useState<string>('');
  const [poNotes, setPoNotes] = useState<string>('');
  const [lineItems, setLineItems] = useState<Array<any>>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [originalLineItems, setOriginalLineItems] = useState<Array<any>>([]);
  const [currentInvoice, setCurrentInvoice] = useState<string>('');

  useEffect(() => {
    // load recent inventory entries
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'inventory_in'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEntries(items.sort((a,b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0)));
      } catch (err: any) {
        console.error('Load inventory entries error', err);
        const msg = (err && (err.code || err.message)) ? `${err.code || ''} ${err.message || ''}` : 'Lỗi khi tải dữ liệu';
        setLoadError(msg.includes('permission') || msg.includes('insufficient') ? 'Quyền truy cập Firestore bị từ chối. Vui lòng deploy lại firestore.rules hoặc bật quyền phù hợp.' : msg);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  // product search: fetch top products and filter client-side
  const searchProducts = async (q: string) => {
    setProductQuery(q);
    if (!q || q.length < 2) {
      setProductResults([]);
      return;
    }
    try {
      const snap = await getDocs(collection(db, 'products'));
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = prods.filter((p:any) => (p.name || '').toLowerCase().includes(q.toLowerCase()) || (p.slug || '').toLowerCase().includes(q.toLowerCase()));
      setProductResults(filtered.slice(0,10));
    } catch (err) {
      console.error('Product search error', err);
    }
  };

  const handleSelectProduct = (p:any) => {
    setSelectedProduct(p);
    setProductResults([]);
    setProductQuery('');
    setProductNameInput(p.name || p.productName || '');
  };

  // open product picker: load warehouse items
  const openProductPicker = async () => {
    setShowProductPicker(true);
    try {
      const snap = await getDocs(collection(db, 'warehouse'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWarehouseItems(items.slice(0, 200));
    } catch (err) {
      console.error('Load warehouse items error', err);
      setWarehouseItems([]);
    }
  };

  const closeProductPicker = () => setShowProductPicker(false);

  const handlePickFromWarehouse = (w:any) => {
    // fill selected product from warehouse record
    const asProduct = {
      id: w.productId || w.id,
      name: w.productName || w.name || '',
      image: w.image ? [w.image] : (w.images || []),
      stock: w.stock || 0,
      slug: w.slug || '',
    };
    setSelectedProduct(asProduct);
    setQuantity(Number(w.stock) > 0 ? 1 : 1);
    setShowProductPicker(false);
    setProductNameInput(asProduct.name || '');
  };

  const addCurrentToLineItems = () => {
    // product can be selected from warehouse (selectedProduct) or a new-name entered in productNameInput
    if ((!selectedProduct) && (!productNameInput || productNameInput.trim().length === 0)) return showError('Chọn sản phẩm từ kho hoặc nhập tên sản phẩm mới');
    if (!quantity || quantity <= 0) return showError('Số lượng phải > 0');
    const item = {
      productId: selectedProduct ? selectedProduct.id : null,
      productName: selectedProduct ? (selectedProduct.name || selectedProduct.productName) : productNameInput,
      image: selectedProduct ? ((selectedProduct.image && selectedProduct.image[0]) || '') : '',
      qty: Number(quantity) || 0,
      unitPrice: Number(unitPrice) || 0,
      totalPrice: (Number(unitPrice) || 0) * (Number(quantity) || 0),
      isNewProduct: !selectedProduct,
    };
    setLineItems(prev => [...prev, item]);
    // reset selection but keep po fields
    setSelectedProduct(null);
    setProductQuery('');
    setProductResults([]);
    setQuantity(1);
    setUnitPrice(0);
    setProductNameInput('');
  };

  const updateLineItem = (index:number, patch:Partial<any>) => {
    setLineItems(prev => prev.map((it,i)=> i===index ? {...it, ...patch, totalPrice: ((patch.unitPrice ?? it.unitPrice) || 0) * ((patch.qty ?? it.qty) || 0)} : it));
  };

  const removeLineItem = (index:number) => {
    setLineItems(prev => prev.filter((_,i)=>i!==index));
  };

  // Edit an existing PO (grouped by invoiceNumber)
  const openEditInvoice = async (invoiceNum:string) => {
    try {
      const q = query(collection(db, 'inventory_in'), where('invoiceNumber', '==', invoiceNum));
      const snap = await getDocs(q);
      if (snap.empty) return showError('Không tìm thấy phiếu nhập');
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // prepare original line items (keep doc ids for update/delete)
      setOriginalLineItems(docs.map((d:any) => ({ docId: d.id, productId: d.productId, qty: Number(d.qty) || 0 })));
      setLineItems(docs.map((d:any) => ({ docId: d.id, productId: d.productId, productName: d.productName, image: d.image || '', qty: Number(d.qty)||0, unitPrice: Number(d.unitPrice)||0, totalPrice: Number(d.totalPrice)||0 })));
      setPoSupplier(docs[0].supplier || '');
      setPoDate(docs[0].date || '');
      setInvoiceNumber(invoiceNum);
      setPoNotes(docs[0].notes || '');
      setEditMode(true);
      setCurrentInvoice(invoiceNum);
      setShowForm(true);
    } catch (err:any) {
      console.error('Open edit invoice error', err);
      showError('Không thể mở phiếu để sửa');
    }
  };

  // Delete a PO (all inventory_in docs with this invoiceNumber)
  const deleteInvoice = async (invoiceNum:string) => {
    if (!window.confirm(`Xóa toàn bộ phiếu nhập ${invoiceNum}? Hành động này sẽ giảm tồn kho tương ứng.`)) return;
    try {
      const q = query(collection(db, 'inventory_in'), where('invoiceNumber', '==', invoiceNum));
      const snap = await getDocs(q);
      if (snap.empty) return showError('Phiếu không tồn tại');
      for (const d of snap.docs) {
        const data:any = d.data();
        const qty = Number(data.qty) || 0;
        // decrement product stock
        try {
          if (data.productId) {
            const prodRef = doc(db, 'products', data.productId);
            await updateDoc(prodRef, { stock: increment(-qty) });
          }
        } catch (err) { console.warn('Failed to decrement product stock', err); }
        // decrement warehouse
        try {
          if (data.productId) {
            const whRef = doc(db, 'warehouse', data.productId);
            await setDoc(whRef, { stock: increment(-qty), lastUpdated: serverTimestamp() }, { merge: true });
          }
        } catch (err) { console.warn('Failed to decrement warehouse stock', err); }
        // delete inventory doc
        await deleteDoc(doc(db, 'inventory_in', d.id));
      }
      showSuccess('Đã xóa phiếu nhập và cập nhật tồn kho');
      // reload
      const reload = await getDocs(collection(db, 'inventory_in'));
      const items = reload.docs.map(dd => ({ id: dd.id, ...dd.data() }));
      setEntries(items.sort((a:any,b:any) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0)));
    } catch (err:any) {
      console.error('Delete invoice error', err);
      showError('Lỗi khi xóa phiếu');
    }
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    // If there are no line items, try to use selectedProduct as single item
    if (lineItems.length === 0) {
      if (!selectedProduct && !productNameInput) return showError('Vui lòng chọn hoặc nhập sản phẩm hoặc thêm ít nhất một dòng chi tiết');
      if (!poSupplier && !supplier) return showError('Nhập tên đơn vị nhập');
      if (!quantity || quantity <= 0) return showError('Số lượng phải > 0');
      // create single line item from current selection
      const single = {
        productId: selectedProduct ? selectedProduct.id : null,
        productName: selectedProduct ? (selectedProduct.name || selectedProduct.productName) : productNameInput,
        image: (selectedProduct && selectedProduct.image && selectedProduct.image[0]) || '',
        qty: Number(quantity)||0,
        unitPrice: Number(unitPrice)||0,
        totalPrice: (Number(unitPrice)||0)*(Number(quantity)||0),
        isNewProduct: !selectedProduct,
      };
      setLineItems([single]);
    }

    if (!poSupplier && supplier) setPoSupplier(supplier);
    if (!poDate && date) setPoDate(date);

    const finalInvoice = invoiceNumber && invoiceNumber.trim() ? invoiceNumber.trim() : `PO-${Date.now()}`;

    if (!poSupplier) return showError('Vui lòng nhập tên đơn vị nhập (Supplier)');

    try {
      const uid = auth.currentUser?.uid || 'system';

      if (editMode) {
        // Update existing invoice: compare originalLineItems and current lineItems
        const origByDoc:any = {};
        originalLineItems.forEach((o:any) => { origByDoc[o.docId] = o; });

        // Detect deleted docs
        const currentDocIds = lineItems.filter((it:any)=>it.docId).map((it:any)=>it.docId);
        for (const o of originalLineItems) {
          if (!currentDocIds.includes(o.docId)) {
            // deleted: remove doc and decrement stocks
            try {
              const docRef = doc(db, 'inventory_in', o.docId);
              await deleteDoc(docRef);
            } catch (err) { console.warn('Failed to remove inventory doc', err); }
            // decrement product & warehouse
            try { if (o.productId) { const prodRef = doc(db, 'products', o.productId); await updateDoc(prodRef, { stock: increment(- (o.qty || 0)) }); } } catch(e){console.warn(e)}
            try { if (o.productId) { const whRef = doc(db, 'warehouse', o.productId); await setDoc(whRef, { stock: increment(- (o.qty || 0)), lastUpdated: serverTimestamp() }, { merge: true }); } } catch(e){console.warn(e)}
          }
        }

        // Process current items: update existing or create new
        for (const it of lineItems) {
          const payload = {
            date: poDate || date || new Date().toISOString(),
            supplier: poSupplier || supplier,
            invoiceNumber: finalInvoice,
            notes: poNotes || notes || '',
            productId: it.productId || null,
            productName: it.productName,
            image: it.image || '',
            qty: Number(it.qty) || 0,
            unitPrice: Number(it.unitPrice) || 0,
            totalPrice: Number(it.totalPrice) || ((Number(it.unitPrice)||0)*(Number(it.qty)||0)),
            adminId: uid,
          };

          if (it.docId) {
            // update existing doc
            try {
              const ref = doc(db, 'inventory_in', it.docId);
              await updateDoc(ref, payload);
            } catch (err) { console.warn('Failed to update inventory doc', err); }

            // adjust stock by delta
            const origQty = origByDoc[it.docId] ? (origByDoc[it.docId].qty || 0) : 0;
            const delta = Number(it.qty) - origQty;
            if (delta !== 0 && it.productId) {
              try { const prodRef = doc(db, 'products', it.productId); await updateDoc(prodRef, { stock: increment(delta) }); } catch(e){console.warn(e)}
              try { const whRef = doc(db, 'warehouse', it.productId); await setDoc(whRef, { stock: increment(delta), lastUpdated: serverTimestamp() }, { merge: true }); } catch(e){console.warn(e)}
            }
          } else {
            // new line: create doc and increment stock
            try {
              await addDoc(collection(db, 'inventory_in'), { ...payload, createdAt: serverTimestamp() });
            } catch (err) { console.warn('Failed to create inventory doc', err); }
            if (it.productId) {
              try { const prodRef = doc(db, 'products', it.productId); await updateDoc(prodRef, { stock: increment(Number(it.qty) || 0) }); } catch(e){console.warn(e)}
              try { const whRef = doc(db, 'warehouse', it.productId); await setDoc(whRef, { productId: it.productId, productName: it.productName, image: it.image || '', stock: increment(Number(it.qty) || 0), lastPurchasePrice: Number(it.unitPrice)||0, lastUpdated: serverTimestamp() }, { merge: true }); } catch(e){console.warn(e)}
            }
          }
        }

        showSuccess('Phiếu đã được cập nhật');
      } else {
        // Create new invoice (original behavior)
        for (const it of lineItems) {
          const payload = {
            createdAt: serverTimestamp(),
            date: poDate || date || new Date().toISOString(),
            supplier: poSupplier || supplier,
            invoiceNumber: finalInvoice,
            notes: poNotes || notes || '',
            productId: it.productId,
            productName: it.productName,
            image: it.image || '',
            qty: Number(it.qty) || 0,
            unitPrice: Number(it.unitPrice) || 0,
            totalPrice: Number(it.totalPrice) || ((Number(it.unitPrice)||0)*(Number(it.qty)||0)),
            adminId: uid,
          };

          // write inventory entry
          await addDoc(collection(db, 'inventory_in'), payload);

          // update product stock using increment and record latest purchase price
          try {
            if (it.productId) {
              const prodRef = doc(db, 'products', it.productId);
              await updateDoc(prodRef, {
                stock: increment(Number(it.qty) || 0),
                lastPurchasePrice: Number(it.unitPrice) || 0,
              });
            }
          } catch (err) {
            console.warn('Failed to update product stock', err);
          }

          // upsert into warehouse collection
          try {
            if (it.productId) {
              const whRef = doc(db, 'warehouse', it.productId);
              await setDoc(whRef, {
                productId: it.productId,
                productName: it.productName,
                image: it.image || '',
                stock: increment(Number(it.qty) || 0),
                lastPurchasePrice: Number(it.unitPrice) || 0,
                lastUpdated: serverTimestamp(),
              }, { merge: true });
            }
          } catch (err) {
            console.warn('Failed to upsert warehouse doc', err);
          }
        }

        showSuccess('Nhập hàng thành công');
      }

      // reload entries
      const snap = await getDocs(collection(db, 'inventory_in'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEntries(items.sort((a,b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0)));

      // reset form and PO
      setSupplier(''); setSelectedProduct(null); setQuantity(1); setDate(''); setUnitPrice(0); setInvoiceNumber(''); setNotes('');
      setPoSupplier(''); setPoDate(''); setPoNotes(''); setLineItems([]);
      setEditMode(false); setOriginalLineItems([]); setCurrentInvoice('');
    } catch (err:any) {
      console.error('Submit inventory error', err);
      showError(err.message || 'Lỗi khi nhập hàng');
    }
  };

  return (
    <div className="po-wrapper admin-page admin-inventory-page">
      {/* keep AdminSidebar for navigation but adopt the PO layout for content */}
      <AdminSidebar />

      <main className="po-content admin-main">
        <header className="po-header admin-header">
          <h1 className="title">Quản Lý Nhập Hàng</h1>
          <div>
            <button className="btn btn-accent" onClick={() => setShowForm(s => !s)}>+ Tạo Đơn Nhập Hàng Mới</button>
          </div>
        </header>

        {/* Toolbar: search and status filters */}
        <div className="po-toolbar">
          <input
            type="text"
            placeholder="Tìm theo mã, nhà cung cấp, sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-search"
          />

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-select"
          >
            <option value="Tất cả">Trạng thái: Tất cả</option>
            <option value="Mới tạo">Mới tạo</option>
            <option value="Đang chờ nhận">Đang chờ nhận</option>
            <option value="Đã nhận hàng">Đã nhận hàng</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>

          <button className="btn btn-dark">Áp Dụng Lọc</button>

          <div className="toolbar-extra">
            <button className="btn btn-light">Xem Lịch sử Nhập Kho</button>
          </div>
        </div>

        {/* Modal overlay form (opens as overlay) */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="modal-header">
                <h2>Thêm phiếu nhập mới</h2>
                <button aria-label="Đóng" className="modal-close" onClick={() => setShowForm(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="po-form-grid">
                  <div className="po-form-left">
                    <label>Ngày (PO)</label>
                    <input type="date" value={poDate || date} onChange={e=>{ setPoDate(e.target.value); setDate(e.target.value); }} />

                    <label>Đơn vị nhập (Supplier)</label>
                    <input type="text" value={poSupplier || supplier} onChange={e=>{ setPoSupplier(e.target.value); setSupplier(e.target.value); }} placeholder="Tên nhà cung cấp" />

                    <label>Số hóa đơn / Số phiếu (tùy chọn)</label>
                    <input type="text" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} placeholder="Nếu để trống sẽ tự sinh" />

                    <label>Ghi chú phiếu</label>
                    <textarea value={poNotes || notes} onChange={e=>{ setPoNotes(e.target.value); setNotes(e.target.value); }} placeholder="Ghi chú chung cho phiếu nhập" />
                  </div>

                  <div className="po-form-right">
                    <label>Tên sản phẩm (hoặc chọn từ kho)</label>
                    <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
                      <input type="text" placeholder="Nhập tên sản phẩm mới hoặc để trống" value={productNameInput} onChange={e=>setProductNameInput(e.target.value)} style={{flex:1}} />
                      <button type="button" className="btn" onClick={openProductPicker}>🔎 Tìm sản phẩm</button>
                      {selectedProduct && <img src={(selectedProduct.image && selectedProduct.image[0])||''} alt={selectedProduct.name} style={{width:48, height:48, objectFit:'cover', borderRadius:6}} />}
                    </div>

                    {productResults.length > 0 && (
                      <div className="product-search-results">
                        {productResults.map(p => (
                          <div key={p.id} className="product-search-item" onClick={()=>handleSelectProduct(p)}>
                            <img src={(p.image && p.image[0])||''} alt={p.name} />
                            <div className="pinfo">
                              <div className="pname">{p.name}</div>
                              <div className="pslug">{p.slug}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedProduct && (
                      <div className="selected-product">
                        <img src={(selectedProduct.image && selectedProduct.image[0])||''} alt={selectedProduct.name} />
                        <div>
                          <div className="pname">{selectedProduct.name}</div>
                          <div className="pstock">Hiện có: {selectedProduct.stock || 0}</div>
                        </div>
                      </div>
                    )}

                    <div className="line-inputs">
                      <label>Số lượng</label>
                      <input type="number" min={1} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} />

                      <label>Giá nhập (₫ / đơn vị)</label>
                      <input type="number" min={0} step={100} value={unitPrice} onChange={e=>setUnitPrice(Number(e.target.value))} />

                      <button type="button" className="btn-add-line" onClick={addCurrentToLineItems}>+ Thêm vào phiếu</button>
                    </div>

                    <div className="line-items">
                      <h4>Chi tiết phiếu</h4>
                      {lineItems.length === 0 ? <div>Chưa có dòng nào</div> : (
                        <table className="line-items-table">
                          <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá</th><th>Tổng</th><th></th></tr></thead>
                          <tbody>
                            {lineItems.map((it, idx) => (
                              <tr key={idx}>
                                <td>{it.productName}</td>
                                <td><input type="number" min={1} value={it.qty} onChange={e=>updateLineItem(idx, { qty: Number(e.target.value) })} /></td>
                                <td><input type="number" min={0} value={it.unitPrice} onChange={e=>updateLineItem(idx, { unitPrice: Number(e.target.value) })} /></td>
                                <td>{(Number(it.totalPrice)||0).toLocaleString('vi-VN')} ₫</td>
                                <td><button type="button" className="btn-ghost" onClick={()=>removeLineItem(idx)}>Xóa</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{marginTop:12, display:'flex', gap:8, justifyContent:'flex-end'}}>
                  <button type="submit" className="btn-primary">Ghi nhận nhập kho</button>
                  <button type="button" className="btn-ghost" onClick={()=>{ setShowForm(false); setLineItems([]); }}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product picker overlay (separate overlay to search warehouse) */}
        {showProductPicker && (
          <div className="modal-overlay" onClick={() => setShowProductPicker(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{maxWidth:900}}>
              <div className="modal-header">
                <h3>Chọn sản phẩm từ kho</h3>
                <button aria-label="Đóng" className="modal-close" onClick={() => setShowProductPicker(false)}>✕</button>
              </div>
              <div style={{padding:12}}>
                <input placeholder="Tìm theo tên hoặc mã" className="input-search" onChange={e=>{
                  const q = e.target.value.trim().toLowerCase();
                  if (!q) { setWarehouseItems(prev=>prev); return; }
                  setWarehouseItems(prev => prev.filter(w => (String(w.productName||'').toLowerCase().includes(q) || String(w.productId||'').toLowerCase().includes(q))));
                }} />

                <div style={{maxHeight:400, overflow:'auto', marginTop:8}}>
                  {warehouseItems.length === 0 ? <div>Không có sản phẩm trong kho</div> : warehouseItems.map(w => (
                    <div key={w.productId || w.id} className="product-search-item" style={{display:'flex',gap:12,alignItems:'center',padding:8,cursor:'pointer'}} onClick={()=>handlePickFromWarehouse(w)}>
                      <img src={(w.image)||''} alt={w.productName} style={{width:56,height:56,objectFit:'cover',borderRadius:6}} />
                      <div>
                        <div style={{fontWeight:600}}>{w.productName}</div>
                        <div style={{fontSize:12,color:'#666'}}>Mã: {w.productId || w.id} · Kho: {w.stock || 0}</div>
                      </div>
                      <div style={{marginLeft:'auto'}}>
                        <button className="btn" onClick={(ev)=>{ ev.stopPropagation(); handlePickFromWarehouse(w); }}>Chọn</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table area */}
        <div className="po-table-wrapper inventory-list">
          <table className="po-table inv-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Nhà cung cấp</th>
                <th>Số hóa đơn</th>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Giá nhập</th>
                <th>Tổng</th>
                <th>Hình</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {entries
                .filter((en:any) => {
                  const q = (searchQuery||'').trim().toLowerCase();
                  if (q) {
                    return (String(en.productName || '').toLowerCase().includes(q) || String(en.supplier || '').toLowerCase().includes(q) || String(en.invoiceNumber || '').toLowerCase().includes(q) || String(en.productId || '').includes(q));
                  }
                  if (selectedStatus && selectedStatus !== 'Tất cả') {
                    return (en.status || 'Đã nhận hàng') === selectedStatus;
                  }
                  return true;
                })
                .map((en:any) => (
                  <tr key={en.id}>
                    <td>{en.date || (en.createdAt?.toDate ? en.createdAt.toDate().toLocaleString() : '')}</td>
                    <td>{en.supplier}</td>
                    <td>{en.invoiceNumber || ''}</td>
                    <td>{en.productName}</td>
                    <td>{en.qty}</td>
                    <td>{en.unitPrice ? (Number(en.unitPrice).toLocaleString('vi-VN') + ' ₫') : ''}</td>
                    <td>{en.totalPrice ? (Number(en.totalPrice).toLocaleString('vi-VN') + ' ₫') : ''}</td>
                    <td>{en.image ? <img src={en.image} alt={en.productName} style={{width:60}} /> : ''}</td>
                    <td>
                      <button className="btn" onClick={()=>openEditInvoice(en.invoiceNumber)}>Sửa phiếu</button>
                      <button className="btn btn-danger" onClick={()=>deleteInvoice(en.invoiceNumber)} style={{marginLeft:8}}>Xóa phiếu</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="po-pagination">
          <span>Hiển thị {entries.length} phiếu nhập</span>
          <div className="page-buttons">
            <button className="page-btn">Trước</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">Sau</button>
          </div>
        </div>
      </main>
    </div>
  );
}
