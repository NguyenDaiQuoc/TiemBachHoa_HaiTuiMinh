
import { PAYMENT_PROVIDERS, PaymentMethod } from '@/src/entities/payment/model/types';
import { cn } from '@/src/shared/lib/utils';
import { Check, CreditCard, Truck, Wallet, Zap, Landmark } from 'lucide-react';
import { motion } from 'motion/react';

const iconMap = {
  University: Landmark,
  Wallet: Wallet,
  Zap: Zap,
  CreditCard: CreditCard,
  Truck: Truck,
};

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector = ({ selected, onSelect }: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-heading">Phương thức thanh toán</h3>
      <div className="grid gap-3">
        {PAYMENT_PROVIDERS.map((provider) => {
          const Icon = iconMap[provider.icon as keyof typeof iconMap] || CreditCard;
          const isSelected = selected === provider.id;

          return (
            <motion.div
              key={provider.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(provider.id)}
              className={cn(
                "relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-md" 
                  : "border-border hover:border-primary/20 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{provider.name}</p>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                >
                  <Check className="h-4 w-4 stroke-[3px]" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
