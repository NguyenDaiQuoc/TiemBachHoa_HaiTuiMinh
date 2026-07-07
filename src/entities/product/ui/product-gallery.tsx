import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export const ProductGallery = ({ images, productName }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomPoint, setZoomPoint] = useState<{ x: number; y: number } | null>(null);
  const safeImages = images.length ? images : ['/favicon.svg'];

  useEffect(() => {
    setActiveIndex(0);
    setZoomPoint(null);
  }, [productName, images.length]);

  const next = () => setActiveIndex((prev) => (prev + 1) % safeImages.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);

  return (
    <div className="space-y-4">
      <div className="group relative aspect-[4/3] max-h-[560px] rounded-[32px] border border-border/60 bg-muted/20 px-11 py-6 shadow-soft sm:px-14 md:px-16 lg:aspect-[5/4]">
        <div
          className="relative mx-auto h-full max-w-[82%] cursor-zoom-in overflow-hidden rounded-[18px] bg-background shadow-[0_22px_55px_-44px_hsl(var(--foreground))] ring-1 ring-border/40 sm:max-w-[80%]"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setZoomPoint({
              x: ((event.clientX - rect.left) / rect.width) * 100,
              y: ((event.clientY - rect.top) / rect.height) * 100,
            });
          }}
          onMouseLeave={() => setZoomPoint(null)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={safeImages[activeIndex]}
              src={safeImages[activeIndex]}
              alt={productName}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full object-contain"
            />
          </AnimatePresence>

          {zoomPoint && (
            <div
              className="pointer-events-none absolute inset-0 z-20 hidden rounded-[18px] border border-primary/25 bg-background/95 shadow-2xl ring-1 ring-background/70 md:block"
              style={{
                backgroundImage: `url(${safeImages[activeIndex]})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '230%',
                backgroundPosition: `${zoomPoint.x}% ${zoomPoint.y}%`,
              }}
              aria-hidden="true"
            >
              <div className="absolute bottom-4 left-4 rounded-full bg-foreground/75 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-background backdrop-blur">
                Di chuột để xem cận cảnh
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-1/2 z-40 flex -translate-y-1/2 justify-between sm:inset-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            className="pointer-events-auto h-12 w-9 rounded-none bg-transparent text-accent shadow-none hover:bg-transparent hover:text-accent/80 sm:h-16 sm:w-11"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-12 w-12 stroke-[4px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="pointer-events-auto h-12 w-9 rounded-none bg-transparent text-accent shadow-none hover:bg-transparent hover:text-accent/80 sm:h-16 sm:w-11"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="h-12 w-12 stroke-[4px]" />
          </Button>
        </div>

        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsFullscreen(true)}
          className="absolute bottom-4 right-4 z-40 h-10 w-10 rounded-full border border-border/50 bg-background/80 opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100"
          aria-label="Phóng to ảnh"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {safeImages.map((img, idx) => (
          <button
            key={img + idx}
            onClick={() => setActiveIndex(idx)}
            className={cn(
              'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all md:h-[72px] md:w-[72px]',
              activeIndex === idx ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/20 hover:border-black/10'
            )}
            aria-label={`Xem ảnh ${idx + 1}`}
          >
            <img src={img} alt={`${productName} thumbnail ${idx + 1}`} className="h-full w-full object-cover p-1.5" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-8"
          >
            <Button
              variant="ghost"
              className="absolute right-8 top-8 text-xs font-black uppercase tracking-widest"
              onClick={() => setIsFullscreen(false)}
            >
              Đóng
            </Button>
            <img src={safeImages[activeIndex]} alt={productName} className="max-h-full max-w-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
