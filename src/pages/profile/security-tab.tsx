import React, { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/src/shared/ui/card';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { cn } from '@/src/shared/lib/utils';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { useChangePassword } from '@/src/entities/user/api/user-api';
import { toast } from 'sonner';

const strongPasswordMessage = 'Mật khẩu phải dài 8-32 ký tự, có chữ hoa, số và ký tự đặc biệt';
const isStrongPassword = (value: string) => value.length >= 8 && value.length <= 32 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().refine(isStrongPassword, strongPasswordMessage),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmPassword, { message: 'Mật khẩu xác nhận không khớp', path: ['confirmPassword'] });
type PasswordFormValues = z.infer<typeof passwordSchema>;

export const SecurityTab: React.FC = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const changePasswordMutation = useChangePassword();
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });
  const currentPassword = useWatch({ control, name: 'currentPassword' }) || '';
  const newPassword = useWatch({ control, name: 'newPassword' }) || '';
  const confirmPassword = useWatch({ control, name: 'confirmPassword' }) || '';
  const passwordChecks = useMemo(() => [
    { label: '8-32 ký tự', passed: newPassword.length >= 8 && newPassword.length <= 32 },
    { label: 'Chữ hoa', passed: /[A-Z]/.test(newPassword) },
    { label: 'Số', passed: /\d/.test(newPassword) },
    { label: 'Ký tự đặc biệt', passed: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);
  const strengthScore = passwordChecks.filter((item) => item.passed).length;
  const strengthTone = strengthScore <= 1 ? 'bg-rose-500' : strengthScore < 4 ? 'bg-amber-500' : 'bg-emerald-500';
  const strengthLabel = strengthScore === 0 ? 'Chưa nhập mật khẩu' : strengthScore < 4 ? 'Chưa đủ mạnh' : 'Mật khẩu hợp lệ';
  const passwordsMatch = newPassword.length > 0 && confirmPassword === newPassword;
  const canSubmit = Boolean(currentPassword) && strengthScore === 4 && passwordsMatch && !changePasswordMutation.isPending;
  const onSubmit = async (data: PasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Đã đổi mật khẩu thành công');
      reset();
    } catch (err: any) {
      toast.error(err.message || 'Không thể đổi mật khẩu');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10"><ShieldCheck className="h-8 w-8 text-primary" /></div>
        <h2 className="text-2xl font-black uppercase italic tracking-tight">Mật khẩu & bảo mật</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Bảo vệ tài khoản bằng mật khẩu mạnh</p>
      </div>
      <Card className="border-none bg-white/80 p-8 shadow-soft backdrop-blur-md dark:bg-slate-900/80">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mật khẩu hiện tại</label>
            <div className="group relative"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" /><Input type={showCurrent ? 'text' : 'password'} {...register('currentPassword')} className="h-14 rounded-2xl border-none bg-muted/30 pl-12 pr-12 text-sm font-bold focus:ring-2 focus:ring-primary/20" /><button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary" aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            {errors.currentPassword && <p className="ml-1 text-[10px] font-bold text-rose-500">{errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mật khẩu mới</label>
            <div className="group relative"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" /><Input type={showNew ? 'text' : 'password'} {...register('newPassword')} className="h-14 rounded-2xl border-none bg-muted/30 pl-12 pr-12 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 dark:bg-slate-800/50" /><button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary" aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            {errors.newPassword && <p className="ml-1 text-[10px] font-bold text-rose-500">{errors.newPassword.message}</p>}
            <div className="space-y-3 px-1 pt-1"><div className="flex gap-1">{[1, 2, 3, 4].map((step) => <div key={step} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted dark:bg-slate-800"><div className={cn('h-full transition-all duration-300', step <= strengthScore ? strengthTone : 'bg-transparent')} /></div>)}</div><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className={cn('rounded-full px-2 py-1 uppercase tracking-widest', strengthScore === 4 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>{strengthLabel}</span>{passwordChecks.map((check) => <span key={check.label} className={cn('rounded-full px-2 py-1', check.passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>{check.label}</span>)}</div></div>
          </div>
          <div className="space-y-2"><label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Xác nhận mật khẩu mới</label><div className="group relative"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" /><Input type={showNew ? 'text' : 'password'} {...register('confirmPassword')} className="h-14 rounded-2xl border-none bg-muted/30 pl-12 pr-12 text-sm font-bold focus:ring-2 focus:ring-primary/20 dark:bg-slate-800/50" /></div>{confirmPassword && <p className={cn('ml-1 text-[10px] font-bold', passwordsMatch ? 'text-emerald-600' : 'text-rose-500')}>{passwordsMatch ? 'Mật khẩu xác nhận đã khớp' : 'Mật khẩu xác nhận chưa khớp'}</p>}{errors.confirmPassword && <p className="ml-1 text-[10px] font-bold text-rose-500">{errors.confirmPassword.message}</p>}</div>
          <Button type="submit" disabled={!canSubmit} className="h-14 w-full rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-40">{changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cập nhật mật khẩu</Button>
        </form>
      </Card>
      <div className="flex items-start gap-4 rounded-2xl border border-rose-500/10 bg-rose-500/5 p-6"><ShieldAlert className="mt-0.5 h-5 w-5 text-rose-500" /><div className="space-y-1"><p className="text-xs font-black uppercase tracking-widest text-rose-500">Lưu ý bảo mật</p><p className="text-[11px] leading-relaxed text-muted-foreground">Không dùng lại mật khẩu cũ hoặc mật khẩu đang dùng ở nền tảng khác.</p></div></div>
    </div>
  );
};
