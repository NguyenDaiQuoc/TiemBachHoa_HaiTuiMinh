import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  const next = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-[32px] bg-muted/20 border border-black/5 group">
        <AnimatePresence mode="wait">
          <motion.img
            key={images[activeIndex]}
            src={images[activeIndex]}
            alt={productName}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full object-contain p-8"
          />
        </AnimatePresence>

        {/* Navigation Arrows */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            onClick={prev}
            className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-md shadow-xl border border-border/50 hover:bg-background"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={next}
            className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-md shadow-xl border border-border/50 hover:bg-background"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Zoom Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsFullscreen(true)}
          className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-foreground/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-border/50"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={cn(
              "relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all",
              activeIndex === idx ? "border-primary bg-primary/5" : "border-transparent bg-muted/20 hover:border-black/10"
            )}
          >
            <img src={img} alt={`${productName} thumbnail ${idx}`} className="h-full w-full object-cover p-2" />
          </button>
        ))}
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-8"
          >
            <Button
              variant="ghost"
              className="absolute top-8 right-8 font-black text-xs tracking-widest uppercase"
              onClick={() => setIsFullscreen(false)}
            >
              ĐÓNG
            </Button>
            <img src={images[activeIndex]} alt={productName} className="max-h-full max-w-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
