import { useState } from 'react';
import { CheckCircle2, Clock, CreditCard, ImagePlus, Loader2, MapPin, Navigation, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAddDeliveryEvent, useUpdateOrderStatus } from '@/src/entities/order/api/order-api';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  PENDING: {
    label: 'CHỜ XÁC NHẬN',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    icon: Clock,
    description: 'Đơn hàng mới đang chờ quản trị viên phê duyệt.',
  },
  PROCESSING: {
    label: 'ĐANG XỬ LÝ',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    icon: Clock,
    description: 'Sản phẩm đang được đóng gói và chuẩn bị xuất kho.',
  },
  SHIPPED: {
    label: 'ĐANG GIAO',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    icon: Truck,
    description: 'Đơn hàng đã được bàn giao cho đơn vị vận chuyển.',
  },
  DELIVERED: {
    label: 'ĐÃ GIAO',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    icon: CheckCircle2,
    description: 'Khách hàng đã nhận được hàng và hoàn tất thanh toán.',
  },
  CANCELLED: {
    label: 'ĐÃ HỦY',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    icon: XCircle,
    description: 'Đơn hàng đã bị hủy bởi khách hàng hoặc hệ thống.',
  },
};

interface OrderDetailProps {
  order: any;
  onClose: () => void;
  onUpdated?: () => void;
}

