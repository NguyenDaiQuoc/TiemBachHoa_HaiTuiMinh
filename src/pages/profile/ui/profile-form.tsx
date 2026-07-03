import React, { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { useUpdateProfile, useUpdateAvatar } from '@/src/entities/user/api/user-api';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { User, Mail, Phone, Loader2, Camera, AtSign, Calendar } from 'lucide-react';
import { Card } from '@/src/shared/ui/card';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').or(z.literal('')),
  username: z.string().min(3, 'Username phải có ít nhất 3 ký tự').nullable().or(z.literal('')),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').max(15).nullable().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'HIDDEN']).optional(),
  birthDate: z.string().nullable().or(z.literal('')),
  bio: z.string().max(200, 'Giới thiệu tối đa 200 ký tự').nullable().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

export const ProfileForm: React.FC = () => {
  const { user } = useAuthStore();
  const updateMutation = useUpdateProfile();
  const updateAvatarMutation = useUpdateAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const hasLockedBirthDate = Boolean(user?.birthDate);

  const joinedDate = useMemo(() => {
    if (!user?.createdAt) return '...';
    return new Date(user.createdAt).toLocaleDateString('vi-VN');
  }, [user?.createdAt]);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      username: user?.username || '',
      phone: user?.phone || '',
      gender: user?.gender || 'HIDDEN',
      birthDate: user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
      bio: user?.bio || '',
    },
  });

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB');
      return;
    }

    setIsPreparingAvatar(true);
    try {
      const compressedBase64 = await compressImage(file);
      setPendingAvatar(compressedBase64);
      toast.success('Ảnh đại diện đã sẵn sàng. Nhấn "Lưu thông tin" để cập nhật.');
    } catch {
      toast.error('Không thể xử lý ảnh vừa chọn');
    } finally {
      setIsPreparingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    const profilePayload: Record<string, unknown> = {};

    if (dirtyFields.birthDate && hasLockedBirthDate) {
      toast.warning('Ngày sinh chỉ được thiết lập một lần để bảo vệ ưu đãi sinh nhật.');
      return;
    }

    if (dirtyFields.name) profilePayload.name = data.name.trim();
    if (dirtyFields.username) profilePayload.username = data.username || null;
    if (dirtyFields.phone) profilePayload.phone = data.phone || null;
    if (dirtyFields.gender) profilePayload.gender = data.gender || 'HIDDEN';
    if (dirtyFields.birthDate) profilePayload.birthDate = data.birthDate || null;
    if (dirtyFields.bio) profilePayload.bio = data.bio || null;

    if (!pendingAvatar && Object.keys(profilePayload).length === 0) {
      toast.info('Chưa có thay đổi nào để lưu');
      return;
    }

    try {
      if (pendingAvatar) {
        await updateAvatarMutation.mutateAsync(pendingAvatar);
      }

      if (Object.keys(profilePayload).length > 0) {
        await updateMutation.mutateAsync(profilePayload);
      }

      setPendingAvatar(null);
      toast.success('Đã cập nhật hồ sơ thành công');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    }
  };

  const avatarPreview = pendingAvatar || user?.avatar || null;
  const isSaving = updateMutation.isPending || updateAvatarMutation.isPending;

  return (
    <Card className="p-8 border border-border/50 shadow-soft bg-card/90 backdrop-blur-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-border/50">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center ring-4 ring-background shadow-xl overflow-hidden relative">
                {(isPreparingAvatar || updateAvatarMutation.isPending) && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user?.name || 'Ảnh đại diện'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tight">Cài đặt hồ sơ</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                Thành viên từ: {joinedDate}
              </p>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSaving || isPreparingAvatar}
            className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Lưu thông tin
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8 border-b border-border/50">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Họ và tên</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                {...register('name')}
                placeholder="Nguyễn Văn A"
                className="pl-12 h-14 rounded-2xl bg-muted/30 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</label>
            <div className="relative group">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                {...register('username')}
                placeholder="username_cua_ban"
                className="pl-12 h-14 rounded-2xl bg-muted/30 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {errors.username && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.username.message}</p>}
          </div>

          <div className="space-y-2 opacity-60">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Địa chỉ email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={user?.email || ''} readOnly className="pl-12 h-14 rounded-2xl bg-muted/10 border-none font-bold text-sm cursor-not-allowed" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Số điện thoại</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                {...register('phone')}
                placeholder="09xx xxx xxx"
                className="pl-12 h-14 rounded-2xl bg-muted/30 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {errors.phone && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ngày sinh</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="date"
                {...register('birthDate')}
                disabled={hasLockedBirthDate}
                className="pl-12 h-14 rounded-2xl bg-muted/30 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>
            <p className="ml-1 text-[10px] font-bold leading-relaxed text-muted-foreground">
              {hasLockedBirthDate
                ? 'Ngày sinh đã được khóa để bảo vệ ưu đãi sinh nhật, không thể đổi tháng sinh nhiều lần.'
                : 'Ngày sinh chỉ được nhập một lần. Sau khi lưu sẽ dùng để xét ưu đãi sinh nhật theo hạng thành viên.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Giới tính</label>
            <select
              {...register('gender')}
              className="w-full h-14 px-4 rounded-2xl bg-muted/30 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none text-foreground"
            >
              <option value="HIDDEN" className="bg-background">
                Không tiết lộ
              </option>
              <option value="MALE" className="bg-background">
                Nam
              </option>
              <option value="FEMALE" className="bg-background">
                Nữ
              </option>
              <option value="OTHER" className="bg-background">
                Khác
              </option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Giới thiệu bản thân</label>
          <textarea
            {...register('bio')}
            placeholder="Viết vài dòng giới thiệu về bạn..."
            rows={3}
            className="w-full p-4 rounded-2xl bg-muted/30 border-none font-medium text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none text-foreground"
          />
          {errors.bio && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.bio.message}</p>}
        </div>
      </form>
    </Card>
  );
};
