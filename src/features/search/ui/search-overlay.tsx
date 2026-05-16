import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Clock, Loader2, Package, Search as SearchIcon, Sparkles, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService } from '@/src/entities/product/api/product-service';
import { Button } from '@/src/shared/ui/button';
import { cn } from '@/src/shared/lib/utils';
import { useSearchStore } from '../model/store';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const {
    recentSearches,
    addRecentSearch,
    setQuery,
    clearRecentSearches,
    trendingSearches,
    suggestions,
    setSuggestions,
    instantResults,
    setInstantResults,
    isLoadingSuggestions,
    setLoadingSuggestions,
  } = useSearchStore();

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      setInstantResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await productService.searchProducts(inputValue);
        setInstantResults(results);

        const nextSuggestions = Array.from(
          new Set([
            ...results.map((result) => result.name),
            ...results.map((result) =>
              typeof result.category === 'object' ? result.category.name : result.category
            ),
          ])
        )
          .filter(Boolean)
          .slice(0, 5) as string[];

        setSuggestions(nextSuggestions);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, setInstantResults, setLoadingSuggestions, setSuggestions]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
        return;
      }

      const totalItems = suggestions.length + instantResults.length;
      if (isOpen && totalItems > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        }
      }

      if (event.key === 'Tab' && isOpen && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      const timer = window.setTimeout(() => inputRef.current?.focus(), 150);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        window.clearTimeout(timer);
      };
    }
  }, [instantResults.length, isOpen, onClose, suggestions.length]);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    addRecentSearch(query);
    setQuery(query);
    onClose();
    navigate(`/products?q=${encodeURIComponent(query)}`);
  };

  const overlayContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col md:items-center md:pt-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md transition-all sm:bg-background/40"
          />

          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Tìm kiếm sản phẩm"
            initial={{ y: -20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden border border-border/50 bg-surface-elevated shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] md:rounded-[40px]"
          >
            <div className="sticky top-0 z-10 border-b border-border/50 bg-surface-elevated/80 p-4 backdrop-blur-xl md:p-8">
              <div className="flex items-center gap-4">
                <div className="group relative flex-1">
                  <div className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    {isLoadingSuggestions ? (
                      <Loader2 className="h-full w-full animate-spin" />
                    ) : (
                      <SearchIcon className="h-full w-full" />
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    value={inputValue}
                    onChange={(event) => {
                      setInputValue(event.target.value);
                      setSelectedIndex(-1);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (selectedIndex >= 0) {
                          if (selectedIndex < suggestions.length) {
                            handleSearch(suggestions[selectedIndex]);
                          } else {
                            const product = instantResults[selectedIndex - suggestions.length];
                            navigate(`/product/${product.id}`);
                            onClose();
                          }
                        } else {
                          handleSearch(inputValue);
                        }
                      }
                    }}
                    placeholder="Bạn đang tìm mỹ phẩm, đồ gia dụng hay đồ công nghệ?"
                    className="h-16 w-full rounded-3xl border-2 border-transparent bg-surface-sunken pl-14 pr-12 text-lg font-medium outline-none transition-all placeholder:text-muted-foreground/30 focus:border-primary/20"
                  />
                  {inputValue && (
                    <button
                      onClick={() => setInputValue('')}
                      className="absolute right-6 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-muted transition-transform hover:scale-110"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="flex items-center justify-center rounded-2xl p-4 transition-colors hover:bg-muted md:hidden"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-12 overflow-y-auto p-6 pb-20 md:p-10">
              {inputValue ? (
                <div className="grid gap-12 md:grid-cols-12">
                  <div className="space-y-8 md:col-span-4">
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <Sparkles className="h-3 w-3" /> Gợi ý tìm kiếm
                      </h3>
                      <div className="space-y-1">
                        {suggestions.length > 0 ? (
                          suggestions.map((suggestion, index) => (
                            <button
                              key={suggestion}
                              onClick={() => handleSearch(suggestion)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={cn(
                                'group flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all',
                                selectedIndex === index ? 'bg-primary text-white' : 'hover:bg-surface-sunken'
                              )}
                            >
                              <span className="line-clamp-1 font-bold opacity-80 group-hover:opacity-100">
                                {suggestion}
                              </span>
                              <ArrowRight
                                className={cn(
                                  'h-4 w-4 transition-all',
                                  selectedIndex === index ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                                )}
                              />
                            </button>
                          ))
                        ) : (
                          <p className="p-4 text-xs text-muted-foreground">Đang tìm gợi ý phù hợp...</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 md:col-span-8">
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <Package className="h-3 w-3" /> Sản phẩm liên quan
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {instantResults.map((product, index) => {
                          const globalIndex = index + suggestions.length;

                          return (
                            <button
                              key={product.id}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              onClick={() => {
                                navigate(`/product/${product.id}`);
                                onClose();
                              }}
                              className={cn(
                                'flex items-center gap-4 rounded-3xl border border-transparent p-4 text-left transition-all',
                                selectedIndex === globalIndex
                                  ? 'scale-[1.02] border-primary/20 bg-surface-sunken'
                                  : 'hover:bg-surface-sunken'
                              )}
                            >
                              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="mb-1 line-clamp-1 text-sm font-black uppercase leading-tight">
                                  {product.name}
                                </p>
                                <p className="text-[10px] font-bold tracking-widest text-primary">
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                  }).format(product.price)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {instantResults.length === 0 && !isLoadingSuggestions && (
                        <div className="rounded-[32px] border-2 border-dashed border-border/50 bg-muted/10 p-12 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            Không tìm thấy sản phẩm phù hợp
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-12 md:grid-cols-2">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <Clock className="h-3 w-3" /> Lịch sử tìm kiếm
                      </h3>
                      {recentSearches.length > 0 && (
                        <button
                          onClick={clearRecentSearches}
                          className="h-6 rounded-lg px-2 text-[9px] font-black uppercase tracking-widest text-primary/60 transition-colors hover:bg-primary/5 hover:text-primary"
                        >
                          Xóa tất cả
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      {recentSearches.length > 0 ? (
                        recentSearches.map((searchQuery) => (
                          <button
                            key={searchQuery}
                            onClick={() => handleSearch(searchQuery)}
                            className="group flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all hover:bg-surface-sunken"
                          >
                            <span className="font-bold opacity-80 group-hover:opacity-100">{searchQuery}</span>
                            <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 text-primary transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                          </button>
                        ))
                      ) : (
                        <div className="rounded-[32px] border-2 border-dashed border-border/50 bg-muted/10 p-12 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            Chưa có lịch sử tìm kiếm
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <TrendingUp className="h-3 w-3" /> Xu hướng hôm nay
                    </h3>
                    <div className="space-y-1">
                      {trendingSearches.map((searchQuery) => (
                        <button
                          key={searchQuery}
                          onClick={() => handleSearch(searchQuery)}
                          className="group flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all hover:bg-primary hover:text-white"
                        >
                          <span className="font-bold opacity-80 group-hover:opacity-100">{searchQuery}</span>
                          <div className="h-2 w-2 rounded-full bg-primary transition-colors group-hover:bg-white" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/50 bg-muted/30 p-4 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                {selectedIndex >= 0
                  ? 'Nhấn Enter để chọn'
                  : 'Dùng phím mũi tên để di chuyển • Enter để tìm kiếm'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlayContent, document.body);
};
