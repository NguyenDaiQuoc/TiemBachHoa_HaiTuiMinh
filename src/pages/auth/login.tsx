import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Chrome, Eye, EyeOff, Github, Loader2, Lock, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/src/shared/model/auth-store';
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

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const from = (location.state as any)?.from?.pathname || '/';

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
        'May chu dang tra ve du lieu khong hop le cho dang nhap. Vui long kiem tra lai API production.'
      );
      if (!response.ok) throw new Error(result.error || 'Đăng nhập thất bại');

      setAuth(result.user, result.token);
      toast.success(`Chào mừng trở lại, ${result.user.name || 'bạn'}!`);
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary"
          >
            Welcome Back
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight">Đăng nhập</h1>
          <p className="text-muted-foreground">Tiếp tục mua sắm mỹ phẩm, đồ gia dụng và công nghệ chính hãng với mức giá cạnh tranh.</p>
        </div>

        <Card className="group relative overflow-hidden border-primary/10 p-8 shadow-2xl shadow-primary/10">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="ml-1 text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
                <Input
                  {...register('email')}
                  placeholder="name@example.com"
                  className="h-12 border-slate-200 bg-slate-50/50 pl-12 transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900/50"
                />
              </div>
              {errors.email && <p className="ml-1 text-xs font-medium text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="ml-1 flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mật khẩu</label>
                <Link to="/admin/login" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <Shield className="h-3.5 w-3.5" />
                  Cổng admin
                </Link>
              </div>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-12 border-slate-200 bg-slate-50/50 pl-12 pr-12 transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900/50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="ml-1 text-xs font-medium text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="h-12 w-full text-md font-bold shadow-lg transition-all hover:shadow-primary/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2">Đăng nhập <ArrowRight className="h-4 w-4" /></span>}
            </Button>
          </form>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 font-medium text-muted-foreground dark:bg-slate-950">Hoặc tiếp tục với</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 border-slate-200 font-bold transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
              <Chrome className="mr-2 h-5 w-5" /> Google
            </Button>
            <Button variant="outline" className="h-12 border-slate-200 font-bold transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
              <Github className="mr-2 h-5 w-5" /> GitHub
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm font-medium text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-primary transition-all hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};
