
import { ShippingStatus, TrackingEvent } from '@/src/entities/shipping/model/types';
import { cn } from '@/src/shared/lib/utils';
import { Check, Truck, Package, Clock, MapPin, AlertCircle, Warehouse } from 'lucide-react';
import { motion } from 'motion/react';

const statusConfig: Record<ShippingStatus, { icon: any, color: string }> = {
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
    <div className="space-y-8 relative">
      {/* Background Vertical Line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border/40" />

      {events.slice().reverse().map((event, index) => {
        const config = statusConfig[event.status];
        const Icon = config.icon;
        const isFirst = index === 0;
        
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative flex gap-6"
          >
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-background shadow-sm transition-all duration-500",
              event.isCompleted 
                ? "bg-primary text-primary-foreground shadow-md scale-110" 
                : "bg-muted text-muted-foreground"
            )}>
              <Icon className="h-4 w-4 md:h-5 md:w-5" />
            </div>

            <div className="flex-1 pb-8 group-last:pb-0">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h4 className={cn(
                    "font-black text-xs md:text-sm uppercase tracking-wider transition-colors",
                    isFirst && event.isCompleted ? "text-primary" : "text-foreground"
                  )}>
                    {event.description}
                  </h4>
                  <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium italic">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {event.location.name}
                  </p>
                  {(event as any).proofImage && (
                    <img src={(event as any).proofImage} alt="Ảnh minh chứng giao hàng" className="mt-3 h-28 w-28 rounded-2xl border border-border object-cover" />
                  )}
                </div>
                <time className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-full shrink-0">
                  {new Date(event.timestamp).toLocaleString('vi-VN', { 
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
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
