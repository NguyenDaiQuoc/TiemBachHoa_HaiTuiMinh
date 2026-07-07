import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuthStore } from '@/src/shared/model/admin-auth-store';
import { isAdminRole } from '@/src/shared/model/auth-utils';
import { readApiResponse } from '@/src/shared/lib/read-api-response';
import { Button } from '@/src/shared/ui/button';
import { Card } from '@/src/shared/ui/card';
import { Input } from '@/src/shared/ui/input';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

const readLoginResponse = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    throw new Error('Máy chủ chưa trả về dữ liệu đăng nhập. Vui lòng kiểm tra cấu hình API production.');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Máy chủ đang trả về dữ liệu không hợp lệ cho đăng nhập. Vui lòng kiểm tra lại API production.');
  }
};

export const AdminLoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAdminAuthStore((state) => state.setAuth);
  const from = (location.state as any)?.from?.pathname || '/admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await readApiResponse<{ user?: any; token?: string; error?: string }>(
        response,
      'Máy chủ đang trả về dữ liệu không hợp lệ cho đăng nhập quản trị. Vui lòng kiểm tra lại API production.'
      );
      if (!response.ok) throw new Error(result.error || 'Đăng nhập quản trị thất bại');
      if (!isAdminRole(result.user?.role)) throw new Error('Tài khoản này không có quyền truy cập khu vực quản trị');

      setAuth(result.user, result.token);
      toast.success(`Xin chào ${result.user.name || result.user.email}, bảng quản trị đã sẵn sàng.`);
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Không thể đăng nhập quản trị');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#451a03_0%,#1c1917_45%,#09090b_100%)] px-4 py-8 text-stone-50 sm:px-6 sm:py-10">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(249,115,22,0.08),transparent_35%,rgba(245,158,11,0.12)_70%,transparent)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative grid w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-black/30 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:max-w-5xl sm:rounded-[40px] lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="flex min-w-0 flex-col justify-between border-b border-white/10 p-5 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-amber-200">
              <ShieldCheck className="h-4 w-4" />
              Admin Access
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl break-words text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Trung tâm điều hành
                <span className="block text-amber-300">Tiệm Bách Hoá Hai Tụi Mình</span>
              </h1>
              <p className="max-w-lg text-sm leading-7 text-stone-300">
                Khu vực dành riêng cho quản trị viên để theo dõi đơn hàng, sản phẩm, khách hàng, voucher và vận hành toàn bộ cửa hàng một cách tập trung.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Đơn hàng', value: 'Theo dõi tức thời' },
              { label: 'Voucher', value: 'Quản lý chiến dịch' },
              { label: 'Khách hàng', value: 'Giữ chân & chăm sóc' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">{item.label}</p>
                <p className="mt-2 text-sm font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 p-5 sm:p-8 lg:p-10">
          <Card className="border-white/10 bg-white p-5 text-stone-950 shadow-none dark:bg-white dark:text-stone-950 sm:p-6">
            <div className="mb-6 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                <Sparkles className="h-3.5 w-3.5" />
                Secure Sign-In
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-stone-950 dark:text-stone-950">Đăng nhập quản trị</h2>
              <p className="text-sm font-medium text-stone-600 dark:text-stone-600">Sử dụng tài khoản được cấp quyền để truy cập khu vực admin.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-stone-700 dark:text-stone-700">Email quản trị</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    {...register('email')}
                    placeholder="admin@haituiminh.com"
                    className="h-12 border-stone-300 bg-white pl-12 text-stone-950 placeholder:text-stone-500 focus:ring-2 focus:ring-amber-500/20 dark:border-stone-300 dark:bg-white dark:text-stone-950 dark:placeholder:text-stone-500"
                  />
                </div>
                {errors.email && <p className="ml-1 text-xs font-medium text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="ml-1 flex items-center justify-between">
                  <label className="text-sm font-bold text-stone-700 dark:text-stone-700">Mật khẩu</label>
                  <Link to="/login" tabIndex={-1} className="text-xs font-semibold text-amber-700 hover:underline">
                    Đăng nhập khách hàng
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 border-stone-300 bg-white pl-12 pr-12 text-stone-950 placeholder:text-stone-500 focus:ring-2 focus:ring-amber-500/20 dark:border-stone-300 dark:bg-white dark:text-stone-950 dark:placeholder:text-stone-500"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="ml-1 text-xs font-medium text-red-500">{errors.password.message}</p>}
              </div>

              <Button type="submit" disabled={isLoading} className="h-12 w-full bg-stone-950 text-sm font-black uppercase tracking-[0.18em] text-white hover:bg-stone-800 dark:bg-stone-950 dark:text-white dark:hover:bg-stone-800">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Vào bảng quản trị <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};
