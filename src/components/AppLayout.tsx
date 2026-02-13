import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, Truck, Users, Settings, LogOut, FileText, Plus, Menu, X, Bell, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { useLocationTracker } from '@/hooks/useLocationTracker';
import GpsLockOverlay from '@/components/GpsLockOverlay';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentRole, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useLocationTracker();

  // ✅ تحديث قائمة الروابط لمنع الـ 404
  const getNavItems = (role: string) => {
    const common = [{ label: "الرئيسية", path: `/${role}/dashboard`, icon: <LayoutDashboard size={20} /> }];
    
    if (role === 'shipper') return [
      ...common,
      { label: "نشر شحنة", path: '/shipper/post', icon: <Plus size={20} /> },
      { label: "السائقين", path: '/shipper/drivers', icon: <Users size={20} /> },
      { label: "سجل الشحنات", path: '/shipper/history', icon: <History size={20} /> }, // الربط بالسجل
      { label: "تتبع الشحنة", path: '/shipper/track', icon: <FileText size={20} /> },
      { label: "حسابي", path: '/shipper/account', icon: <Settings size={20} /> },
    ];
    
    if (role === 'driver') return [
      ...common,
      { label: "البحث عن عمل", path: '/driver/loads', icon: <Package size={20} /> },
      { label: "مهامي الحالية", path: '/driver/tasks', icon: <Truck size={20} /> },
      { label: "شاحناتي", path: '/driver/trucks', icon: <Truck size={20} /> },
      { label: "حسابي", path: '/driver/account', icon: <Settings size={20} /> },
    ];
    
    return common;
  };

  const navItems = getNavItems(currentRole || 'shipper');

  return (
    <div className="min-h-screen flex bg-background w-full" dir="rtl">
      <GpsLockOverlay />
      
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:static inset-y-0 right-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">S</div>
            <h1 className="font-black text-lg italic text-white">SAS Transport</h1>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}><X /></Button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={cn("flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-bold transition-all", 
              location.pathname === item.path ? "bg-primary text-white shadow-xl shadow-primary/30" : "text-slate-400 hover:bg-white/5 hover:text-white")}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 bg-black/20">
          <Button variant="ghost" className="w-full justify-start gap-4 text-rose-500 font-bold" onClick={logout}>
            <LogOut size={20} /> تسجيل الخروج
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-16 bg-background/80 backdrop-blur-md border-b px-4 flex items-center justify-between shrink-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden h-12 w-12 rounded-xl" onClick={() => setSidebarOpen(true)}>
             <Menu size={28} />
          </Button>
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border bg-card/50">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase">Live System</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30">
          {children}
        </div>
      </main>
    </div>
  );
}
