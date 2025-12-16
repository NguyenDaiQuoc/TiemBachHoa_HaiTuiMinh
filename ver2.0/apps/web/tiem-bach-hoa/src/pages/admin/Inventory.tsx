import React, { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, serverTimestamp, increment, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth, storage } from '../../firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import AdminSidebar from '../../components/admin/Sidebar';
import '../../../css/admin/inventory.css';
import { showSuccess, showError } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import ImageLightbox from '../../components/ImageLightbox';

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

  // derived filtered list for realtime filtering
  const [manualFilterTick, setManualFilterTick] = useState<number>(0);
  const filteredEntries = React.useMemo(() => {
    const q = (searchQuery||'').trim().toLowerCase();
    return entries.filter((en:any) => {
      if (q) {
        return (String(en.productName || '').toLowerCase().includes(q) || String(en.supplier || '').toLowerCase().includes(q) || String(en.invoiceNumber || '').toLowerCase().includes(q) || String(en.productId || '').includes(q));
      }
      if (selectedStatus && selectedStatus !== 'Tất cả') {
        return (en.status || 'Đã nhận hàng') === selectedStatus;
      }
      return true;
    });
  }, [entries, searchQuery, selectedStatus, manualFilterTick]);
  // New: purchase order and line items
  const [poSupplier, setPoSupplier] = useState<string>('');
  const [poDate, setPoDate] = useState<string>('');
  const [poNotes, setPoNotes] = useState<string>('');
  const [lineItems, setLineItems] = useState<Array<any>>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [originalLineItems, setOriginalLineItems] = useState<Array<any>>([]);
  const [currentInvoice, setCurrentInvoice] = useState<string>('');
  // Invoice-level image (file selected) and preview/url
  const [poImageFile, setPoImageFile] = useState<File | undefined>(undefined);
  const [poImageUrl, setPoImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // files for the currently-being-entered product (before adding to lineItems)
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  // per-file upload progress map (keyed by unique id or filename)
  const [fileUploadProgress, setFileUploadProgress] = useState<Record<string, number>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxStart, setLightboxStart] = useState<number>(0);
  // Invoice detail viewer state
  const [viewInvoiceOpen, setViewInvoiceOpen] = useState(false);
  const [viewInvoiceNumber, setViewInvoiceNumber] = useState<string>('');
  const [viewInvoiceItems, setViewInvoiceItems] = useState<any[]>([]);
  const [viewInvoiceMeta, setViewInvoiceMeta] = useState<any>(null);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  useEffect(() => {
    // load recent inventory entries
    const load = async () => {
      setLoading(true);
      try {
  const snap = await getDocs(collection(db, 'inventory_in'));
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
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
      console.log('Warehouse items loaded:', items); // Debug log
      console.log('First warehouse item:', items[0]); // Debug first item structure
      setWarehouseItems(items.slice(0, 200));
    } catch (err) {
      console.error('Load warehouse items error', err);
      setWarehouseItems([]);
    }
  };

  const closeProductPicker = () => setShowProductPicker(false);

  const handlePickFromWarehouse = (w:any) => {
    console.log('Picking from warehouse:', w); // Debug
    // fill selected product from warehouse record
    let productImages = [];
    if (w.images && Array.isArray(w.images) && w.images.length > 0) {
      productImages = w.images;
      console.log('Using w.images array:', productImages);
    } else if (w.image && typeof w.image === 'string') {
      productImages = [w.image];
      console.log('Using w.image string:', productImages);
    } else if (w.image && Array.isArray(w.image) && w.image.length > 0) {
      productImages = w.image;
      console.log('Using w.image array:', productImages);
    }
    
    const asProduct = {
      id: w.productId || w.id,
      name: w.productName || w.name || '',
      image: productImages,
      stock: w.stock || 0,
      slug: w.slug || '',
    };
    console.log('Created asProduct:', asProduct); // Debug
    setSelectedProduct(asProduct);
    setQuantity(1);
    setShowProductPicker(false);
    setProductNameInput(asProduct.name || '');
  };

  const addCurrentToLineItems = () => {
    // product can be selected from warehouse (selectedProduct) or a new-name entered in productNameInput
    if ((!selectedProduct) && (!productNameInput || productNameInput.trim().length === 0)) return showError('Chọn sản phẩm từ kho hoặc nhập tên sản phẩm mới');
    if (!quantity || quantity <= 0) return showError('Số lượng phải > 0');
    const initialImages = selectedProduct
      ? (Array.isArray(selectedProduct.image) ? selectedProduct.image : (selectedProduct.image ? [selectedProduct.image] : []))
      : [];

    const item = {
      productId: selectedProduct ? selectedProduct.id : null,
      productName: selectedProduct ? (selectedProduct.name || selectedProduct.productName) : productNameInput,
      // support multiple images per line; if product from warehouse, preserve its images
      images: initialImages,
      // optional local File objects when user picks image(s) for this line before submit
  files: currentFiles || [] as File[],
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
    setCurrentFiles([]);
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
  const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      // prepare original line items (keep doc ids for update/delete)
      setOriginalLineItems(docs.map((d:any) => ({ docId: d.id, productId: d.productId, qty: Number(d.qty) || 0 })));
  setLineItems(docs.map((d:any) => ({ docId: d.id, productId: d.productId, productName: d.productName, images: (d.images && Array.isArray(d.images)) ? d.images : (d.image ? [d.image] : []), files: [], qty: Number(d.qty)||0, unitPrice: Number(d.unitPrice)||0, totalPrice: Number(d.totalPrice)||0, isNewProduct: !d.productId })));
  setPoSupplier(docs[0].supplier || '');
  setPoDate(docs[0].date || '');
  setInvoiceNumber(invoiceNum);
  setPoNotes(docs[0].notes || '');
  // load invoice-level image if present on the first line
  setPoImageUrl(docs[0].invoiceImage || '');
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
    if (!window.confirm(`Xóa toàn bộ phiếu nhập ${invoiceNum}?\n\nHành động này sẽ:\n- Giảm số lượng tồn kho trong Products\n- Giảm số lượng trong Warehouse\n- Xóa các dòng trong phiếu nhập`)) return;
    
    try {
      const q = query(collection(db, 'inventory_in'), where('invoiceNumber', '==', invoiceNum));
      const snap = await getDocs(q);
      if (snap.empty) return showError('Phiếu không tồn tại');
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (const d of snap.docs) {
        const data:any = d.data();
        const qty = Number(data.qty) || 0;
        const productId = data.productId;
        const productName = data.productName || 'Unknown';
        
        console.log(`Processing delete for ${productName} (${productId}), qty: ${qty}`);
        
        if (!productId) {
          console.warn(`Skipping product without ID: ${productName}`);
          continue;
        }
        
        try {
          // 1. Decrement product stock in products collection
          const prodRef = doc(db, 'products', productId);
          const prodSnap = await getDocs(query(collection(db, 'products'), where('__name__', '==', productId)));
          
          if (!prodSnap.empty) {
            const currentStock = prodSnap.docs[0].data().stock || 0;
            const newStock = Math.max(0, currentStock - qty); // Không cho âm
            
            await updateDoc(prodRef, { 
              stock: newStock,
              updatedAt: serverTimestamp()
            });
            console.log(`✓ Updated products/${productId}: ${currentStock} → ${newStock}`);
          } else {
            console.warn(`Product ${productId} not found in products collection`);
          }
          
          // 2. Decrement warehouse stock
          const whRef = doc(db, 'warehouse', productId);
          const whSnap = await getDocs(query(collection(db, 'warehouse'), where('__name__', '==', productId)));
          
          if (!whSnap.empty) {
            const currentWhStock = whSnap.docs[0].data().stock || 0;
            const newWhStock = Math.max(0, currentWhStock - qty); // Không cho âm
            
            await setDoc(whRef, { 
              stock: newWhStock,
              lastUpdated: serverTimestamp(),
              productId: productId,
              productName: productName
            }, { merge: true });
            console.log(`✓ Updated warehouse/${productId}: ${currentWhStock} → ${newWhStock}`);
          } else {
            // Nếu không có trong warehouse, tạo mới với stock = 0
            await setDoc(whRef, {
              productId: productId,
              productName: productName,
              stock: 0,
              lastUpdated: serverTimestamp()
            }, { merge: true });
            console.log(`✓ Created warehouse/${productId} with stock = 0`);
          }
          
          // 3. Delete inventory_in document
          await deleteDoc(doc(db, 'inventory_in', d.id));
          console.log(`✓ Deleted inventory_in/${d.id}`);
          
          successCount++;
        } catch (err: any) {
          console.error(`Failed to process ${productName}:`, err);
          errors.push(`${productName}: ${err.message}`);
          errorCount++;
        }
      }
      
      // Show result
      if (errorCount === 0) {
        showSuccess(`Đã xóa phiếu nhập ${invoiceNum} và cập nhật ${successCount} sản phẩm trong kho`);
      } else {
        showError(`Xóa phiếu với ${errorCount} lỗi. Chi tiết: ${errors.join(', ')}`);
      }
      
      // Reload inventory list
      const reload = await getDocs(collection(db, 'inventory_in'));
      const items = reload.docs.map(dd => ({ id: dd.id, ...(dd.data() as any) }));
      setEntries(items.sort((a:any,b:any) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0)));
      
    } catch (err:any) {
      console.error('Delete invoice error', err);
      showError('Lỗi khi xóa phiếu: ' + (err.message || 'Unknown error'));
    }
  };

  // Open read-only invoice viewer (show header + all line items)
  const openViewInvoice = async (invoiceNum:string) => {
    try {
      const q = query(collection(db, 'inventory_in'), where('invoiceNumber', '==', invoiceNum));
      const snap = await getDocs(q);
      if (snap.empty) return showError('Không tìm thấy phiếu nhập');
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setViewInvoiceItems(docs);
      setViewInvoiceNumber(invoiceNum);
      // derive meta from first doc (supplier, date, notes, invoiceImage)
      const first = docs[0] || null;
      setViewInvoiceMeta(first ? {
        supplier: first.supplier || '',
        date: first.date || first.createdAt || '',
        notes: first.notes || '',
        invoiceImage: first.invoiceImage || ''
      } : null);
      setViewInvoiceOpen(true);
    } catch (err:any) {
      console.error('Open view invoice error', err);
      showError('Không thể mở chi tiết phiếu');
    }
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    
    // Build final lineItems array for processing
    let finalLineItems = [...lineItems];
    
    // If there are no line items, try to use selectedProduct as single item
    if (finalLineItems.length === 0) {
      if (!selectedProduct && !productNameInput) return showError('Vui lòng chọn hoặc nhập sản phẩm hoặc thêm ít nhất một dòng chi tiết');
      if (!poSupplier && !supplier) return showError('Nhập tên đơn vị nhập');
      if (!quantity || quantity <= 0) return showError('Số lượng phải > 0');
      // create single line item from current selection
      const single = {
        productId: selectedProduct ? selectedProduct.id : null,
        productName: selectedProduct ? (selectedProduct.name || selectedProduct.productName) : productNameInput,
        images: (selectedProduct && selectedProduct.image && selectedProduct.image[0]) ? [selectedProduct.image[0]] : [],
        files: [],
        qty: Number(quantity)||0,
        unitPrice: Number(unitPrice)||0,
        totalPrice: (Number(unitPrice)||0)*(Number(quantity)||0),
        isNewProduct: !selectedProduct,
      };
      finalLineItems = [single];
      setLineItems(finalLineItems); // Update state for UI
      console.log('📦 Tạo line item từ form:', single); // Debug
    }

    if (!poSupplier && supplier) setPoSupplier(supplier);
    if (!poDate && date) setPoDate(date);

    const finalInvoice = invoiceNumber && invoiceNumber.trim() ? invoiceNumber.trim() : `PO-${Date.now()}`;

    if (!poSupplier) return showError('Vui lòng nhập tên đơn vị nhập (Supplier)');
    
    console.log('📋 Phiếu nhập mới:', finalInvoice, 'Số sản phẩm:', finalLineItems.length);

    // Check authentication before proceeding with upload
    if (!auth.currentUser) {
      showError('Bạn cần đăng nhập để thực hiện thao tác này!');
      console.error('User not authenticated');
      return;
    }

    try {
      const uid = auth.currentUser.uid;

      // Prepare uploads: invoice image + per-line files; perform parallel uploads with progress
      const liCopy = finalLineItems.map((it:any) => ({ ...it }));
      const uploadEntries: Array<{file: File, lineIndex: number | null, isInvoice?: boolean}> = [];
      if (poImageFile) uploadEntries.push({ file: poImageFile as File, lineIndex: null, isInvoice: true });
      liCopy.forEach((it:any, idx:number) => {
        if (it.files && Array.isArray(it.files) && it.files.length > 0) {
          for (const f of it.files) uploadEntries.push({ file: f, lineIndex: idx });
        }
      });

      let invoiceImageUrl = poImageUrl || '';
      if (uploadEntries.length > 0) {
        setUploading(true);
        setUploadProgress(0);
        try {
          const totalBytes = uploadEntries.reduce((s, e) => s + (e.file.size || 0), 0) || 1;
          const perEntryLast = new Array<number>(uploadEntries.length).fill(0);
          let uploadedBytes = 0;

          const uploadPromises = uploadEntries.map((entry, idx) => new Promise<{url:string, entry:any}>( (resolve, reject) => {
            const safeName = entry.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = entry.isInvoice ? `inventory_images/${finalInvoice}/invoice_${Date.now()}_${safeName}` : `inventory_images/${finalInvoice}/${Date.now()}_${idx}_${safeName}`;
            const sRef = storageRef(storage, path);
            const task = uploadBytesResumable(sRef, entry.file);
            const progressKey = entry.isInvoice ? `invoice-${idx}-${entry.file.name}` : `line-${entry.lineIndex}-${idx}-${entry.file.name}`;
            task.on('state_changed', (snap) => {
              // per-entry aggregate for overall progress
              perEntryLast[idx] = snap.bytesTransferred;
              uploadedBytes = perEntryLast.reduce((a,b)=>a+b,0);
              setUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));
              // per-file progress (percentage)
              try {
                const pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
                setFileUploadProgress(prev => ({ ...prev, [progressKey]: pct, [entry.file.name]: pct }));
              } catch (e) { /* ignore */ }
            }, (err) => {
              console.warn('Upload failed', err);
              // Show specific error message for storage permission issues
              if (err?.code === 'storage/unauthorized') {
                showError('Không có quyền upload file. Vui lòng kiểm tra Storage Rules!');
              }
              reject(err);
            }, async () => {
              try {
                const url = await getDownloadURL(task.snapshot.ref);
                resolve({ url, entry });
              } catch (err) { reject(err); }
            });
          }));

          const results = await Promise.all(uploadPromises);
          // apply URLs to liCopy / invoiceImageUrl
          for (const r of results) {
            if (r.entry.isInvoice) {
              invoiceImageUrl = r.url;
              setPoImageUrl(invoiceImageUrl);
            } else if (typeof r.entry.lineIndex === 'number') {
              const li = liCopy[r.entry.lineIndex];
              if (!li.images) li.images = [];
              li.images.push(r.url);
            }
          }
        } catch (err: any) {
          console.warn('One or more uploads failed', err);
          // Show error to user
          if (err?.code === 'storage/unauthorized') {
            showError('Lỗi quyền truy cập Storage. Vui lòng deploy storage.rules!');
          } else {
            showError('Lỗi khi tải file lên: ' + (err.message || 'Unknown error'));
          }
          // Don't proceed with saving to Firestore if upload failed
          setUploading(false);
          setUploadProgress(0);
          return;
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }
      // update state so UI shows uploaded previews/urls
      setLineItems(liCopy as any);

      if (editMode) {
        // Update existing invoice: compare originalLineItems and current lineItems
        const origByDoc:any = {};
        originalLineItems.forEach((o:any) => { origByDoc[o.docId] = o; });

        // Detect deleted docs
        const currentDocIds = finalLineItems.filter((it:any)=>it.docId).map((it:any)=>it.docId);
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
        for (const it of finalLineItems) {
          const payload = {
            date: poDate || date || new Date().toISOString(),
            supplier: poSupplier || supplier,
            invoiceNumber: finalInvoice,
            notes: poNotes || notes || '',
            productId: it.productId || null,
            productName: it.productName,
            images: it.images || [],
            image: (it.images && it.images[0]) ? it.images[0] : (it.image || ''),
            invoiceImage: (typeof invoiceImageUrl !== 'undefined') ? invoiceImageUrl : (poImageUrl || ''),
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
            // new line: create inventory entry and add/update warehouse only
            try {
              let warehouseId: string | null = null;

              // If the line references an existing productId (from products), we'll try to update that product stock later.
              // If there is no productId (manual entry), create a warehouse doc and reference it via warehouseId.
              if (!it.productId) {
                try {
                  const newWhRef = doc(collection(db, 'warehouse'));
                  await setDoc(newWhRef, {
                    productId: newWhRef.id,
                    productName: it.productName,
                    images: it.images || [],
                    image: (it.images && it.images[0]) ? it.images[0] : (it.image || ''),
                    stock: Number(it.qty) || 0,
                    lastPurchasePrice: Number(it.unitPrice) || 0,
                    lastUpdated: serverTimestamp(),
                    createdFromInvoice: finalInvoice,
                  }, { merge: true });
                  warehouseId = newWhRef.id;
                } catch (err) {
                  console.warn('Failed to create warehouse doc for new line', err);
                }
              }

              const invPayload: any = { ...payload };
              // If this item was linked to an existing product, keep productId; otherwise clear productId and set warehouseId
              if (!it.productId) {
                invPayload.productId = null;
                invPayload.warehouseId = warehouseId;
              } else {
                invPayload.productId = it.productId;
              }

              await addDoc(collection(db, 'inventory_in'), invPayload);
            } catch (err) { console.warn('Failed to create inventory doc', err); }

            // Update product stock (only if productId points to products collection)
            try {
              if (it.productId) {
                const prodRef = doc(db, 'products', it.productId);
                await updateDoc(prodRef, { stock: increment(Number(it.qty) || 0), lastPurchasePrice: Number(it.unitPrice) || 0 });
              }
            } catch (e) { console.warn(e); }

            // Upsert into warehouse: if we had a productId (existing), use that id as warehouse doc id; otherwise we already created warehouse above
            try {
              if (it.productId) {
                // Lấy thông tin đầy đủ từ products collection (trong edit mode)
                const prodRef = doc(db, 'products', it.productId);
                const prodSnap = await getDoc(prodRef);
                
                let warehouseData: any = {
                  productId: it.productId,
                  productName: it.productName,
                  images: it.images || [],
                  image: (it.images && it.images[0]) ? it.images[0] : (it.image || ''),
                  stock: increment(Number(it.qty) || 0),
                  lastPurchasePrice: Number(it.unitPrice) || 0,
                  lastUpdated: serverTimestamp(),
                };
                
                // Nếu sản phẩm có trong products, lấy thêm thông tin
                if (prodSnap.exists()) {
                  const prodData = prodSnap.data();
                  warehouseData = {
                    ...warehouseData,
                    category: prodData.category || '',
                    slug: prodData.slug || '',
                    price: prodData.price || 0,
                    oldPrice: prodData.oldPrice || 0,
                    discount: prodData.discount || 0,
                    description: prodData.description || '',
                    images: (it.images && it.images.length > 0) ? it.images : (prodData.images || prodData.image ? [prodData.image] : []),
                    image: (it.images && it.images[0]) ? it.images[0] : (prodData.image || ''),
                  };
                }
                
                const whRef = doc(db, 'warehouse', it.productId);
                await setDoc(whRef, warehouseData, { merge: true });
              }
            } catch (err) { console.warn(err); }
          }
        }

        showSuccess('Phiếu đã được cập nhật');
      } else {
        // Create new invoice (original behavior)
        for (const it of finalLineItems) {
          // If this is a manual/new product (no productId), create a warehouse doc instead of adding to products
          let warehouseId: string | null = null;
          if (!it.productId) {
            try {
              const newWhRef = doc(collection(db, 'warehouse'));
              await setDoc(newWhRef, {
                productId: newWhRef.id,
                productName: it.productName,
                images: it.images || [],
                image: (it.images && it.images[0]) ? it.images[0] : (it.image || ''),
                stock: Number(it.qty) || 0,
                lastPurchasePrice: Number(it.unitPrice) || 0,
                lastUpdated: serverTimestamp(),
                createdFromInvoice: finalInvoice,
              }, { merge: true });
              warehouseId = newWhRef.id;
            } catch (err) {
              console.warn('Failed to create warehouse doc for new line', err);
            }
          }

          const payload = {
            createdAt: serverTimestamp(),
            date: poDate || date || new Date().toISOString(),
            supplier: poSupplier || supplier,
            invoiceNumber: finalInvoice,
            notes: poNotes || notes || '',
            productId: it.productId || null,
            productName: it.productName,
            images: it.images || [],
            image: (it.images && it.images[0]) ? it.images[0] : (it.image || ''),
            invoiceImage: (typeof invoiceImageUrl !== 'undefined') ? invoiceImageUrl : (poImageUrl || ''),
            qty: Number(it.qty) || 0,
            unitPrice: Number(it.unitPrice) || 0,
            totalPrice: Number(it.totalPrice) || ((Number(it.unitPrice)||0)*(Number(it.qty)||0)),
            adminId: uid,
          };

          // if we created a warehouse doc, attach its id to the inventory record
          if (!it.productId && warehouseId) payload.warehouseId = warehouseId;

          // write inventory entry
          await addDoc(collection(db, 'inventory_in'), payload);

          // update product stock using increment and record latest purchase price
          // update product stock only if item references a real product id
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

          // upsert into warehouse collection: if productId exists, use it as warehouse id; otherwise we already created the warehouse doc
          try {
            if (it.productId) {
              // Lấy thông tin đầy đủ từ products collection
              const prodRef = doc(db, 'products', it.productId);
              const prodSnap = await getDoc(prodRef);
              
              let warehouseData: any = {
                productId: it.productId,
                productName: it.productName,
                images: it.images || [],
                image: (it.images && it.images[0]) ? it.images[0] : (it.image || ''),
                stock: increment(Number(it.qty) || 0),
                lastPurchasePrice: Number(it.unitPrice) || 0,
                lastUpdated: serverTimestamp(),
              };
              
              // Nếu sản phẩm có trong products, lấy thêm thông tin
              if (prodSnap.exists()) {
                const prodData = prodSnap.data();
                warehouseData = {
                  ...warehouseData,
                  category: prodData.category || '',
                  slug: prodData.slug || '',
                  price: prodData.price || 0,
                  oldPrice: prodData.oldPrice || 0,
                  discount: prodData.discount || 0,
                  description: prodData.description || '',
                  // Giữ nguyên images từ inventory nếu có, không thì lấy từ product
                  images: (it.images && it.images.length > 0) ? it.images : (prodData.images || prodData.image ? [prodData.image] : []),
                  image: (it.images && it.images[0]) ? it.images[0] : (prodData.image || ''),
                };
                console.log('✅ Đồng bộ thông tin từ products ->', it.productName);
              }
              
              const whRef = doc(db, 'warehouse', it.productId);
              await setDoc(whRef, warehouseData, { merge: true });
              console.log('✅ Cập nhật warehouse:', it.productId, 'qty:', Number(it.qty));
            }
          } catch (err) {
            console.error('Failed to upsert warehouse doc', err);
          }
        }

        showSuccess(`Đã nhập ${finalLineItems.length} sản phẩm vào kho thành công!`);
        console.log('✅ Phíeu nhập mới:', finalInvoice, 'Số lượng:', finalLineItems.length);
      }

      // reload entries
      console.log('🔄 Reload danh sách phíeu nhập...');
  const snap = await getDocs(collection(db, 'inventory_in'));
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const sortedItems = items.sort((a,b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
      setEntries(sortedItems);
      console.log('✅ Đã tải', sortedItems.length, 'phíeu nhập');
      console.log('Phíeu nhập mới nhất:', sortedItems[0]);

      // Close form modal
      setShowForm(false);

      // reset form and PO
  setSupplier(''); setSelectedProduct(null); setQuantity(1); setDate(''); setUnitPrice(0); setInvoiceNumber(''); setNotes('');
  setPoSupplier(''); setPoDate(''); setPoNotes(''); setLineItems([]);
  setPoImageFile(undefined); setPoImageUrl(''); setProductNameInput(''); setCurrentFiles([]);
  setEditMode(false); setOriginalLineItems([]); setCurrentInvoice('');
    } catch (err:any) {
      console.error('Submit inventory error', err);
      if (err?.code === 'storage/unauthorized') {
        showError('Lỗi quyền truy cập Storage. Hãy chạy: firebase deploy --only storage');
      } else {
        showError(err.message || 'Lỗi khi nhập hàng');
      }
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
            <button className="inventory-btn inventory-btn-accent" onClick={() => setShowForm(s => !s)}>+ Tạo Đơn Nhập Hàng Mới</button>
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

          <button className="inventory-btn inventory-btn-dark" onClick={() => { setManualFilterTick(Date.now()); }}>Áp Dụng Lọc</button>

            <div className="toolbar-extra">
              <button className="inventory-btn inventory-btn-light" onClick={() => setHistoryOpen(true)}>Xem Lịch sử Nhập Kho</button>
            </div>
        </div>

          {/* History modal (grouped by invoice number) */}
          {historyOpen && (
            <div className="modal-overlay" onClick={() => setHistoryOpen(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{maxWidth:900}}>
                <div className="modal-header">
                  <h3>Lịch sử nhập kho</h3>
                  <button aria-label="Đóng" className="modal-close" onClick={() => setHistoryOpen(false)}>✕</button>
                </div>
                <div style={{padding:12}}>
                  <div className="history-list">
                    {(() => {
                      // group entries by invoiceNumber (uses filteredEntries for realtime behavior)
                      const map:any = {};
                      for (const e of filteredEntries) {
                        const key = e.invoiceNumber || '(không có)';
                        if (!map[key]) map[key] = { invoiceNumber: key, supplier: e.supplier || '', date: e.date || e.createdAt || '', totalQty: 0, totalAmount: 0, count: 0 };
                        map[key].totalQty += Number(e.qty) || 0;
                        map[key].totalAmount += Number(e.totalPrice) || 0;
                        map[key].count += 1;
                      }
                      const arr = Object.values(map).sort((a:any,b:any) => {
                        const da = a.date && a.date.toDate ? a.date.toDate().getTime() : (Date.parse(String(a.date)) || 0);
                        const db = b.date && b.date.toDate ? b.date.toDate().getTime() : (Date.parse(String(b.date)) || 0);
                        return db - da;
                      });
                      if (arr.length === 0) return <div>Không có lịch sử nhập kho</div>;
                      return arr.map((inv:any) => (
                        <div key={inv.invoiceNumber} className="history-item">
                          <div className="history-meta">
                            <div style={{fontWeight:700}}>{inv.invoiceNumber}</div>
                            <div style={{fontSize:13,color:'#555'}}>Nhà cung cấp: {inv.supplier || '—'}</div>
                            <div style={{fontSize:13,color:'#555'}}>Dòng: {inv.count} · Tổng SL: {inv.totalQty} · Tổng tiền: {Number(inv.totalAmount || 0).toLocaleString('vi-VN')} ₫</div>
                          </div>
                          <div className="history-actions action-rows">
                            <div className="action-row action-row-top">
                              <button className="inventory-btn inventory-btn-view" onClick={() => { setHistoryOpen(false); openViewInvoice(inv.invoiceNumber); }}>Xem</button>
                              <button className="inventory-btn inventory-btn-edit" onClick={() => { setHistoryOpen(false); openEditInvoice(inv.invoiceNumber); }}>Sửa</button>
                            </div>
                            <div className="action-row action-row-bottom">
                              <button className="inventory-btn inventory-btn-delete" onClick={() => { setHistoryOpen(false); deleteInvoice(inv.invoiceNumber); }}>Xóa</button>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

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

                    <label>Hình ảnh đơn nhập (ảnh hóa đơn)</label>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      {poImageUrl ? (
                        <img src={poImageUrl} alt="invoice" style={{width:88,height:64,objectFit:'cover',borderRadius:6}} />
                      ) : poImageFile ? (
                        <img src={URL.createObjectURL(poImageFile)} alt="invoice-preview" style={{width:88,height:64,objectFit:'cover',borderRadius:6}} />
                      ) : null}
                      <input type="file" accept="image/*" onChange={e=>{
                        const f = e.target.files && e.target.files[0];
                        setPoImageFile(f || undefined);
                        if (!f) return; // don't create preview URL here beyond the file object
                      }} />
                    </div>

                    <label>Ghi chú phiếu</label>
                    <textarea value={poNotes || notes} onChange={e=>{ setPoNotes(e.target.value); setNotes(e.target.value); }} placeholder="Ghi chú chung cho phiếu nhập" />
                  </div>

                  <div className="po-form-right">
                    <label>Tên sản phẩm (hoặc chọn từ kho)</label>
                    <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
                      <input type="text" placeholder="Nhập tên sản phẩm mới hoặc để trống" value={productNameInput} onChange={e=>setProductNameInput(e.target.value)} style={{flex:1}} />
                      <button type="button" className="inventory-btn" onClick={openProductPicker}>🔎 Tìm sản phẩm</button>
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

                    {selectedProduct && (() => {
                      const imgSrc = (selectedProduct.image && Array.isArray(selectedProduct.image) && selectedProduct.image.length > 0) 
                        ? selectedProduct.image[0] 
                        : (selectedProduct.image && typeof selectedProduct.image === 'string') 
                          ? selectedProduct.image 
                          : '';
                      console.log('Selected product image:', imgSrc, 'Full product:', selectedProduct); // Debug
                      
                      return (
                        <div className="selected-product">
                          {imgSrc ? (
                            <img 
                              src={imgSrc} 
                              alt={selectedProduct.name} 
                              style={{width:60,height:60,objectFit:'cover',borderRadius:6,border:'1px solid #ddd'}} 
                              onError={(e:any) => { 
                                console.error('Selected product image error:', imgSrc);
                                e.target.style.display = 'none'; 
                              }}
                            />
                          ) : (
                            <div style={{width:60,height:60,background:'#f0f0f0',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#999'}}>No img</div>
                          )}
                          <div>
                            <div className="pname" style={{fontWeight:600}}>{selectedProduct.name}</div>
                            <div className="pstock" style={{fontSize:12,color:'#666',marginTop:4}}>Hiện có: {selectedProduct.stock || 0}</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* If user is entering a manual product name (not picking from warehouse), allow attaching product images here */}
                    {!selectedProduct && (
                      <div style={{marginTop:8}}>
                        <label>Hình ảnh sản phẩm (nếu có)</label>
                        <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}>
                          <div style={{display:'flex',gap:6}}>
                            {currentFiles && currentFiles.length > 0 && currentFiles.map((f, i) => (
                              <div key={`cf-${i}`} style={{position:'relative'}}>
                                <img src={URL.createObjectURL(f)} alt={f.name} style={{width:64,height:64,objectFit:'cover',borderRadius:6}} />
                                <div style={{position:'absolute',left:0,right:0,bottom:0,height:6,background:'#eee'}}>
                                  <div style={{width:`${fileUploadProgress[f.name] ?? 0}%`,height:'100%',background:'#4caf50'}} />
                                </div>
                              </div>
                            ))}
                          </div>
                          <input type="file" accept="image/*" multiple onChange={e=>{
                            const files = e.target.files ? Array.from(e.target.files) : [];
                            setCurrentFiles(files);
                          }} />
                        </div>
                      </div>
                    )}

                    <div className="line-inputs">
                      <label>Số lượng</label>
                      <input type="number" min={1} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} />

                      <label>Giá nhập (₫ / đơn vị)</label>
                      <input type="number" min={0} step={100} value={unitPrice} onChange={e=>setUnitPrice(Number(e.target.value))} />

                      <button type="button" className="inventory-btn-add-line" onClick={addCurrentToLineItems}>+ Thêm vào phiếu</button>
                    </div>

                    <div className="line-items">
                      <h4>Chi tiết phiếu</h4>
                      {lineItems.length === 0 ? <div>Chưa có dòng nào</div> : (
                        <table className="line-items-table">
                          <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá</th><th>Tổng</th><th>Hình</th><th></th></tr></thead>
                          <tbody>
                            {lineItems.map((it, idx) => (
                              <tr key={idx}>
                                <td>{it.productName}</td>
                                <td><input type="number" min={1} value={it.qty} onChange={e=>updateLineItem(idx, { qty: Number(e.target.value) })} /></td>
                                <td><input type="number" min={0} value={it.unitPrice} onChange={e=>updateLineItem(idx, { unitPrice: Number(e.target.value) })} /></td>
                                <td>{(Number(it.totalPrice)||0).toLocaleString('vi-VN')} ₫</td>
                                <td style={{display:'flex',flexDirection:'column',gap:6}}>
                                  {/* Show previews: local files first, then stored images */}
                                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                    {it.files && it.files.length > 0 && it.files.map((f:File, fi:number) => (
                                      <img key={`f-${fi}`} src={URL.createObjectURL(f)} alt={`preview-${fi}`} style={{width:64,height:64,objectFit:'cover',borderRadius:6,cursor:'pointer'}} onClick={()=>{ setLightboxImages(it.files.map((ff:File)=>URL.createObjectURL(ff))); setLightboxStart(fi); setLightboxOpen(true); }} />
                                    ))}
                                    {(!it.files || it.files.length === 0) && it.images && it.images.length > 0 && it.images.map((u:string, ui:number) => (
                                      <img key={`u-${ui}`} src={u} alt={`img-${ui}`} style={{width:64,height:64,objectFit:'cover',borderRadius:6,cursor:'pointer'}} onClick={()=>{ setLightboxImages(it.images||[]); setLightboxStart(ui); setLightboxOpen(true); }} />
                                    ))}
                                  </div>
                                  {/* previews only in the line list; image uploads happen in the product entry form before adding the line */}
                                </td>
                                <td><button type="button" className="inventory-btn-ghost" onClick={()=>removeLineItem(idx)}>Xóa</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{marginTop:12, display:'flex', gap:8, justifyContent:'flex-end'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                    {uploading ? (
                      <div style={{width:240}}>
                        <div style={{height:8, background:'#eee', borderRadius:4, overflow:'hidden'}}>
                          <div style={{width:`${uploadProgress}%`, height:'100%', background:'#4caf50'}} />
                        </div>
                        <div style={{fontSize:12, color:'#666', marginTop:6}}>{uploadProgress}% đang tải lên...</div>
                      </div>
                    ) : null}
                    <button type="submit" className="inventory-btn-primary" disabled={uploading}>Ghi nhận nhập kho</button>
                  <button type="button" className="inventory-btn-ghost" onClick={()=>{ setShowForm(false); setLineItems([]); }}>Hủy</button>
                  </div>
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
                  {warehouseItems.length === 0 ? <div>Không có sản phẩm trong kho</div> : warehouseItems.map(w => {
                    // Try multiple ways to get image
                    let imgSrc = '';
                    if (w.images && Array.isArray(w.images) && w.images.length > 0) {
                      imgSrc = w.images[0];
                    } else if (w.image && typeof w.image === 'string') {
                      imgSrc = w.image;
                    } else if (w.image && Array.isArray(w.image) && w.image.length > 0) {
                      imgSrc = w.image[0];
                    }
                    
                    console.log(`Warehouse item ${w.productId || w.id} image:`, imgSrc, 'Full item:', w); // Debug
                    
                    return (
                    <div key={w.productId || w.id} className="product-search-item" style={{display:'flex',gap:12,alignItems:'center',padding:8,cursor:'pointer',borderBottom:'1px solid #f0f0f0'}} onClick={()=>handlePickFromWarehouse(w)}>
                      {imgSrc ? (
                        <img 
                          src={imgSrc} 
                          alt={w.productName || 'Product'} 
                          style={{width:64,height:64,objectFit:'cover',borderRadius:8,border:'1px solid #eee'}} 
                          onError={(e:any) => { 
                            console.error('Image load error for', w.productId, imgSrc);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }} 
                        />
                      ) : null}
                      {!imgSrc || true ? (
                        <div style={{width:64,height:64,background:'#f5f5f5',borderRadius:8,display:imgSrc ? 'none' : 'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#999',border:'1px solid #eee'}}>No image</div>
                      ) : null}
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:14}}>{w.productName || w.name || 'Unknown'}</div>
                        <div style={{fontSize:12,color:'#666',marginTop:4}}>Mã: {w.productId || w.id} · Kho: {w.stock || 0}</div>
                      </div>
                      <div style={{marginLeft:'auto'}}>
                        <button className="inventory-btn inventory-btn-dark" onClick={(ev)=>{ ev.stopPropagation(); handlePickFromWarehouse(w); }}>Chọn</button>
                      </div>
                    </div>
                    );
                  })}
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
              {filteredEntries
                .map((en:any) => (
                  <tr key={en.id}>
                    <td>{en.date || (en.createdAt?.toDate ? en.createdAt.toDate().toLocaleString() : '')}</td>
                    <td>{en.supplier}</td>
                    <td>{en.invoiceNumber || ''}</td>
                    <td>{en.productName}</td>
                    <td>{en.qty}</td>
                    <td>{en.unitPrice ? (Number(en.unitPrice).toLocaleString('vi-VN') + ' ₫') : ''}</td>
                    <td>{en.totalPrice ? (Number(en.totalPrice).toLocaleString('vi-VN') + ' ₫') : ''}</td>
                    <td>
                      {(en.images && en.images.length > 0) || en.image ? (
                        <img 
                          src={((en.images && en.images[0]) || en.image)} 
                          alt={en.productName} 
                          style={{width:60,height:60,objectFit:'cover',borderRadius:6,cursor:'pointer',border:'1px solid #eee'}} 
                          onClick={()=>{ const imgs = (en.images && en.images.length>0) ? en.images : (en.image ? [en.image] : []); setLightboxImages(imgs); setLightboxStart(0); setLightboxOpen(true); }} 
                          onError={(e:any) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span style={{fontSize:12,color:'#999'}}>Không có</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="inventory-btn inventory-btn-view" onClick={()=>openViewInvoice(en.invoiceNumber)} title="Xem chi tiết phiếu">
                          👁️ Xem phiếu
                        </button>
                        <button className="inventory-btn inventory-btn-edit" onClick={()=>openEditInvoice(en.invoiceNumber)} title="Chỉnh sửa phiếu">
                          ✏️ Sửa phiếu
                        </button>
                        <button className="inventory-btn inventory-btn-delete" onClick={()=>deleteInvoice(en.invoiceNumber)} title="Xóa phiếu">
                          🗑️ Xóa phiếu
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Invoice view modal (read-only) */}
        {viewInvoiceOpen && (
          <div className="modal-overlay" onClick={() => setViewInvoiceOpen(false)}>
            <div className="modal-content" onClick={(e)=>e.stopPropagation()} role="dialog" aria-modal="true" style={{maxWidth:1000}}>
              <div className="modal-header">
                <h3>Chi tiết phiếu: {viewInvoiceNumber}</h3>
                <button aria-label="Đóng" className="modal-close" onClick={()=>setViewInvoiceOpen(false)}>✕</button>
              </div>
              <div style={{padding:12}}>
                {viewInvoiceMeta && (
                  <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
                    <div style={{flex:1}}>
                      <div><strong>Nhà cung cấp:</strong> {viewInvoiceMeta.supplier}</div>
                      <div><strong>Ngày:</strong> {viewInvoiceMeta.date && viewInvoiceMeta.date.toDate ? viewInvoiceMeta.date.toDate().toLocaleString() : String(viewInvoiceMeta.date || '')}</div>
                      <div><strong>Ghi chú:</strong> {viewInvoiceMeta.notes}</div>
                    </div>
                    <div style={{width:220}}>
                      {viewInvoiceMeta.invoiceImage ? <img src={viewInvoiceMeta.invoiceImage} alt="invoice" style={{width:200,height:140,objectFit:'cover',borderRadius:6,cursor:'pointer'}} onClick={()=>{ setLightboxImages([viewInvoiceMeta.invoiceImage]); setLightboxStart(0); setLightboxOpen(true); }} /> : null}
                    </div>
                  </div>
                )}

                <div>
                  <table className="po-table inv-table" style={{width:'100%'}}>
                    <thead>
                      <tr><th>#</th><th>Sản phẩm</th><th>Số lượng</th><th>Giá</th><th>Tổng</th><th>Hình</th></tr>
                    </thead>
                    <tbody>
                      {viewInvoiceItems.map((it:any, i:number) => (
                        <tr key={it.id || i}>
                          <td>{i+1}</td>
                          <td>{it.productName}</td>
                          <td>{it.qty}</td>
                          <td>{it.unitPrice ? (Number(it.unitPrice).toLocaleString('vi-VN') + ' ₫') : ''}</td>
                          <td>{it.totalPrice ? (Number(it.totalPrice).toLocaleString('vi-VN') + ' ₫') : ''}</td>
                          <td>
                            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                              {(it.images && it.images.length > 0 ? it.images : (it.image ? [it.image] : [])).length > 0 ? (
                                (it.images && it.images.length > 0 ? it.images : (it.image ? [it.image] : [])).map((u:string, ui:number) => (
                                  <img 
                                    key={ui} 
                                    src={u} 
                                    alt={`img-${ui}`} 
                                    style={{width:64,height:64,objectFit:'cover',borderRadius:6,cursor:'pointer',border:'1px solid #eee'}} 
                                    onClick={()=>{ setLightboxImages(it.images && it.images.length>0 ? it.images : (it.image ? [it.image] : [])); setLightboxStart(ui); setLightboxOpen(true); }}
                                    onError={(e:any) => { e.target.style.opacity = '0.3'; }}
                                  />
                                ))
                              ) : (
                                <span style={{fontSize:12,color:'#999'}}>Không có ảnh</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {lightboxOpen && (
          <ImageLightbox images={lightboxImages} startIndex={lightboxStart} onClose={() => setLightboxOpen(false)} />
        )}

        {/* Pagination placeholder */}
        <div className="po-pagination">
          <span>Hiển thị {entries.length} phiếu nhập</span>
          <div className="page-buttons">
            <button className="page-inventory-btn">Trước</button>
            <button className="page-inventory-btn active">1</button>
            <button className="page-inventory-btn">Sau</button>
          </div>
        </div>
      </main>
    </div>
  );
}
