import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Search,
  Bell,
  ChevronLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';

const ADMIN_NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-surface-sunken flex font-sans selection:bg-primary selection:text-white">
      {/* Sidebar - Desktop */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={cn(
          "hidden lg:flex flex-col bg-surface-default border-r border-border/50 sticky top-0 h-screen transition-all duration-300 z-50",
          !isSidebarOpen && "items-center"
        )}
      >
        <div className="p-6 h-20 flex items-center justify-between overflow-hidden">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black text-xl tracking-tighter flex items-center gap-2"
            >
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">H</div>
              <span>ADMIN <span className="text-primary">CORE</span></span>
            </motion.div>
          )}
          {!isSidebarOpen && (
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white mx-auto">H</div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isSidebarOpen && (
                <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full h-12 rounded-xl flex items-center gap-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              !isSidebarOpen && "justify-center p-0"
            )}
            onClick={() => navigate('/')}
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="font-black text-xs uppercase tracking-widest">Storefront</span>}
          </Button>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mt-4 w-full h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors group"
          >
            <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }}>
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-surface-default/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40 px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground hidden md:block">
              {location.pathname === '/admin' ? 'Overview' : location.pathname.split('/').pop()}
            </h2>
          </div>

          <div className="flex items-center gap-6">
             <div className="relative hidden sm:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search orders, products..." 
                  className="h-11 w-64 pl-10 pr-4 rounded-xl bg-surface-sunken border-none text-xs focus:ring-2 ring-primary/20 transition-all font-medium"
                />
             </div>
             
             <button className="h-11 w-11 rounded-xl bg-surface-sunken flex items-center justify-center relative hover:bg-muted transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full border-2 border-surface-default" />
             </button>

             <div className="h-11 w-11 rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-primary/20 transition-all">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
                  alt="Admin" 
                  className="h-full w-full object-cover bg-muted"
                />
             </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
           />
           <motion.div 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className="absolute top-0 left-0 bottom-0 w-[280px] bg-surface-default shadow-2xl flex flex-col"
           >
              <div className="p-6 h-20 flex items-center justify-between border-b border-border/50">
                <div className="font-black text-xl tracking-tighter flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">H</div>
                  <span>ADMIN CORE</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <nav className="flex-1 p-4 space-y-2">
                {ADMIN_NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      isActive ? "bg-primary text-white" : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="p-6 border-t border-border/50">
                 <Button className="w-full h-12 rounded-xl bg-destructive hover:bg-destructive/90 font-black text-[10px] uppercase tracking-widest">
                    Sign Out
                 </Button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};
