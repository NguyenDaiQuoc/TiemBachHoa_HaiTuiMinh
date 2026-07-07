import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Clock, CreditCard, ImagePlus, Loader2, MapPin, Navigation, PackageCheck, ScanLine, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { reverseAdminGeocode, useAddDeliveryEvent, useBindCarrierTracking, useUpdateOrderStatus } from '@/src/entities/order/api/order-api';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';

type CarrierCode = 'SELF' | 'GHN' | 'GHTK' | 'VIETTEL_POST' | 'SPX';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Clock, description: 'Đơn mới đang chờ quản trị viên xác nhận.' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20', icon: Clock, description: 'Sản phẩm đang được đóng gói và chuẩn bị xuất kho.' },
  SHIPPED: { label: 'Đang giao', color: 'text-purple-600 bg-purple-500/10 border-purple-500/20', icon: Truck, description: 'Đơn đã được bàn giao cho người giao hoặc đơn vị vận chuyển.' },
  OUT_FOR_DELIVERY: { label: 'Đang giao hàng', color: 'text-purple-600 bg-purple-500/10 border-purple-500/20', icon: Truck, description: 'Người giao đang trên đường hoặc vừa cập nhật checkpoint vận chuyển.' },
  DELIVERED: { label: 'Đã giao', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, description: 'Khách đã nhận hàng và đơn đã hoàn tất.' },
  CANCELLED: { label: 'Đã hủy', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20', icon: XCircle, description: 'Đơn đã bị hủy bởi khách, quản trị viên hoặc hệ thống.' },
};

const CARRIER_OPTIONS: Array<{ value: CarrierCode; label: string; helper: string }> = [
  { value: 'SELF', label: 'Tự giao', helper: 'Không live realtime, chỉ lưu checkpoint GPS khi shipper bấm cập nhật.' },
  { value: 'GHN', label: 'Giao Hàng Nhanh', helper: 'Nhập mã vận đơn GHN để trang tracking lấy tiến trình theo API GHN.' },
  { value: 'GHTK', label: 'Giao Hàng Tiết Kiệm', helper: 'Nhập mã vận đơn GHTK để render hành trình từ ĐVVC.' },
  { value: 'VIETTEL_POST', label: 'Viettel Post', helper: 'Nhập mã vận đơn Viettel Post để render hành trình từ ĐVVC.' },
  { value: 'SPX', label: 'SPX Express', helper: 'Nhập mã vận đơn SPX. API sẽ chạy khi production có SPX_TRACKING_URL và SPX_TOKEN nếu endpoint yêu cầu.' },
];

const shippingMethodLabel: Record<string, string> = { STANDARD: 'Giao tiêu chuẩn', FAST: 'Giao nhanh', EXPRESS: 'Giao hỏa tốc', LOCAL_PICKUP: 'Nhận tại cửa hàng' };
const paymentMethodLabel: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  MOMO: 'Ví MoMo',
  ZALOPAY: 'ZaloPay',
  VNPAY: 'VNPAY',
};

const numberOr = (value: unknown, fallback = 0) => (value === null || value === undefined || value === '' ? fallback : Number.isFinite(Number(value)) ? Number(value) : fallback);
const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
const formatDateTime = (value: any) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString('vi-VN') : 'Chưa có cập nhật';
};

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
    } catch {}
  }
  const parts = [value.fullName || value.receiverName || value.name, value.phone, value.address || value.detail || value.street, value.ward, value.district, value.city || value.province]
    .filter(Boolean)
    .map(String);
  return parts.length ? parts.join(' - ') : 'Chưa có địa chỉ giao hàng';
};

