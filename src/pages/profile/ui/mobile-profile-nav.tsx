import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  X,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/shared/lib/utils';

interface MobileProfileNavProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: any[];
  onLogout: () => void;
}

export const MobileProfileNav: React.FC<MobileProfileNavProps> = ({
  isOpen,
  onClose,
  menuItems,
  onLogout
}) => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={reduceMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduceMotion ? { y: 0 } : { y: "100%" }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-card border-t border-border/50 rounded-t-[40px] shadow-2xl p-6 pb-12 overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">MENU QUẢN LÝ</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-[24px] transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "bg-muted/40 text-muted-foreground hover:bg-card hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isActive ? "bg-primary-foreground/20" : "bg-card border border-border/50 shadow-sm"
                      )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <ChevronRight className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-30")} />
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-border/50">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-5 rounded-[24px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 font-black uppercase tracking-widest text-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center shadow-sm">
                  <LogOut className="w-5 h-5" />
                </div>
                ĐĂNG XUẤT
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
