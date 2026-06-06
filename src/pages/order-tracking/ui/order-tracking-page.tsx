import { TrackingTimeline } from '@/src/widgets/order-tracking/ui/tracking-timeline';
import { DeliveryMap } from '@/src/features/order-tracking/ui/delivery-map';
import { useCheckoutStore } from '@/src/features/checkout/model/checkout-store';
import { ShipmentDetails } from '@/src/entities/shipping/model/types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Package, MapPin, Calendar, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const OrderTrackingPage = () => {
  const { currentOrder } = useCheckoutStore();
  const queryCode = useMemo(() => new URLSearchParams(window.location.search).get('code') || '', []);
  const initialCode = queryCode || currentOrder?.trackingId || currentOrder?.orderNumber || '';
  const [searchId, setSearchId] = useState(initialCode);
  const [activeTrackingId, setActiveTrackingId] = useState(initialCode);
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async (code: string, isSilent = false) => {
    const normalizedCode = code.trim();
    if (!normalizedCode) return;

    if (!isSilent) setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/track?code=${encodeURIComponent(normalizedCode)}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || payload?.message || 'Không thể tải thông tin đơn hàng');
      }

      setShipment(payload.data as ShipmentDetails);
      setActiveTrackingId(normalizedCode);
    } catch (err) {
      setShipment(null);
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin vận chuyển. Vui lòng thử lại sau.');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCode) fetchTracking(initialCode, true);
  }, [fetchTracking, initialCode]);

  useEffect(() => {
    if (!activeTrackingId || !shipment) return;
    const interval = window.setInterval(() => fetchTracking(activeTrackingId, true), 30000);
    return () => window.clearInterval(interval);
  }, [activeTrackingId, fetchTracking, shipment]);

  const handleSearch = () => {
    if (!searchId.trim()) return;
    fetchTracking(searchId);
  };

  return (
    <div className="bg-surface-sunken">
      <AnimatePresence>
        {shipment && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="sticky top-[64px] z-50 w-full bg-surface-default/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 md:hidden flex justify-between items-center shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <span className="truncate text-[10px] font-black tracking-widest text-muted-foreground">{shipment.trackingId}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-black text-muted-foreground uppercase">Dự kiến:</span>
              <span className="text-xs font-black text-primary">
                {new Date(shipment.estimatedArrival).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-12 md:py-24 max-w-7xl">
        <div className="space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20"
              >
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Theo dõi đơn hàng thật</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-8xl font-black font-heading tracking-tighter leading-[0.85] uppercase"
              >
                Theo dõi <br />
                <span className="text-primary italic">lộ trình</span>
              </motion.h1>
              <p className="text-muted-foreground text-xl max-w-lg leading-relaxed">
                Nhập mã đơn hàng hoặc mã vận đơn để xem trạng thái đang lưu trong hệ thống Hai Tụi Mình.
              </p>
            </div>

            <div className="relative w-full md:w-[500px]">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Nhập mã đơn hàng (VD: HTM-...)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full h-20 pl-16 pr-36 sm:pr-40 rounded-[32px] border-2 border-border/50 focus:border-primary transition-all outline-none bg-surface-default font-black text-base sm:text-lg shadow-2xl group-hover:border-primary/20"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !searchId.trim()}
                  className="absolute right-3 top-3 h-14 rounded-[24px] font-black px-5 sm:px-10 bg-primary hover:bg-black text-white shadow-xl transition-all"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Tra cứu'}
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLoading && !shipment ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-32 flex flex-col items-center justify-center space-y-4"
              >
                <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="font-bold text-muted-foreground animate-pulse uppercase tracking-widest text-xs">Đang tải dữ liệu đơn hàng...</p>
              </motion.div>
            ) : shipment ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid lg:grid-cols-12 gap-8 items-start"
              >
                <div className="lg:col-span-4 space-y-6 order-1">
                  <div className="p-8 bg-surface-default rounded-[32px] border border-border/50 shadow-xl shadow-foreground/[0.02] space-y-8 relative overflow-hidden group">
                    <div className="relative flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                        <Package className="h-7 w-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Mã đơn hàng</p>
                        <p className="font-black text-xl tracking-tight break-all">{shipment.trackingId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Đơn vị</span>
                        </div>
                        <p className="text-sm font-black text-primary">{shipment.provider}</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-primary">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Dự kiến</span>
                        </div>
                        <p className="text-sm font-black">{new Date(shipment.estimatedArrival).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-dashed border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Địa chỉ nhận</span>
                      </div>
                      <p className="text-xs font-bold leading-relaxed text-foreground/80">{shipment.destination.name}</p>
                    </div>

                    <Button variant="outline" className="w-full h-12 rounded-2xl group border-2 font-black text-xs hover:bg-black hover:text-white transition-all">
                      Chi tiết đơn hàng
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>

                  <div className="hidden lg:block">
                    <DeliveryMap shipment={shipment} className="h-[300px]" />
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-6 order-2">
                  <div className="lg:hidden">
                    <DeliveryMap shipment={shipment} />
                  </div>

                  <div className="bg-surface-default rounded-[32px] border border-border/50 p-8 md:p-10 shadow-xl shadow-foreground/[0.02]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
                      <h3 className="text-2xl font-black font-heading flex items-center gap-4">
                        Nhật ký đơn hàng
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                        </span>
                      </h3>
                      <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 self-start sm:self-auto">
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider">{shipment.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <TrackingTimeline events={shipment.events} currentStatus={shipment.status} />
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center space-y-6">
                <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                  <Package className="h-10 w-10 opacity-50" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-heading text-destructive uppercase">Không tìm thấy đơn hàng</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto font-medium">{error}</p>
                </div>
                <Button onClick={() => fetchTracking(searchId)} variant="outline" className="rounded-full px-8">Thử lại</Button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-muted/10 border-2 border-dashed border-border rounded-[48px] py-40 text-center space-y-8"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="h-32 w-32 bg-muted/50 rounded-full flex items-center justify-center mx-auto shadow-inner"
                >
                  <Package className="h-12 w-12 text-muted-foreground/30" />
                </motion.div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black font-heading uppercase text-muted-foreground/60">Chưa có thông tin vận chuyển</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto font-medium">Vui lòng nhập mã đơn hàng để bắt đầu theo dõi trạng thái.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
