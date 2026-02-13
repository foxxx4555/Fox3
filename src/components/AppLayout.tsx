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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-bold transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary text-white shadow-xl shadow-primary/40 active:scale-95"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className={cn("transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <motion.div layoutId="activeNav" className="absolute left-0 w-1.5 h-6 bg-white rounded-full lg:hidden" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-lg font-black text-white shadow-lg">
              {userProfile?.full_name?.charAt(0) || '؟'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">{userProfile?.full_name}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-wider">{userProfile?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 h-14 rounded-2xl text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 font-black text-base"
            onClick={logout}
          >
            <LogOut size={22} /> {t('logout')}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2" />

        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden hover:bg-muted" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </Button>
            <div>
              <h2 className="font-bold text-xl text-foreground tracking-tight">
                {navItems.find(i => i.path === location.pathname)?.label || t('dashboard')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-xl">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            </Button>
            <div className="h-6 w-px bg-border mx-2 hidden md:block" />
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border bg-card/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">System Live</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
