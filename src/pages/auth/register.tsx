import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/src/shared/ui/button';
import { Card } from '@/src/shared/ui/card';
import { Input } from '@/src/shared/ui/input';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Họ tên phải ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải ít nhất 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Đăng ký thất bại');
      }

      toast.success('Chào mừng bạn đến với Tiệm bách hoá Hai Tụi Mình!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 items-center gap-8 bg-slate-50 p-6 py-20 dark:bg-slate-950 lg:grid-cols-2">
      <div className="hidden max-w-xl justify-self-end space-y-6 lg:block">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-5xl font-black uppercase italic leading-tight tracking-tighter">
          Tiệm bách hoá
          <br />
          Hai Tụi Mình.
        </h1>
        <p className="text-lg font-medium leading-relaxed text-muted-foreground">
          Chuyên mỹ phẩm chính hãng, đồ gia dụng tiện ích và đồ công nghệ chất lượng cao với mức giá cạnh tranh hơn phần lớn marketplace.
        </p>
        <ul className="space-y-4">
          {[
            'Sản phẩm cam kết chính hãng 100%',
            'Giá cạnh tranh, tối ưu hơn nhiều sàn',
            'Tích lũy điểm thưởng khi mua sắm',
            'Đặc quyền thành viên theo hạng chi tiêu',
          ].map((text, index) => (
            <motion.li
              key={text}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 text-xs font-bold uppercase tracking-tight text-slate-600 dark:text-slate-400"
            >
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {text}
            </motion.li>
          ))}
        </ul>
      </div>

      <Card className="group relative w-full max-w-xl justify-self-start overflow-hidden border-primary/10 p-8 shadow-2xl">
        <div className="absolute right-0 top-0 h-24 w-24 -mr-12 -mt-12 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />

        <div className="mb-8 space-y-2 text-center lg:text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tight">Tạo tài khoản mới</h2>
          <p className="text-sm font-medium text-muted-foreground">Bắt đầu trải nghiệm mua sắm hiện đại cùng Hai Tụi Mình</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Họ và tên</label>
            <div className="group relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
              <Input
                {...register('name')}
                placeholder="Nguyễn Văn A"
                className="h-12 border-slate-200 bg-slate-50/50 pl-12 transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900/50"
              />
            </div>
            {errors.name && <p className="mt-1 text-xs font-medium text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Email</label>
            <div className="group relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
              <Input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="h-12 border-slate-200 bg-slate-50/50 pl-12 transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900/50"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs font-medium text-red-500">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Mật khẩu</label>
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
              {errors.password && <p className="mt-1 text-xs font-medium text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Xác nhận</label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-12 border-slate-200 bg-slate-50/50 pl-12 pr-12 transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900/50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="h-12 w-full font-bold uppercase tracking-widest italic shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Tham gia ngay <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-primary transition-all hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </Card>
    </div>
  );
};
