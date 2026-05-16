import { cn } from '@/src/shared/lib/utils';
import { ProductVariant } from '../model/types';

interface VariantGroupProps {
  type: 'color' | 'size' | 'capacity';
  options: ProductVariant[];
  selectedId: string;
  onSelect: (variant: ProductVariant) => void;
}

export const ProductVariantSelector = ({ type, options, selectedId, onSelect }: VariantGroupProps) => {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        CHỌN {type === 'color' ? 'MÀU SẮC' : type === 'size' ? 'KÍCH THƯỚC' : 'DUNG LƯỢNG'}
      </h4>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = option.id === selectedId;

          if (type === 'color') {
            return (
              <button
                key={option.id}
                onClick={() => onSelect(option)}
                className={cn(
                  "group relative h-10 w-10 rounded-full border-2 p-1 transition-all",
                  isSelected ? "border-primary" : "border-black/5 hover:border-black/20"
                )}
                title={option.name}
              >
                <div 
                  className="h-full w-full rounded-full shadow-inner" 
                  style={{ backgroundColor: option.value }} 
                />
                <span className={cn(
                  "absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity",
                  isSelected && "opacity-100"
                )}>
                  {option.name}
                </span>
              </button>
            );
          }

          return (
            <button
              key={option.id}
              onClick={() => onSelect(option)}
              className={cn(
                "h-12 px-6 rounded-2xl border-2 font-black text-xs transition-all",
                isSelected 
                  ? "border-primary bg-primary text-white" 
                  : "border-border/50 bg-surface-default text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
