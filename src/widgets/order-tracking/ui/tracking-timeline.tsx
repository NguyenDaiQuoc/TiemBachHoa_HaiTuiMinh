import { ShippingStatus, TrackingEvent } from '@/src/entities/shipping/model/types';
import { cn } from '@/src/shared/lib/utils';
import { AlertCircle, Check, Clock, ExternalLink, MapPin, Truck, Warehouse } from 'lucide-react';
import { motion } from 'motion/react';

const statusConfig: Record<ShippingStatus, { icon: any; color: string }> = {
  [ShippingStatus.PENDING_PICKUP]: { icon: Clock, color: 'text-muted-foreground' },
  [ShippingStatus.PICKED_UP]: { icon: Warehouse, color: 'text-info' },
  [ShippingStatus.IN_TRANSIT]: { icon: Truck, color: 'text-primary' },
  [ShippingStatus.ARRIVED_HUB]: { icon: MapPin, color: 'text-primary' },
  [ShippingStatus.OUT_FOR_DELIVERY]: { icon: Truck, color: 'text-warning' },
  [ShippingStatus.DELIVERED]: { icon: Check, color: 'text-success' },
  [ShippingStatus.DELIVERY_FAILED]: { icon: AlertCircle, color: 'text-destructive' },
  [ShippingStatus.RETURNING]: { icon: AlertCircle, color: 'text-destructive' },
  [ShippingStatus.RETURNED]: { icon: AlertCircle, color: 'text-muted-foreground' },
};

interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: ShippingStatus;
}

export const TrackingTimeline = ({ events, currentStatus }: TrackingTimelineProps) => {
  return (
    <div className="relative space-y-8">
      <div className="absolute bottom-6 left-[19px] top-6 w-0.5 bg-border/40" />

      {events.slice().reverse().map((event, index) => {
        const config = statusConfig[event.status] || statusConfig[currentStatus] || statusConfig[ShippingStatus.PENDING_PICKUP];
        const Icon = config.icon;
        const isFirst = index === 0;
        const carrierUrl = (event as any).carrier?.publicTrackingUrl;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative flex gap-6"
          >
            <div
              className={cn(
                'z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background shadow-sm transition-all duration-500',
                event.isCompleted ? 'scale-110 bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4 md:h-5 md:w-5" />
            </div>

            <div className="flex-1 pb-8 group-last:pb-0">
              <div className="mb-1 flex items-start justify-between gap-4">
                <div>
                  <h4
                    className={cn(
                      'text-xs font-black uppercase tracking-wider transition-colors md:text-sm',
                      isFirst && event.isCompleted ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {event.description}
                  </h4>
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] font-medium italic text-muted-foreground md:text-xs">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {event.location.name}
                  </p>
                  {carrierUrl && (
                    <a
                      href={carrierUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Mở tra cứu ĐVVC
                    </a>
                  )}
                  {(event as any).proofImage && (
                    <img src={(event as any).proofImage} alt="Ảnh minh chứng giao hàng" className="mt-3 h-28 w-28 rounded-2xl border border-border object-cover" />
                  )}
                </div>
                <time className="shrink-0 rounded-full bg-muted/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
