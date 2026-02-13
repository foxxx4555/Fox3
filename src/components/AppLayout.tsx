import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, Truck, Users, Settings, LogOut, FileText, MessageSquare, History, Plus, Menu, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getNavItems = (role: string) => {
    if (role === 'driver') return [
      { label: t('dashboard'), path: '/driver/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: t('available_loads'), path: '/driver/loads', icon: <Package size={20} /> },
      { label: t('my_trucks'), path: '/driver/trucks', icon: <Truck size={20} /> },
      { label: t('my_drivers'), path: '/driver/sub-drivers', icon: <Users size={20} /> },
      { label: t('load_history'), path: '/driver/history', icon: <History size={20} /> },
      { label: t('my_account'), path: '/driver/account', icon: <Settings size={20} /> },
    ];
    if (role === 'shipper') return [
      { label: t('dashboard'), path: '/shipper/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: t('post_load'), path: '/shipper/post', icon: <Plus size={20} /> },
      { label: t('my_shipments'), path: '/shipper/loads', icon: <Package size={20} /> },
      { label: "السائقين المتاحين", path: '/shipper/drivers', icon: <Users size={20} /> }, // الإضافة هنا
      { label: t('track_shipment'), path: '/shipper/track', icon: <FileText size={20} /> },
      { label: t('my_account'), path: '/shipper/account', icon: <Settings size={20} /> },
    ];
    return [
      { label: t('dashboard'), path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: t('user_management'), path: '/admin/users', icon: <Users size={20} /> },
      { label: t('shipment_management'), path: '/admin/loads', icon: <Package size={20} /> },
      { label: t('support_tickets'), path: '/admin/tickets', icon: <MessageSquare size={20} /> },
      { label: t('system_settings'), path: '/admin/settings', icon: <Settings size={20} /> },
    ];
  };

  const navItems = getNavItems(currentRole || 'driver');

  return (
    <div className="min-h-screen flex bg-background">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:static inset-y-0 start-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col transition-transform duration-300 shadow-2xl lg:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Truck className="text-white" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-xl tracking-tight text-white italic">SAS Transport</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">{t(currentRole || 'driver')}</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-bold transition-all duration-200 group relative",
                  isActive ? "bg-primary text-white shadow-xl shadow-primary/40" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl text-rose-500 hover:bg-rose-500/10 font-black" onClick={logout}>
            <LogOut size={22} /> {t('logout')}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="lg:hidden hover:bg-muted" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </Button>
          <div className="flex items-center gap-3">
             <Bell size={20} className="text-muted-foreground" />
             <div className="h-6 w-px bg-border mx-2" />
             <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border bg-card/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-muted-foreground uppercase">System Live</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
