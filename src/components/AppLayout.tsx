import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, Truck, Users, Settings, LogOut, FileText, Plus, Menu, X, Bell, CheckCircle2, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/api';

// استيراد مكونات الـ Popover والـ ScrollArea
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { useLocationTracker } from '@/hooks/useLocationTracker';
import GpsLockOverlay from '@/components/GpsLockOverlay';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // حالة الإشعارات
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // تشغيل نظام التتبع للسائقين
  useLocationTracker();

  // جلب الإشعارات والاشتراك في التحديثات الحية
  useEffect(() => {
    if (!userProfile?.id) return;

    // 1. جلب الإشعارات القديمة من القاعدة
    api.getNotifications(userProfile.id).then(setNotifications);

    // 2. الاشتراك في الإشعارات الجديدة (Realtime)
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` },
        (payload) => {
          // إضافة الإشعار الجديد لأعلى القائمة
          setNotifications(prev => [payload.new, ...prev]);
          
          // إظهار تنبيه Toast
          toast.success(payload.new.title, {
            description: payload.new.message,
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  // وظيفة تعليم الإشعارات كمقروءة
  const markAsRead = async () => {
    if (unreadCount === 0) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile?.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const navItems = getNavItems(currentRole || 'driver', t);

  return (
    <div className="min-h-screen flex bg-background">
      <GpsLockOverlay />
      
      {/* القائمة الجانبية (Mobile Overlay) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:static inset-y-0 start-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 text-white">
            <Truck size={24} />
          </div>
          <div className="flex-1">
            <h1 className="font-black text-xl italic">SAS Transport</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">{t(currentRole || 'driver')}</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-bold transition-all group",
                location.pathname === item.path ? "bg-primary text-white shadow-xl" : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl text-rose-500 hover:bg-rose-500/10 font-black" onClick={logout}>
            <LogOut size={22} /> {t('logout')}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </Button>

          <div className="flex items-center gap-4">
            {/* 🔔 جرس التنبيهات المطور */}
            <Popover onOpenChange={(open) => open && markAsRead()}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-xl h-12 w-12">
                  <Bell size={24} className="text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white border-2 border-background animate-in zoom-in">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-none" align="end">
                <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                  <h3 className="font-black text-sm">الإشعارات</h3>
                  {unreadCount > 0 && <Badge variant="secondary" className="text-[10px] font-black">{unreadCount} جديد</Badge>}
                </div>
                <ScrollArea className="h-[400px]">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {notifications.map((n) => (
                        <div key={n.id} className={cn("p-4 hover:bg-muted/30 transition-colors flex gap-3", !n.is_read && "bg-primary/5")}>
                          <div className={cn(
                            "h-10 w-10 rounded-full shrink-0 flex items-center justify-center",
                            n.type === 'accept' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                          )}>
                            {n.type === 'accept' ? <CheckCircle2 size={20} /> : <DollarSign size={20} />}
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-sm leading-tight">{n.title}</p>
                            <p className="text-xs text-muted-foreground leading-normal">{n.message}</p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold mt-1">
                              <Clock size={10} /> {new Date(n.created_at).toLocaleTimeString('ar-SA')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                      <Bell size={48} />
                      <p className="font-bold mt-2">لا توجد تنبيهات حالياً</p>
                    </div>
                  )}
                </ScrollArea>
                <div className="p-3 border-t text-center">
                   <Button variant="link" className="text-xs font-bold h-auto p-0">عرض جميع التنبيهات</Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-6 w-px bg-border hidden md:block" />
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border bg-card/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-muted-foreground uppercase">System Live</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

// وظيفة مساعدة NavItems
function getNavItems(role: string, t: any) {
  if (role === 'driver') return [
    { label: t('dashboard'), path: '/driver/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: t('available_loads'), path: '/driver/loads', icon: <Package size={20} /> },
    { label: t('my_trucks'), path: '/driver/trucks', icon: <Truck size={20} /> },
    { label: t('my_drivers'), path: '/driver/sub-drivers', icon: <Users size={20} /> },
    { label: t('my_account'), path: '/driver/account', icon: <Settings size={20} /> },
  ];
  if (role === 'shipper') return [
    { label: t('dashboard'), path: '/shipper/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: t('post_load'), path: '/shipper/post', icon: <Plus size={20} /> },
    { label: t('my_shipments'), path: '/shipper/loads', icon: <Package size={20} /> },
    { label: "السائقين المتاحين", path: '/shipper/drivers', icon: <Users size={20} /> },
    { label: t('track_shipment'), path: '/shipper/track', icon: <FileText size={20} /> },
    { label: t('my_account'), path: '/shipper/account', icon: <Settings size={20} /> },
  ];
  return [
    { label: t('dashboard'), path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: t('user_management'), path: '/admin/users', icon: <Users size={20} /> },
    { label: t('shipment_management'), path: '/admin/loads', icon: <Package size={20} /> },
    { label: t('system_settings'), path: '/admin/settings', icon: <Settings size={20} /> },
  ];
}