const parseManualLocation = (value: string) => {
  const [latText, lngText] = value.split(',').map((item) => item.trim());
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
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
  const scale = Math.min(1, 900 / image.width);
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const padding = Math.max(18, Math.round(canvas.width * 0.025));
  const fontSize = Math.max(20, Math.round(canvas.width * 0.032));
  const lines = stamp.split('\n');
  const boxHeight = lines.length * fontSize * 1.35 + padding * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.64)';
  ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${fontSize}px Arial, sans-serif`;
  lines.forEach((line, index) => ctx.fillText(line, padding, canvas.height - boxHeight + padding + fontSize * (index + 1)));
  return canvas.toDataURL('image/jpeg', 0.7);
};

const getBrowserLocation = (waitMs = 25000) =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Trình duyệt không hỗ trợ GPS.'));
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('GPS phản hồi quá lâu. Hãy thử lại hoặc nhập tọa độ thủ công từ Google Maps.'));
    }, waitMs);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(position);
      },
      (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(error);
      },
      { enableHighAccuracy: true, maximumAge: 120000 }
    );
  });

const geoErrorMessage = (error: any) => {
  if (error?.code === 1) return 'Trình duyệt đang chặn quyền vị trí. Hãy cho phép Location/GPS rồi thử lại.';
  if (error?.code === 2) return 'Thiết bị chưa xác định được vị trí. Hãy bật GPS/Wi-Fi hoặc nhập tọa độ thủ công.';
  if (error?.code === 3) return 'GPS phản hồi quá lâu. Hãy thử lại hoặc nhập tọa độ thủ công từ Google Maps.';
  return error?.message || 'Không thể lấy vị trí từ trình duyệt.';
};

const TrackingCodeScanner = ({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<any>(null);
  const [status, setStatus] = useState('Đưa mã vạch hoặc QR vào khung quét.');

  useEffect(() => {
    if (!open) return;
    let disposed = false;

    const startScanner = async () => {
      try {
        setStatus('Đang mở camera...');
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        if (disposed || !videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          const value = result?.getText()?.trim();
          if (!value) return;
          controlsRef.current?.stop?.();
          onDetected(value);
          toast.success(`Đã quét mã: ${value}`);
          onClose();
        });
        controlsRef.current = controls;
        setStatus('Đang quét. Giữ mã rõ nét trong khung camera.');
      } catch (error: any) {
        setStatus(error?.message || 'Không thể mở camera. Hãy kiểm tra quyền camera hoặc nhập mã thủ công.');
      }
    };

    void startScanner();
    return () => {
      disposed = true;
      controlsRef.current?.stop?.();
      controlsRef.current = null;
    };
  }, [onClose, onDetected, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Camera scan</p>
            <h3 className="text-lg font-black uppercase tracking-tight">Quét mã vận đơn</h3>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
            Đóng
          </Button>
        </div>
        <div className="space-y-4 p-4">
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-black">
            <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-28 -translate-y-1/2 rounded-2xl border-2 border-primary/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
            <ScanLine className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <p className="rounded-2xl bg-muted/40 p-3 text-[11px] font-bold leading-relaxed text-muted-foreground">{status}</p>
        </div>
      </div>
    </div>
  );
};

export const OrderDetail = ({ order, onClose, onUpdated }: { order: any; onClose: () => void; onUpdated?: () => void }) => {
  const statusMutation = useUpdateOrderStatus();
  const deliveryMutation = useAddDeliveryEvent();
  const carrierMutation = useBindCarrierTracking();
  const existingTracking = order.shippingAddress?.deliveryTracking || {};
  const [carrier, setCarrier] = useState<CarrierCode>((existingTracking.mode === 'CARRIER' && existingTracking.carrier ? existingTracking.carrier : 'SELF') as CarrierCode);
  const [trackingCode, setTrackingCode] = useState(existingTracking.carrierTrackingCode || '');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastLocationAddress, setLastLocationAddress] = useState('');
  const [lastMapUrl, setLastMapUrl] = useState('');
  const [locationDiagnostic, setLocationDiagnostic] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const currentStatus = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const Icon = currentStatus.icon;
  const deliveryEvents = Array.isArray(existingTracking.events) ? existingTracking.events : [];
  const selectedCarrier = CARRIER_OPTIONS.find((item) => item.value === carrier) || CARRIER_OPTIONS[0];
  const trackingUrl = `/tracking?code=${encodeURIComponent(order.orderNumber || order.id)}`;
  const shipperCheckpointUrl = `/shipper/live?code=${encodeURIComponent(order.orderNumber || order.id)}`;
  const lineSubtotal = (order.items || []).reduce((sum: number, item: any) => sum + numberOr(item.price) * numberOr(item.quantity), 0);
  const membershipDiscount = numberOr(order.checkoutMeta?.membershipDiscount, 0);
  const subtotal = numberOr(order.subtotal ?? order.checkoutMeta?.subtotal, lineSubtotal);
  const shippingFee = numberOr(order.shippingFee ?? order.checkoutMeta?.shippingFee, Math.max(0, numberOr(order.totalAmount) - Math.max(0, subtotal - membershipDiscount)));
  const paymentMethod = String(order.paymentMethod || order.checkoutMeta?.paymentMethod || '').toUpperCase();
  const paymentLabel = paymentMethodLabel[paymentMethod] || (order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán / COD');

  const handleStatusChange = async (newStatus: string) => {
    try {
      await statusMutation.mutateAsync({ id: order.id, status: newStatus });
      toast.success('Đã cập nhật trạng thái đơn hàng');
      onUpdated?.();
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleBindCarrier = async () => {
    try {
      await carrierMutation.mutateAsync({ id: order.id, carrier, trackingCode: trackingCode.trim() });
      toast.success(carrier === 'SELF' ? 'Đã chuyển sang tự giao' : 'Đã lưu đơn vị vận chuyển và mã vận đơn');
      onUpdated?.();
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu tracking vận chuyển');
    }
  };

  const saveDeliveryLocation = async (coords: { lat: number; lng: number }, source: 'gps' | 'manual') => {
    setLastLocation(coords);
    setLocationDiagnostic('Đang đổi tọa độ thành địa chỉ...');
    const resolved = await reverseAdminGeocode(coords).catch(() => ({
      address: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
      provider: 'COORDINATES',
      mapUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
    }));
    setLastLocationAddress(resolved.address);
    setLastMapUrl(resolved.mapUrl);
    await deliveryMutation.mutateAsync({
      id: order.id,
      status: 'OUT_FOR_DELIVERY',
      lat: coords.lat,
      lng: coords.lng,
      address: resolved.address,
      note: deliveryNote || (source === 'manual' ? 'Người giao nhập tọa độ thủ công.' : 'Người giao cập nhật checkpoint GPS.'),
      mapUrl: resolved.mapUrl,
    });
    setLocationDiagnostic(`Đã lưu checkpoint: ${resolved.address}`);
    toast.success('Đã lưu checkpoint giao hàng');
    onUpdated?.();
  };

  const handleCaptureLocation = async () => {
    const manualCoords = manualLocation.trim() ? parseManualLocation(manualLocation) : null;
    if (manualLocation.trim() && !manualCoords) return toast.error('Tọa độ chưa đúng. Nhập dạng: 10.762622, 106.660172');
    try {
      setIsLocating(true);
      if (manualCoords) return await saveDeliveryLocation(manualCoords, 'manual');
      setLocationDiagnostic('Đang xin GPS hiện tại từ trình duyệt...');
      const position = await getBrowserLocation();
      await saveDeliveryLocation({ lat: position.coords.latitude, lng: position.coords.longitude }, 'gps');
    } catch (error: any) {
      const message = geoErrorMessage(error);
      setLocationDiagnostic(message);
      toast.error(message);
    } finally {
      setIsLocating(false);
    }
  };

  const handleProofFile = async (file?: File) => {
    if (!file) return;
    const coords = lastLocation ? `${lastLocation.lat.toFixed(6)}, ${lastLocation.lng.toFixed(6)}` : 'Chưa lấy tọa độ';
    setProofImage(await stampProofImage(file, `Hai Tụi Mình - Giao hàng\n${new Date().toLocaleString('vi-VN')}\n${coords}`));
  };

  const handleCompleteDelivery = async () => {
    if (!proofImage) return toast.error('Cần tải ảnh minh chứng trước khi hoàn thành đơn');
    if (!lastLocation) return toast.error('Cần lưu checkpoint GPS hoặc tọa độ trước khi hoàn thành đơn');
    await deliveryMutation.mutateAsync({
      id: order.id,
      status: 'DELIVERED',
      lat: lastLocation.lat,
      lng: lastLocation.lng,
      address: lastLocationAddress || `${lastLocation.lat.toFixed(6)}, ${lastLocation.lng.toFixed(6)}`,
      note: deliveryNote || 'Đã giao hàng thành công',
      mapUrl: lastMapUrl || `https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}`,
      proofImage,
    });
    toast.success('Đã hoàn thành đơn và lưu ảnh minh chứng');
    onUpdated?.();
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8">
      <TrackingCodeScanner
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={(value) => setTrackingCode(value)}
      />
      <div className={cn('flex flex-col items-center gap-6 rounded-3xl border-2 p-6 sm:flex-row', currentStatus.color)}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/25"><Icon className="h-8 w-8" /></div>
        <div className="flex-1 text-center sm:text-left">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Trạng thái hiện tại</p>
          <h3 className="text-xl font-black uppercase">{currentStatus.label}</h3>
          <p className="mt-1 text-[11px] font-bold opacity-75">{currentStatus.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <div className="min-w-0 space-y-8">
          <section className="min-w-0 space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chi tiết kiện hàng</h4>
            <div className="overflow-hidden rounded-3xl border border-border/50 bg-surface-default">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="group flex items-center gap-4 border-b border-border/30 p-4 last:border-none">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/20 bg-muted/30">
                    <img src={item.image} alt={item.name} className="h-full w-full object-contain transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-[11px] font-black uppercase tracking-tight">{item.name}</h5>
                    <p className="text-[10px] font-bold text-muted-foreground">{formatMoney(item.price)} x {item.quantity}</p>
                  </div>
                  <p className="text-xs font-black">{formatMoney(numberOr(item.price) * numberOr(item.quantity))}</p>
                </div>
              ))}
              <div className="space-y-2 bg-muted/10 p-6">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground"><span>Tạm tính</span><span>{formatMoney(subtotal)}</span></div>
                {membershipDiscount > 0 && <div className="flex justify-between text-[10px] font-bold text-emerald-600"><span>Ưu đãi thành viên</span><span>-{formatMoney(membershipDiscount)}</span></div>}
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground"><span>Phí vận chuyển</span><span>{shippingFee > 0 ? formatMoney(shippingFee) : 'Miễn phí'}</span></div>
                <div className="flex justify-between border-t border-border/50 pt-2"><span className="text-xs font-black uppercase tracking-widest">Tổng cộng</span><span className="text-sm font-black text-primary">{formatMoney(order.totalAmount)}</span></div>
              </div>
            </div>
          </section>

          <section className="min-w-0 space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trạm điều hành</h4>
            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-border/50 bg-surface-default p-6 sm:grid-cols-4">
              <Button variant="outline" onClick={() => handleStatusChange('PROCESSING')} disabled={order.status === 'PROCESSING'} className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">Xác nhận</Button>
              <Button variant="outline" onClick={() => handleStatusChange('SHIPPED')} disabled={order.status === 'SHIPPED'} className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">Đã soạn hàng</Button>
              <Button variant="outline" onClick={() => handleStatusChange('DELIVERED')} disabled={order.status === 'DELIVERED'} className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">Hoàn tất</Button>
              <Button variant="outline" onClick={() => handleStatusChange('CANCELLED')} disabled={order.status === 'CANCELLED'} className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">Hủy đơn</Button>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tracking vận chuyển</h4>
            <div className="min-w-0 max-w-full space-y-4 overflow-hidden rounded-3xl border border-border/50 bg-surface-default p-4 sm:p-6">
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <select value={carrier} onChange={(event) => setCarrier(event.target.value as CarrierCode)} className="h-11 min-w-0 rounded-xl border border-border bg-background px-3 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20">
                  {CARRIER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} disabled={carrier === 'SELF'} placeholder="Mã vận đơn / scan / paste" className="h-11 min-w-0 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none disabled:opacity-50 focus:ring-2 focus:ring-primary/20" />
                <Button type="button" variant="outline" onClick={() => setIsScannerOpen(true)} disabled={carrier === 'SELF'} className="h-11 min-w-0 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest whitespace-normal leading-4 sm:w-full">
                  <Camera className="mr-2 h-4 w-4" /> Scan
                </Button>
                <Button type="button" variant="outline" onClick={handleBindCarrier} disabled={carrierMutation.isPending} className="h-11 min-w-0 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest whitespace-normal leading-4 sm:w-full">
                  {carrierMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />} Lưu tracking
                </Button>
              </div>
              <p className="min-w-0 break-words rounded-2xl bg-muted/30 p-3 text-[10px] font-bold leading-relaxed text-muted-foreground">{selectedCarrier.helper}</p>
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => window.open(trackingUrl, '_blank', 'noopener,noreferrer')} className="h-11 min-w-0 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest whitespace-normal leading-4 sm:w-full"><Navigation className="mr-2 h-4 w-4" /> Xem tracking khách</Button>
                <Button type="button" variant="outline" onClick={() => window.open(shipperCheckpointUrl, '_blank', 'noopener,noreferrer')} className="h-11 min-w-0 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest whitespace-normal leading-4 sm:w-full"><MapPin className="mr-2 h-4 w-4" /> Link checkpoint tự giao</Button>
              </div>

              {carrier === 'SELF' && (
                <div className="space-y-4 border-t border-border/40 pt-4">
                  <textarea value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} placeholder="VD: Đã đến cổng chung cư / đang liên hệ khách..." className="min-h-20 w-full min-w-0 rounded-2xl border border-border bg-background p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20" />
                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(150px,auto)]">
                    <input value={manualLocation} onChange={(event) => setManualLocation(event.target.value)} placeholder="Tọa độ thủ công: 10.762622, 106.660172" className="h-11 min-w-0 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20" />
                    <Button type="button" variant="outline" onClick={handleCaptureLocation} disabled={isLocating || deliveryMutation.isPending} className="h-11 min-w-0 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest whitespace-normal leading-4">
                      {isLocating || deliveryMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />} Lưu checkpoint
                    </Button>
                  </div>
                  <label className="flex h-12 min-w-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-3 text-[10px] font-black uppercase tracking-widest hover:bg-muted">
                    <ImagePlus className="mr-2 h-4 w-4" /> Ảnh minh chứng
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleProofFile(event.target.files?.[0])} />
                  </label>
                  {locationDiagnostic && <p className="min-w-0 break-words rounded-2xl border border-border/50 bg-muted/30 p-3 text-[10px] font-bold leading-relaxed">{locationDiagnostic}</p>}
                  {lastLocation && <div className="min-w-0 break-words rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-300"><p>{lastLocation.lat.toFixed(6)}, {lastLocation.lng.toFixed(6)}</p><p className="mt-1 text-foreground">{lastLocationAddress}</p>{lastMapUrl && <a href={lastMapUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all underline">Mở Google Maps</a>}</div>}
                  {proofImage && <img src={proofImage} alt="Ảnh minh chứng đã đóng dấu" className="max-h-56 w-full rounded-2xl border border-border object-cover" />}
                  <Button type="button" onClick={handleCompleteDelivery} disabled={deliveryMutation.isPending || order.status === 'DELIVERED'} className="h-12 w-full rounded-xl text-[10px] font-black uppercase tracking-widest"><CheckCircle2 className="mr-2 h-4 w-4" /> Hoàn thành đơn</Button>
                </div>
              )}

              {deliveryEvents.length > 0 && (
                <div className="space-y-2 border-t border-border/40 pt-4">
                  {deliveryEvents.slice().reverse().map((event: any) => <div key={event.id} className="min-w-0 break-words rounded-2xl bg-muted/30 p-3 text-[10px] font-bold"><p>{event.address || event.note || 'Đã cập nhật hành trình'}</p>{event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-primary underline">Mở Google Maps</a>}<p className="mt-1 text-muted-foreground">{formatDateTime(event.timestamp)}</p></div>)}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-8">
          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Khách hàng</h4>
            <div className="space-y-4 rounded-3xl border border-border/50 bg-surface-default p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-black uppercase text-primary">{order.user?.name?.[0] || 'U'}</div>
                <div className="min-w-0"><p className="truncate text-xs font-black uppercase">{order.user?.name || 'Khách vãng lai'}</p><p className="truncate text-[10px] font-bold text-muted-foreground">{order.user?.email}</p></div>
              </div>
              <div className="space-y-3 border-t border-border/30 pt-4">
                <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" /><div><p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Địa chỉ giao hàng</p><p className="text-[10px] font-bold leading-relaxed">{formatShippingAddress(order.shippingAddress)}</p></div></div>
                <div className="flex items-start gap-3"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" /><div><p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Phương thức</p><p className="text-[10px] font-bold">{shippingMethodLabel[order.shippingMethod] || order.shippingMethod || 'Chưa chọn phương thức'}</p></div></div>
                <div className="flex items-start gap-3"><CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" /><div><p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Thanh toán</p><p className="text-[10px] font-bold">{paymentLabel}</p><p className="mt-0.5 text-[9px] font-bold text-muted-foreground">{order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p></div></div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lịch sử vận đơn</h4>
            <div className="relative space-y-6 overflow-hidden rounded-3xl border border-border/50 bg-surface-default p-6">
              <div className="absolute bottom-6 left-8 top-6 w-0.5 bg-border/30" />
              {[{ label: currentStatus.label, time: order.updatedAt || order.createdAt, active: true }, { label: 'Đã tạo đơn hàng', time: order.createdAt, active: false }].map((event) => (
                <div key={event.label} className={cn('relative flex gap-4', !event.active && 'opacity-45')}>
                  <div className={cn('z-10 mt-1 h-4 w-4 rounded-full ring-4', event.active ? 'bg-primary ring-primary/20' : 'bg-border ring-border/20')} />
                  <div><p className="text-[10px] font-black uppercase tracking-tight">{event.label}</p><p className="mt-0.5 text-[9px] font-bold text-muted-foreground">{formatDateTime(event.time)}</p></div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order tracking ID: {order.orderNumber}</p>
        <Button variant="ghost" onClick={onClose} className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">Đóng chi tiết đơn hàng</Button>
      </div>
    </div>
  );
};
