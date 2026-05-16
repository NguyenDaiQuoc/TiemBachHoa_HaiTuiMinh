import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye,
  Package,
  AlertTriangle,
  ArrowUpDown,
  XCircle,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Trash
} from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/src/entities/product/api/product-api';
import { Product } from '@/src/entities/product/model/types';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/ui/dialog";
import { ProductForm } from './components/product-form';
import { toast } from 'sonner';

export const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;

  const { data: products = [], isLoading } = useProducts({ query: searchQuery });
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const lowStockThreshold = 10;
  const lowStockCount = products.filter((p: Product) => p.stock < lowStockThreshold).length;

  const paginatedProducts = products.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const pageCount = Math.ceil(products.length / pageSize);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Đã xóa sản phẩm');
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const onFormSubmit = async (data: any) => {
    try {
      if (selectedProduct) {
        await updateMutation.mutateAsync({ id: selectedProduct.id, data });
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Đã tạo sản phẩm mới');
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Tổng kho <span className="text-primary italic">Sản phẩm</span></h1>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mt-1 opacity-60">Quản lý kho hàng & Thông tin sản phẩm</p>
        </div>
        <Button 
          onClick={handleCreate}
          className="h-11 rounded-xl px-6 bg-primary font-black text-[10px] uppercase tracking-widest flex gap-2"
        >
          <Plus className="h-4 w-4" /> Thêm sản phẩm mới
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-surface-default p-6 rounded-3xl border border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Package className="h-6 w-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tổng SKU</p>
                  <p className="font-black text-xl">{products.length}</p>
               </div>
            </div>
         </div>
         <div className="bg-surface-default p-6 rounded-3xl border border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sắp hết hàng</p>
                  <p className="font-black text-xl">{lowStockCount}</p>
               </div>
            </div>
         </div>
         <div className="bg-muted p-6 rounded-3xl border border-border/50 flex items-center justify-between border-dashed">
            <div className="flex items-center gap-4 opacity-50">
               <div className="h-12 w-12 rounded-2xl bg-foreground/10 text-foreground flex items-center justify-center">
                  <Plus className="h-6 w-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Danh mục</p>
                  <p className="font-black text-xl">8</p>
               </div>
            </div>
         </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="relative flex-1 w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Tìm theo tên, danh mục..." 
               className="w-full h-12 pl-12 pr-4 bg-surface-default border-2 border-border focus:border-primary/20 rounded-2xl outline-none text-xs font-bold transition-all"
            />
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl border-2 border-border bg-surface-default font-black text-[10px] uppercase tracking-widest flex gap-2">
               <Filter className="h-4 w-4" /> Lọc
            </Button>
            <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl border-2 border-border bg-surface-default font-black text-[10px] uppercase tracking-widest flex gap-2">
               <ArrowUpDown className="h-4 w-4" /> Sắp xếp
            </Button>
         </div>
      </div>

      {/* Product List */}
      <div className="space-y-4">
         <AnimatePresence mode="popLayout">
            {isLoading ? (
               <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
               </div>
            ) : paginatedProducts.map((product: Product, idx: number) => (
               <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "bg-surface-default p-4 sm:p-6 rounded-[32px] border transition-all group hover:shadow-2xl shadow-black/[0.02]",
                    product.stock < lowStockThreshold 
                      ? "border-amber-500/50 bg-amber-50/5" 
                      : "border-border/50 hover:border-primary/30"
                  )}
               >
                  <div className="flex items-center gap-6">
                     <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-muted/30 border border-border/50 p-2 flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        <img src={product.images[0] || product.image} alt={product.name} className="h-full w-full object-contain mix-blend-multiply" />
                     </div>

                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                           <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">{product.category?.name}</p>
                           {product.stock < lowStockThreshold && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest border border-amber-500/20 animate-pulse">Sắp hết hàng</span>
                           )}
                        </div>
                        <h3 className="text-sm sm:text-base font-black uppercase tracking-tight truncate mb-2">{product.name}</h3>
                        <div className="flex items-center gap-10">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">GIÁ BÁN</p>
                              <p className="text-xs font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">TỔN KHO</p>
                              <p className={cn(
                                "text-xs font-black",
                                product.stock < lowStockThreshold ? "text-amber-600" : ""
                              )}>{product.stock} <span className="text-[10px] text-muted-foreground ml-1">SKU</span></p>
                           </div>
                           <div className="space-y-1 hidden sm:block">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">ĐÃ BÁN</p>
                              <p className="text-xs font-black">{product.soldCount}</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsQuickViewOpen(true);
                          }}
                        >
                           <Eye className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => handleEdit(product)}
                        >
                           <Edit3 className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={deleteMutation.isPending}
                          className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                          onClick={() => handleDelete(product.id)}
                        >
                           {deleteMutation.isPending && deleteMutation.variables === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        </Button>
                     </div>
                  </div>
               </motion.div>
            ))}
         </AnimatePresence>

         {/* Pagination */}
         {products.length > pageSize && (
            <div className="mt-8 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/30 rounded-[32px] border border-border/50">
               <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                  Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, products.length)} trên {products.length} kết quả
               </div>
               
               <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                  >
                     <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                     <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 mx-2">
                     {[...Array(pageCount)].map((_, i) => (
                        <Button 
                          key={i}
                          variant={currentPage === i ? "default" : "outline"}
                          className={cn(
                            "h-10 w-10 rounded-xl font-black text-xs",
                            currentPage !== i && "hover:bg-primary/10 hover:text-primary border-none bg-transparent"
                          )}
                          onClick={() => setCurrentPage(i)}
                        >
                          {i + 1}
                        </Button>
                     ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setCurrentPage(prev => Math.min(pageCount - 1, prev + 1))}
                    disabled={currentPage === pageCount - 1}
                  >
                     <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setCurrentPage(pageCount - 1)}
                    disabled={currentPage === pageCount - 1}
                  >
                     <ChevronsRight className="h-4 w-4" />
                  </Button>
               </div>
            </div>
         )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none bg-surface-default shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight italic">
              {selectedProduct ? 'Cập nhật' : 'Thêm'} <span className="text-primary">sản phẩm</span>
            </DialogTitle>
          </DialogHeader>
          <ProductForm 
            initialData={selectedProduct}
            onSubmit={onFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Quick View Modal */}
      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-[32px] border-none bg-surface-default shadow-2xl">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row">
              <div className="p-8 bg-muted/30 flex items-center justify-center md:w-1/2">
                <div className="relative aspect-square w-full">
                  <img 
                    src={selectedProduct.images[0] || selectedProduct.image} 
                    alt={selectedProduct.name} 
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </div>
              </div>
              <div className="p-8 md:w-1/2 space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary italic mb-2">{selectedProduct.category?.name}</p>
                  <h2 className="text-xl font-black uppercase tracking-tight leading-tight">{selectedProduct.name}</h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">GIÁ BÁN NIÊM YẾT</p>
                    <p className="text-lg font-black text-primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedProduct.price)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">TỔN KHO HIỆN TẠI</p>
                    <p className="text-lg font-black">
                      {selectedProduct.stock} <span className="text-xs text-muted-foreground ml-1">SKU</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">MÔ TẢ NGẮN</p>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => {
                      setIsQuickViewOpen(false);
                      handleEdit(selectedProduct);
                    }}
                    className="w-full h-12 rounded-2xl bg-primary font-black text-[10px] uppercase tracking-widest"
                  >
                    Chỉnh sửa chi tiết
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
