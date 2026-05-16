import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/src/shared/ui/card';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { cn } from '@/src/shared/lib/utils';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, ShieldAlert, Smartphone } from 'lucide-react';
import { useChangePassword } from '@/src/entities/user/api/user-api';
import { toast } from 'sonner';

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Mật khẩu hiện tại phải có ít nhất 6 ký tự"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu mới"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const SecurityTab: React.FC = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const changePasswordMutation = useChangePassword();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
  });

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Đã đổi mật khẩu thành công');
      reset();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black uppercase italic tracking-tight">MẬT KHẨU & BẢO MẬT</h2>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Đảm bảo tài khoản của bạn luôn được bảo vệ an toàn</p>
      </div>

      <Card className="p-8 border-none shadow-soft bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">MẬT KHẨU HIỆN TẠI</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type={showCurrent ? "text" : "password"} 
                {...register('currentPassword')} 
                className="pl-12 pr-12 h-14 rounded-2xl bg-muted/30 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20"
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                aria-label={showCurrent ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.currentPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">MẬT KHẨU MỚI</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type={showNew ? "text" : "password"} 
                {...register('newPassword')} 
                className="pl-12 pr-12 h-14 rounded-2xl bg-muted/30 dark:bg-slate-800/50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 text-foreground"
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.newPassword.message}</p>}
            
            {/* Strength Indicator */}
            <div className="flex gap-1 px-1 pt-1">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="h-1 flex-1 rounded-full bg-muted dark:bg-slate-800 overflow-hidden">
                  <div className={cn(
                    "h-full transition-all duration-500",
                    step <= 2 ? "bg-rose-500" : step === 3 ? "bg-amber-500" : "bg-emerald-500"
                  )} style={{ width: step <= 0 ? '0%' : '100%', opacity: 0.3 }} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">XÁC NHẬN MẬT KHẨU MỚI</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type={showNew ? "text" : "password"} 
                {...register('confirmPassword')} 
                className="pl-12 pr-12 h-14 rounded-2xl bg-muted/30 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {errors.confirmPassword && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={changePasswordMutation.isPending}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              CẬP NHẬT MẬT KHẨU
            </Button>
          </div>
        </form>
      </Card>

      <div className="pt-8 border-t border-border/50">
        <h3 className="text-sm font-black uppercase italic tracking-widest mb-6 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" /> THIẾT BỊ ĐANG ĐĂNG NHẬP
        </h3>
        <div className="space-y-4">
          {[
            { device: 'iPhone 15 Pro', location: 'TP. Hồ Chí Minh', active: true, icon: Smartphone },
            { device: 'MacBook Pro 14"', location: 'TP. Hồ Chí Minh', active: false, icon: Lock },
          ].map((session, i) => (
            <div key={i} className="flex items-center justify-between p-5 rounded-[24px] bg-white/50 dark:bg-slate-900/50 border border-border/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-muted/30 dark:bg-slate-800 flex items-center justify-center">
                  <session.icon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black uppercase tracking-tight">{session.device}</p>
                    {session.active && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">ĐANG HOẠT ĐỘNG</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{session.location} • {session.active ? 'Vừa mới đây' : '2 ngày trước'}</p>
                </div>
              </div>
              {!session.active && (
                <Button variant="ghost" size="sm" className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10">ĐĂNG XUẤT</Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-4">
        <ShieldAlert className="w-5 h-5 text-rose-500 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-rose-500">Lưu ý bảo mật</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Sử dụng mật khẩu mạnh bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt để bảo vệ tài khoản của bạn khỏi các cuộc tấn công.</p>
        </div>
      </div>
    </div>
  );
};
