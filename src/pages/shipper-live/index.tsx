import { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Navigation, Route, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/src/shared/ui/button';

type CheckpointStatus = 'OUT_FOR_DELIVERY' | 'DELIVERED';
type CheckpointPoint = { lat: number; lng: number; accuracy?: number | null; sentAt?: string; address?: string };

const postCheckpoint = async (code: string, point: CheckpointPoint, status: CheckpointStatus, note: string) => {
  const response = await fetch('/api/orders/checkpoint-location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, status, note, ...point }) });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new Error(payload?.error || payload?.message || 'Không thể lưu checkpoint giao hàng');
  return payload.data;
};

const formatGeoError = (error: any) => {
  if (error?.code === 1) return 'Trình duyệt đang chặn quyền vị trí. Hãy cho phép Location/GPS rồi thử lại.';
  if (error?.code === 2) return 'Thiết bị chưa xác định được vị trí. Hãy bật GPS/Wi-Fi hoặc nhập tọa độ thủ công.';
  if (error?.code === 3) return 'GPS phản hồi quá lâu. Hãy thử lại hoặc nhập tọa độ thủ công từ Google Maps.';
  return error?.message || 'GPS chưa khả dụng trên thiết bị này.';
};

const parseManualLocation = (value: string) => {
  const [latText, lngText] = value.split(',').map((item) => item.trim());
  const lat = Number(latText); const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, accuracy: null };
};

const getCurrentLocation = (waitMs = 25000) => new Promise<GeolocationPosition>((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('Trình duyệt này không hỗ trợ lấy vị trí GPS.'));
  let settled = false;
  const timer = window.setTimeout(() => { if (settled) return; settled = true; reject(new Error('GPS phản hồi quá lâu. Hãy thử lại hoặc nhập tọa độ thủ công.')); }, waitMs);
  navigator.geolocation.getCurrentPosition((position) => { if (settled) return; settled = true; window.clearTimeout(timer); resolve(position); }, (error) => { if (settled) return; settled = true; window.clearTimeout(timer); reject(error); }, { enableHighAccuracy: true, maximumAge: 120000 });
});

export const ShipperLivePage = () => {
  const queryCode = useMemo(() => new URLSearchParams(window.location.search).get('code') || '', []);
  const [code, setCode] = useState(queryCode);
  const [status, setStatus] = useState<CheckpointStatus>('OUT_FOR_DELIVERY');
  const [note, setNote] = useState('Đã đến một điểm trên hành trình giao hàng');
  const [manualLocation, setManualLocation] = useState('');
  const [lastPoint, setLastPoint] = useState<CheckpointPoint | null>(null);
  const [message, setMessage] = useState('Sẵn sàng gửi checkpoint GPS cho đơn hàng này. Trang này không theo dõi realtime để tiết kiệm pin và quota.');
  const [isSending, setIsSending] = useState(false);

  const sendCheckpoint = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return toast.error('Nhập mã đơn hàng trước khi gửi checkpoint');
    try {
      setIsSending(true);
      setMessage('Đang lấy vị trí hiện tại...');
      const manualPoint = manualLocation.trim() ? parseManualLocation(manualLocation) : null;
      if (manualLocation.trim() && !manualPoint) return toast.error('Tọa độ chưa đúng. Nhập dạng: 10.762622, 106.660172');
      const point = manualPoint || await getCurrentLocation().then((position) => ({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null }));
      setMessage('Đang lưu checkpoint và đổi tọa độ thành địa chỉ...');
      const result = await postCheckpoint(trimmedCode, point, status, note.trim());
      const event = result?.event || {};
      setLastPoint({ ...point, sentAt: new Date().toISOString(), address: event.address });
      setMessage(`Đã lưu checkpoint: ${event.address || `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`}`);
      toast.success('Đã gửi checkpoint cho khách theo dõi');
    } catch (error: any) {
      const errorMessage = formatGeoError(error);
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const trackingUrl = code.trim() ? `/tracking?code=${encodeURIComponent(code.trim())}` : '/tracking';

  return <div className="min-h-screen bg-surface-sunken px-4 py-8 md:py-12"><div className="mx-auto flex max-w-3xl flex-col gap-6">
    <section className="rounded-3xl border border-border/50 bg-surface-default p-6 shadow-xl md:p-8"><div className="mb-8 flex items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary">Shipper checkpoint</p><h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">Cập nhật điểm giao</h1><p className="mt-3 max-w-xl text-sm font-bold leading-6 text-muted-foreground">Không gửi GPS realtime. Mỗi lần đến điểm dừng, bấm gửi để lưu tọa độ, server đổi sang địa chỉ và khách sẽ thấy trong timeline.</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MapPin className="h-6 w-6" /></div></div><div className="space-y-4"><label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mã đơn hàng</label><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="VD: HTM-..." className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base font-black outline-none focus:ring-2 focus:ring-primary/20" /><div className="grid gap-3 sm:grid-cols-2"><select value={status} onChange={(event) => setStatus(event.target.value as CheckpointStatus)} className="h-12 rounded-2xl border border-border bg-background px-4 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20"><option value="OUT_FOR_DELIVERY">Đang trên đường giao</option><option value="DELIVERED">Đã giao thành công</option></select><input value={manualLocation} onChange={(event) => setManualLocation(event.target.value)} placeholder="Tọa độ thủ công nếu GPS lỗi" className="h-12 rounded-2xl border border-border bg-background px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20" /></div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="VD: Đã đến cổng chung cư / đang liên hệ khách..." className="min-h-24 w-full rounded-2xl border border-border bg-background p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" /><Button onClick={sendCheckpoint} disabled={isSending} className="h-12 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest">{isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />} Gửi checkpoint hiện tại</Button></div></section>
    <section className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-border/50 bg-surface-default p-5"><MapPin className="mb-3 h-5 w-5 text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tọa độ</p><p className="mt-2 text-sm font-black">{lastPoint ? `${lastPoint.lat.toFixed(6)}, ${lastPoint.lng.toFixed(6)}` : 'Chưa có'}</p></div><div className="rounded-2xl border border-border/50 bg-surface-default p-5"><ShieldCheck className="mb-3 h-5 w-5 text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sai số</p><p className="mt-2 text-sm font-black">{lastPoint?.accuracy ? `${Math.round(lastPoint.accuracy)}m` : 'Chưa có'}</p></div><div className="rounded-2xl border border-border/50 bg-surface-default p-5"><Route className="mb-3 h-5 w-5 text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lần gửi cuối</p><p className="mt-2 text-sm font-black">{lastPoint?.sentAt ? new Date(lastPoint.sentAt).toLocaleTimeString('vi-VN') : 'Chưa gửi'}</p></div></section>
    <section className="rounded-3xl border border-border/50 bg-surface-default p-6"><p className="text-sm font-bold leading-6 text-muted-foreground">{message}</p>{lastPoint?.address && <p className="mt-3 text-sm font-black">{lastPoint.address}</p>}<a href={trackingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center text-sm font-black text-primary underline"><CheckCircle2 className="mr-2 h-4 w-4" /> Mở trang tracking của khách</a></section>
  </div></div>;
};
