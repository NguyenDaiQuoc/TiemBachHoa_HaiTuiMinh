import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Heart, Package, Star, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { calculateLoyalty } from '@/src/entities/user/lib/loyalty';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { formatCompactCurrencyVND, formatCurrencyVND } from '@/src/shared/lib/utils';
import { Card } from '@/src/shared/ui/card';
import { ProfileForm } from './ui/profile-form';

export const ProfileTab: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const loyalty = calculateLoyalty(user?.membershipPoints || 0);

  const stats = [
    { label: 'Đơn hàng', value: '12', icon: Package, color: 'bg-indigo-500/10 text-indigo-500' },
    { label: 'Yêu thích', value: '24', icon: Heart, color: 'bg-rose-500/10 text-rose-500' },
    { label: 'Điểm tích lũy', value: loyalty.points.toLocaleString('vi-VN'), icon: Star, color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Đã chi tiêu', value: formatCompactCurrencyVND(loyalty.estimatedSpend), icon: Wallet, color: 'bg-emerald-500/10 text-emerald-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group cursor-default border border-border/50 bg-card p-6 shadow-soft transition-all hover:bg-card">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-2 transition-transform group-hover:scale-110 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-0 transition-all group-hover:opacity-100" />
                </div>
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</h4>
                  <p className="mt-1 text-2xl font-black italic tracking-tighter">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <ProfileForm />

      <Card className="relative overflow-hidden border border-primary/10 bg-primary/5 p-8 shadow-2xl shadow-primary/10">
        <div className="absolute right-0 top-0 h-64 w-64 -mr-32 -mt-32 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
        <div className="relative flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
              Đặc quyền Member <Star className="h-3 w-3 fill-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black uppercase tracking-tighter">
                BẠN ĐÃ TIẾT KIỆM ĐƯỢC {formatCurrencyVND(loyalty.estimatedSavings)}
              </h3>
              <p className="max-w-md text-sm font-medium text-muted-foreground">
                Tiếp tục mua sắm để lên hạng {loyalty.nextTier?.name || loyalty.currentTier.name} và mở thêm ưu đãi riêng theo KPI thành viên.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/flash-sale')}
            className="h-14 rounded-2xl bg-primary px-10 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
          >
            Xem ưu đãi ngay
          </button>
        </div>
      </Card>
    </div>
  );
};
