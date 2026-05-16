import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar, 
  ChevronRight, 
  MoreVertical,
  Star,
  ShoppingBag,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { adminService } from '@/src/entities/admin/api/admin-service';
import { Customer } from '@/src/entities/admin/model/types';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    adminService.getCustomers().then(data => {
      setCustomers(data);
      setIsLoading(false);
    });
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tighter uppercase italic">Quản lý <span className="text-primary italic">Khách hàng</span></h1>
           <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mt-1 opacity-60">Hệ thống CRM & Lịch sử tương tác</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-11 rounded-xl px-6 border-2 border-border font-black text-[10px] uppercase tracking-widest">Gửi thông báo</Button>
           <Button className="h-11 rounded-xl px-6 bg-primary font-black text-[10px] uppercase tracking-widest flex gap-2">Phân hạng khách hàng</Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Tổng khách hàng', value: '3,200', growth: '+12%', icon: Users },
           { label: 'Tỷ lệ quay lại', value: '45.2%', growth: '+5%', icon: ShoppingBag },
           { label: 'Giá trị TB/Đơn', value: '1.2M', growth: '+2%', icon: Star },
           { label: 'Xác minh', value: '2.8K', growth: '+15%', icon: ShieldCheck },
         ].map((stat, idx) => (
            <div key={idx} className="bg-surface-default p-6 rounded-[24px] border border-border/50">
               <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                     <stat.icon className="h-5 w-5" />
                  </div>
                  <span className="text-emerald-500 text-[10px] font-black">{stat.growth}</span>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">{stat.label}</p>
               <p className="text-xl font-black">{stat.value}</p>
            </div>
         ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại..." 
              className="w-full h-12 pl-12 pr-4 bg-surface-default border-2 border-border focus:border-primary/20 rounded-2xl outline-none text-xs font-bold transition-all"
            />
         </div>
         <Button variant="outline" className="h-12 w-full md:w-auto px-6 rounded-2xl border-2 border-border bg-surface-default flex gap-2 font-black text-[10px] uppercase tracking-widest">
            <Filter className="h-4 w-4" /> LỌC ĐỐI TƯỢNG
         </Button>
      </div>

      {/* Customer List */}
      <div className="grid lg:grid-cols-2 gap-6">
         {isLoading ? (
            <div className="col-span-full py-20 flex justify-center">
               <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
         ) : filteredCustomers.map((customer) => (
            <motion.div 
               key={customer.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-surface-default p-6 rounded-[32px] border border-border/50 group hover:border-primary/20 transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></Button>
               </div>
               
               <div className="h-20 w-20 rounded-[24px] overflow-hidden bg-muted border-4 border-border flex-shrink-0">
                  <img src={customer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name}`} alt={customer.name} className="h-full w-full object-cover" />
               </div>

               <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-black text-base uppercase tracking-tight mb-1">{customer.name}</h3>
                    <div className="flex flex-wrap gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                       <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {customer.email}</span>
                       <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {customer.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-surface-sunken rounded-2xl">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40">TỔNG ĐƠN</p>
                        <p className="text-xs font-black">{customer.totalOrders} đơn</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40">CHI TIÊU</p>
                        <p className="text-xs font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.totalSpent)}</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Hoạt động</span>
                     </div>
                     <Button variant="ghost" className="h-8 px-4 text-[9px] font-black uppercase tracking-widest flex gap-2 group-hover:text-primary transition-colors">
                        Xem chi tiết <ArrowRight className="h-3 w-3" />
                     </Button>
                  </div>
               </div>
            </motion.div>
         ))}
      </div>
    </div>
  );
};
