
import { SHIPPING_METHODS, calculateShippingPrice } from '@/src/entities/shipping/lib/shipping-engine';
import { ShippingMethodId, ShippingProvider } from '@/src/entities/shipping/model/types';
import { cn } from '@/src/shared/lib/utils';
import { Check, Truck, Zap, Package } from 'lucide-react';
import { motion } from 'motion/react';

const iconMap = {
  [ShippingMethodId.STANDARD]: Package,
  [ShippingMethodId.FAST]: Truck,
  [ShippingMethodId.EXPRESS]: Zap,
};

interface ShippingMethodSelectorProps {
  selected: ShippingMethodId | null;
  onSelect: (methodId: ShippingMethodId) => void;
}

export const ShippingMethodSelector = ({ selected, onSelect }: ShippingMethodSelectorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black font-heading uppercase tracking-tight">Phương thức vận chuyển</h3>
      <div className="grid gap-4">
        {SHIPPING_METHODS.map((method) => {
          const Icon = iconMap[method.id] || Package;
          const isSelected = selected === method.id;
          const price = calculateShippingPrice(method.id);

          return (
            <motion.div
              key={method.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(method.id)}
              className={cn(
                "relative flex items-center gap-5 p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" 
                  : "border-border hover:border-primary/20 hover:bg-muted/50 shadow-sm"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors",
                isSelected ? "bg-primary text-primary-foreground border-primary shadow-lg" : "bg-muted text-muted-foreground border-border"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="font-black text-sm uppercase tracking-tight">{method.name}</p>
                  <p className="font-black text-sm text-primary">
                    {price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Nhận sau: {method.minDays}-{method.maxDays} ngày • Hệ thống {method.provider}
                </p>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg"
                >
                  <Check className="h-4 w-4 stroke-[4px]" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