const formatShippingAddress = (value: any) => {
  if (!value) return 'Chưa có địa chỉ giao hàng';
  if (typeof value === 'string') {
    try {
      return formatShippingAddress(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (typeof value.street === 'string' && value.street.trim().startsWith('{')) {
    try {
      const parsedStreet = JSON.parse(value.street);
      return formatShippingAddress({ ...parsedStreet, phone: value.phone || parsedStreet.phone });
    } catch {
      // Fall through to the regular address formatter.
    }
  }
  const parts = [value.fullName || value.receiverName || value.name, value.phone, value.address || value.detail || value.street, value.ward, value.district, value.city || value.province]
    .filter(Boolean)
    .map(String);
  return parts.length ? parts.join(' - ') : 'Chưa có địa chỉ giao hàng';
};

const shippingMethodLabel: Record<string, string> = {
  STANDARD: 'Giao tiêu chuẩn',
  FAST: 'Giao nhanh',
  EXPRESS: 'Giao hỏa tốc',
  LOCAL_PICKUP: 'Nhận tại cửa hàng',
};

const formatDateTime = (value: any) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString('vi-VN') : 'Chưa có cập nhật';
};

const getDeliveryEvents = (order: any) => {
  const raw = order.shippingAddress?.deliveryTracking?.events;
  return Array.isArray(raw) ? raw : [];
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const stampProofImage = async (file: File, stamp: string) => {
  const dataUrl = await readFileAsDataUrl(file);
  const image = new Image();
  image.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const maxWidth = 900;
  const scale = Math.min(1, maxWidth / image.width);
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const padding = Math.max(18, Math.round(canvas.width * 0.025));
  const fontSize = Math.max(22, Math.round(canvas.width * 0.035));
  ctx.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  const lines = stamp.split('\n');
  const boxHeight = lines.length * fontSize * 1.35 + padding * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);
  ctx.fillStyle = '#fff';
  lines.forEach((line, index) => ctx.fillText(line, padding, canvas.height - boxHeight + padding + fontSize * (index + 1)));
  return canvas.toDataURL('image/jpeg', 0.68);
};

const parseManualLocation = (value: string) => {
  const [latText, lngText] = value.split(',').map((item) => item.trim());
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

const getBrowserLocation = (options: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Trình duyệt không hỗ trợ lấy vị trí'));
    return;
  }
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

export const OrderDetail = ({ order, onClose, onUpdated }: OrderDetailProps) => {
  const statusMutation = useUpdateOrderStatus();
  const deliveryMutation = useAddDeliveryEvent();
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const currentStatus = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const Icon = currentStatus.icon;
  const shippingAddress = formatShippingAddress(order.shippingAddress);
  const shippingMethod = shippingMethodLabel[order.shippingMethod] || order.shippingMethod || 'Chưa chọn phương thức';
  const deliveryEvents = getDeliveryEvents(order);
  const trackingUrl = `/tracking?code=${encodeURIComponent(order.orderNumber || order.id)}`;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await statusMutation.mutateAsync({ id: order.id, status: newStatus });
      toast.success('Đã cập nhật trạng thái đơn hàng');
      onUpdated?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openTracking = () => window.open(trackingUrl, '_blank', 'noopener,noreferrer');

  const handleStatusAndOpenTracking = async (status: string) => {
    await handleStatusChange(status);
    openTracking();
  };

  const getCurrentLocation = async () => {
    return getBrowserLocation({ enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 4000 });
  };

  const saveDeliveryLocation = async (coords: { lat: number; lng: number } | null, source: 'gps' | 'manual' | 'address') => {
    if (coords) setLastLocation(coords);
    await deliveryMutation.mutateAsync({
      id: order.id,
      status: 'OUT_FOR_DELIVERY',
      lat: coords?.lat,
      lng: coords?.lng,
      address: coords ? `Đã đến vị trí ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : shippingAddress,
      note: deliveryNote || (source === 'manual' ? 'Người giao nhập vị trí thủ công' : source === 'address' ? 'Cập nhật theo địa chỉ đơn vì thiết bị không trả GPS kịp' : 'Người giao cập nhật vị trí'),
    });
    toast.success(coords ? 'Đã cập nhật vị trí giao hàng lên tracking' : 'Đã lưu cập nhật giao hàng theo địa chỉ đơn');
    onUpdated?.();
  };

  const handleCaptureLocation = async () => {
    const manualCoords = manualLocation.trim() ? parseManualLocation(manualLocation) : null;
    if (manualLocation.trim() && !manualCoords) {
      toast.error('Tọa độ chưa đúng. Nhập dạng: 10.762622, 106.660172');
      return;
    }

    try {
      if (manualCoords) {
        await saveDeliveryLocation(manualCoords, 'manual');
        return;
      }

      await saveDeliveryLocation(null, 'address');
      toast.info('Đã lưu mốc tracking theo địa chỉ đơn. Dùng nút GPS nếu cần tọa độ chính xác.');
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu cập nhật giao hàng');
    }
  };

  const handleTryGpsLocation = async () => {
    setIsLocating(true);
    try {
      const position = await getCurrentLocation();
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      await saveDeliveryLocation(coords, 'gps');
    } catch (error: any) {
      try {
        await saveDeliveryLocation(null, 'address');
        toast.info('GPS chưa phản hồi kịp, đã lưu hành trình theo địa chỉ đơn để khách vẫn theo dõi được.');
      } catch (saveError: any) {
        toast.error(saveError.message || 'Không thể lưu cập nhật giao hàng');
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleManualLocation = async () => {
    const coords = parseManualLocation(manualLocation);
    if (!coords) {
      toast.error('Tọa độ chưa đúng. Nhập dạng: 10.762622, 106.660172');
      return;
    }
    try {
      await saveDeliveryLocation(coords, 'manual');
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu tọa độ giao hàng');
    }
  };

  const handleProofFile = async (file?: File) => {
    if (!file) return;
    const coords = lastLocation ? `${lastLocation.lat.toFixed(6)}, ${lastLocation.lng.toFixed(6)}` : 'Chưa lấy tọa độ';
    const stamp = `Hai Tụi Mình - Giao hàng\n${new Date().toLocaleString('vi-VN')}\n${coords}`;
    const stamped = await stampProofImage(file, stamp);
    setProofImage(stamped);
  };

  const handleCompleteDelivery = async () => {
    if (!proofImage) {
      toast.error('Cần tải ảnh minh chứng trước khi hoàn thành đơn');
      return;
    }
    const coords = lastLocation || { lat: 0, lng: 0 };
    await deliveryMutation.mutateAsync({
      id: order.id,
      status: 'DELIVERED',
      lat: coords.lat,
      lng: coords.lng,
      address: lastLocation ? `Đã giao tại ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : shippingAddress,
      note: deliveryNote || 'Đã giao hàng thành công',
      proofImage,
    });
    toast.success('Đã hoàn thành đơn và lưu ảnh minh chứng');
    onUpdated?.();
    openTracking();
  };

  return (
    <div className="space-y-8">
      <div className={cn('flex flex-col items-center gap-6 rounded-[32px] border-2 p-6 sm:flex-row', currentStatus.color)}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20">
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="mb-1 text-[10px] font-black tracking-[0.2em] opacity-80">TRẠNG THÁI HIỆN TẠI</p>
          <h3 className="text-xl font-black">{currentStatus.label}</h3>
          <p className="mt-1 text-[11px] font-bold opacity-70">{currentStatus.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">CHI TIẾT KIỆN HÀNG</h4>
            <div className="overflow-hidden rounded-[32px] border border-border/50 bg-surface-default">
              {order.items.map((item: any) => (
                <div key={item.id} className="group flex items-center gap-4 border-b border-border/30 p-4 last:border-none">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/20 bg-muted/30">
                    <img src={item.image} alt={item.name} className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-[11px] font-black uppercase tracking-tight">{item.name}</h5>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
              <div className="space-y-2 bg-muted/10 p-6">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>TẠM TÍNH</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>PHÍ VẬN CHUYỂN</span>
                  <span>Miễn phí</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2">
                  <span className="text-xs font-black uppercase tracking-widest">TỔNG CỘNG</span>
                  <span className="text-sm font-black text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">TRẠM ĐIỀU HÀNH</h4>
            <div className="grid grid-cols-2 gap-3 rounded-[32px] border border-border/50 bg-surface-default p-6 sm:grid-cols-4">
              <Button variant="outline" onClick={() => handleStatusChange('PROCESSING')} disabled={order.status === 'PROCESSING'} className="h-12 rounded-xl bg-blue-500/5 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-500/10">
                Xác nhận
              </Button>
              <Button variant="outline" onClick={() => handleStatusAndOpenTracking('SHIPPED')} disabled={order.status === 'SHIPPED'} className="h-12 rounded-xl bg-purple-500/5 text-[9px] font-black uppercase tracking-widest text-purple-600 hover:bg-purple-500/10">
                {order.paymentStatus === 'UNPAID' ? 'Bắt đầu vận chuyển' : 'Đã soạn hàng'}
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange('DELIVERED')} disabled={order.status === 'DELIVERED'} className="h-12 rounded-xl bg-emerald-500/5 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/10">
                Hoàn tất
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange('CANCELLED')} disabled={order.status === 'CANCELLED'} className="h-12 rounded-xl bg-rose-500/5 text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-500/10">
                Hủy đơn
              </Button>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">COD TRACKING THỰC TẾ</h4>
            <div className="space-y-4 rounded-[32px] border border-border/50 bg-surface-default p-6">
              <textarea
                value={deliveryNote}
                onChange={(event) => setDeliveryNote(event.target.value)}
                placeholder="VD: Đã đến cổng chung cư / đang liên hệ khách..."
                className="min-h-20 w-full rounded-2xl border border-border bg-background p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <Button type="button" variant="outline" onClick={handleCaptureLocation} disabled={deliveryMutation.isPending} className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest sm:col-span-2">
                  {deliveryMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                  Cập nhật tracking
                </Button>
                <Button type="button" variant="outline" onClick={handleTryGpsLocation} disabled={isLocating || deliveryMutation.isPending} className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
                  Thử GPS
                </Button>
                <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-[10px] font-black uppercase tracking-widest hover:bg-muted sm:col-span-3">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Ảnh minh chứng
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleProofFile(event.target.files?.[0])} />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={manualLocation}
                  onChange={(event) => setManualLocation(event.target.value)}
                  placeholder="Tọa độ thủ công: 10.762622, 106.660172"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button type="button" variant="outline" onClick={handleManualLocation} disabled={deliveryMutation.isPending} className="h-11 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                  Lưu tọa độ
                </Button>
              </div>
              <p className="text-[10px] font-medium leading-relaxed text-muted-foreground">
                Nút cập nhật tracking lưu ngay theo địa chỉ đơn hoặc tọa độ thủ công. GPS chỉ là tùy chọn thêm nếu trình duyệt cho phép lấy vị trí.
              </p>
              {lastLocation && <p className="text-[10px] font-bold text-muted-foreground">Vị trí mới nhất: {lastLocation.lat.toFixed(6)}, {lastLocation.lng.toFixed(6)}</p>}
              {proofImage && <img src={proofImage} alt="Ảnh minh chứng đã đóng dấu" className="max-h-56 w-full rounded-2xl border border-border object-cover" />}
              <Button type="button" onClick={handleCompleteDelivery} disabled={deliveryMutation.isPending || order.status === 'DELIVERED'} className="h-12 w-full rounded-xl text-[10px] font-black uppercase tracking-widest">
                {deliveryMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Hoàn thành đơn
              </Button>
              {deliveryEvents.length > 0 && (
                <div className="space-y-2 border-t border-border/40 pt-4">
                  {deliveryEvents.slice().reverse().map((event: any) => (
                    <div key={event.id} className="rounded-2xl bg-muted/30 p-3 text-[10px] font-bold">
                      <p>{event.address || event.note || 'Đã cập nhật hành trình'}</p>
                      <p className="mt-1 text-muted-foreground">{new Date(event.timestamp).toLocaleString('vi-VN')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">KHÁCH HÀNG</h4>
            <div className="space-y-4 rounded-[32px] border border-border/50 bg-surface-default p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-black uppercase text-primary">
                  {order.user?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase italic">{order.user?.name || 'Khách vãng lai'}</p>
                  <p className="truncate text-[10px] font-bold text-muted-foreground opacity-60">{order.user?.email}</p>
                </div>
              </div>
              <div className="space-y-3 border-t border-border/30 pt-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">ĐỊA CHỈ GIAO HÀNG</p>
                    <p className="text-[10px] font-bold leading-relaxed">{shippingAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">PHƯƠNG THỨC</p>
                    <p className="text-[10px] font-bold">{shippingMethod}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">THANH TOÁN</p>
                    <p className="text-[10px] font-bold">{order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Thanh toán khi nhận hàng (COD)'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">LỊCH SỬ VẬN ĐƠN</h4>
            <div className="relative space-y-6 overflow-hidden rounded-[32px] border border-border/50 bg-surface-default p-6">
              <div className="absolute bottom-6 left-8 top-6 w-0.5 bg-border/30" />
              <div className="relative flex gap-4">
                <div className="z-10 mt-1 h-4 w-4 rounded-full bg-primary ring-4 ring-primary/20" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight">{currentStatus.label}</p>
                  <p className="mt-0.5 text-[9px] font-bold text-muted-foreground">{formatDateTime(order.updatedAt || order.createdAt)}</p>
                </div>
              </div>
              <div className="relative flex gap-4 opacity-40">
                <div className="z-10 mt-1 h-4 w-4 rounded-full bg-border" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight">ĐÃ TẠO ĐƠN HÀNG</p>
                  <p className="mt-0.5 text-[9px] font-bold text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">ORDER TRACKING ID: {order.orderNumber}</p>
        <Button variant="ghost" onClick={onClose} className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
          Đóng chi tiết đơn hàng
        </Button>
      </div>
    </div>
  );
};
