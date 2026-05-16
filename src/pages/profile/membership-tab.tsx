import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownCircle, ArrowUpCircle, Clock, Gift, Star, Trophy, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTransactions } from '@/src/entities/user/api/user-api';
import { calculateLoyalty, getTierSpendRange, TIERS } from '@/src/entities/user/lib/loyalty';
import { formatCurrencyVND } from '@/src/shared/lib/utils';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { Card } from '@/src/shared/ui/card';
import { cn } from '@/src/shared/lib/utils';

export const MembershipTab: React.FC = () => {
  const { user } = useAuthStore();
  const { data: transactions, isLoading: isTransLoading } = useTransactions();
  const [showHistory, setShowHistory] = useState(false);

  const loyalty = useMemo(() => calculateLoyalty(user?.membershipPoints || 0), [user?.membershipPoints]);
  const { points, currentTier, nextTier, progress, tierIndex, pointsToNextTier, estimatedSpend, estimatedSavings } = loyalty;

  const benefits = [
    { title: 'Tích điểm đổi quà', desc: 'Mỗi 10.000đ chi tiêu nhận 1 điểm thưởng', icon: Gift },
    { title: 'Ưu đãi sinh nhật', desc: 'Giảm giá đến 15% cho tháng sinh nhật tùy hạng thành viên', icon: Star },
    { title: 'Giao hàng thuận tiện', desc: 'Miễn phí vận chuyển cho đơn từ 500.000đ theo chương trình thành viên', icon: Zap },
  ];

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden border border-primary/10 bg-primary/5 p-8 shadow-2xl shadow-primary/10">
        <div className="absolute right-0 top-0 h-64 w-64 -mr-32 -mt-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-8 md:flex-row">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-amber-500/30 bg-card shadow-xl">
            <Trophy className="h-12 w-12 text-amber-500" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600">
              Bạn đang là thành viên {currentTier.name.toUpperCase()}
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              {points.toLocaleString('vi-VN')} <span className="ml-1 text-lg font-medium uppercase opacity-50">điểm</span>
            </h2>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-muted-foreground">
                  {nextTier ? `Còn ${pointsToNextTier.toLocaleString('vi-VN')} điểm để lên hạng ${nextTier.name}` : 'Bạn đã đạt hạng cao nhất'}
                </span>
                <span className="font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary" />
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="h-14 rounded-2xl bg-card px-8 text-[10px] font-black uppercase tracking-widest text-foreground shadow-lg transition-all hover:scale-105"
          >
            {showHistory ? 'Đóng lịch sử' : 'Lịch sử điểm'}
          </button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border/50 bg-card p-5 shadow-soft">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chi tiêu quy đổi</p>
          <p className="mt-2 text-2xl font-black">{formatCurrencyVND(estimatedSpend)}</p>
        </Card>
        <Card className="border border-border/50 bg-card p-5 shadow-soft">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tiết kiệm ước tính</p>
          <p className="mt-2 text-2xl font-black">{formatCurrencyVND(estimatedSavings)}</p>
        </Card>
        <Card className="border border-border/50 bg-card p-5 shadow-soft">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mốc kế tiếp</p>
          <p className="mt-2 text-2xl font-black">{nextTier ? nextTier.name : 'Tối đa'}</p>
        </Card>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="border border-border/50 bg-card p-6 shadow-soft">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Clock className="h-4 w-4 text-primary" /> Lịch sử tích lũy
              </h3>
              <div className="space-y-3">
                {isTransLoading ? (
                  <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest opacity-50">Đang tải lịch sử...</div>
                ) : transactions?.length ? (
                  transactions.map((transaction: any) => (
                    <div key={transaction.id} className="group flex items-center justify-between rounded-2xl border border-border/40 bg-background/50 p-4 transition-all hover:border-primary/30">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                            transaction.type === 'EARN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          )}
                        >
                          {transaction.type === 'EARN' ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-tight text-foreground">{transaction.description}</p>
                          <p className="text-[9px] font-bold uppercase opacity-60 text-muted-foreground">
                            {format(new Date(transaction.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={cn(
                            'text-sm font-black tracking-tighter',
                            transaction.type === 'EARN' ? 'text-emerald-500' : 'text-rose-500'
                          )}
                        >
                          {transaction.type === 'EARN' ? '+' : '-'}
                          {transaction.amount.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Điểm</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                      Chưa có giao dịch điểm nào
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <h3 className="ml-2 text-xl font-black uppercase tracking-tight">Các hạng thành viên</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TIERS.map((tier, index) => {
              const isCurrent = index === tierIndex;
              return (
                <Card
                  key={tier.name}
                  className={cn(
                    'relative overflow-hidden border border-border/50 p-6 shadow-soft transition-all duration-300',
                    isCurrent ? 'bg-card ring-2 ring-primary/20' : 'bg-card/80 grayscale hover:grayscale-0'
                  )}
                >
                  <div className={cn('absolute right-0 top-0 h-16 w-16 -mr-8 -mt-8 rounded-full opacity-20', tier.bg)} />
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={cn('text-lg font-black uppercase tracking-tighter', tier.color)}>{tier.name}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {getTierSpendRange(tier)}
                      </p>
                    </div>
                    {isCurrent && (
                      <div className="rounded bg-primary px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">Hiện tại</div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <h3 className="ml-2 text-xl font-black uppercase tracking-tight">Đặc quyền</h3>
          <div className="space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-4 rounded-2xl border border-border/50 bg-card p-4 transition-all hover:bg-muted/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-widest">{benefit.title}</h5>
                  <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
