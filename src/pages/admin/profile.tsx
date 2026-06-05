import { ShieldCheck, Mail, Phone, CalendarClock, Settings2, ShoppingCart, BarChart3, MessageSquareMore } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/src/shared/model/admin-auth-store';
import { Button } from '@/src/shared/ui/button';

const formatJoinedAt = (value?: string | Date) => {
  if (!value) return 'Đang hoạt động';
  return new Date(value).toLocaleString('vi-VN');
};

export const AdminProfile = () => {
  const navigate = useNavigate();
  const user = useAdminAuthStore((state) => state.user);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Hồ sơ quản trị</p>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Không gian vận hành <span className="text-primary">dành cho admin</span>
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground">
            Khu vực hồ sơ riêng cho admin, tách biệt hoàn toàn với trang tài khoản người dùng để quản lý vận hành, hỗ trợ khách hàng và theo dõi hiệu quả bán hàng.
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[36px] border border-border/50 bg-surface-default p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] bg-primary/10 text-3xl font-semibold text-primary">
              {user?.avatar ? <img src={user.avatar} alt={user.name || 'Admin'} className="h-full w-full object-cover" /> : user?.name?.[0] || 'A'}
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                {user?.role || 'ADMIN'}
              </div>
              <h2 className="font-heading text-3xl font-semibold">{user?.name || 'Quản trị viên'}</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                {user?.bio || 'Đang quản lý vận hành cửa hàng, đơn hàng, khách hàng, tồn kho và chương trình ưu đãi.'}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border/50 bg-muted/20 p-5">
              <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                Email
              </p>
              <p className="font-heading text-lg font-semibold">{user?.email || '-'}</p>
            </div>
            <div className="rounded-3xl border border-border/50 bg-muted/20 p-5">
              <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                Số điện thoại
              </p>
              <p className="font-heading text-lg font-semibold">{user?.phone || 'Chưa cập nhật'}</p>
            </div>
            <div className="rounded-3xl border border-border/50 bg-muted/20 p-5 md:col-span-2">
              <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                Trạng thái hoạt động
              </p>
              <p className="font-heading text-lg font-semibold">{formatJoinedAt(user?.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/admin/settings')}
            className="w-full rounded-[32px] border border-border/50 bg-surface-default p-6 text-left shadow-sm transition-all hover:border-primary/30"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Settings2 className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-2xl font-semibold">Cài đặt hệ thống</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Cập nhật thông tin cửa hàng, email liên hệ, hotline và mô tả vận hành.</p>
          </button>

          <button
            onClick={() => navigate('/admin/orders')}
            className="w-full rounded-[32px] border border-border/50 bg-surface-default p-6 text-left shadow-sm transition-all hover:border-primary/30"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-2xl font-semibold">Theo dõi đơn hàng</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Đi tới khu vực điều phối đơn hàng, lọc trạng thái và cập nhật xử lý.</p>
          </button>

          <button
            onClick={() => navigate('/admin/support')}
            className="w-full rounded-[32px] border border-border/50 bg-surface-default p-6 text-left shadow-sm transition-all hover:border-primary/30"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <MessageSquareMore className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-2xl font-semibold">Tư vấn khách hàng</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Mở inbox chăm sóc khách hàng để phản hồi từng cuộc trò chuyện riêng biệt.</p>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="w-full rounded-[32px] border border-border/50 bg-surface-default p-6 text-left shadow-sm transition-all hover:border-primary/30"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-2xl font-semibold">Phân tích kinh doanh</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Xem doanh thu, sản phẩm bán ra và hiệu quả vận hành theo thời gian.</p>
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => navigate('/admin/settings')} className="h-11 rounded-xl px-6 text-sm font-semibold">
          Chỉnh cấu hình admin
        </Button>
      </div>
    </div>
  );
};
