import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Package, Truck, Users, Settings, LogOut, 
  FileText, Plus, Menu, X, Bell, CheckCircle2, DollarSign, 
  Clock, Trash2, ShieldCheck, MapPin 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/api';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { useLocationTracker } from '@/hooks/useLocationTracker';
import GpsLockOverlay from '@/components/GpsLockOverlay';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isAllNotifsOpen, setIsAllNotifsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // تشغيل التتبع للسائقين
  useLocationTracker();

  // جلب الإشعارات والاشتراك اللحظي
  useEffect(() => {
    if (!userProfile?.id) return;

    api.getNotifications(userProfile.id).then(setNotifications);

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          toast.info(payload.new.title, { description: payload.new.message });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const markAsRead = async () => {
    if (unreadCount === 0 || !userProfile?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("تم مسح التنبيه");
  };

  // معالجة عروض الأسعار (قبول / رفض)
  const handleBidAction = async (notif: any, status: 'accepted' | 'rejected') => {
    try {
      if (!notif.data?.bidId) return;
      await api.respondToBid(notif.data.bidId, status, notif.data.loadId, notif.data.driverId);
      toast.success(status === 'accepted' ? "تم قبول العرض" : "تم رفض العرض");
      await api.deleteNotification(notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (err) {
      toast.error("فشلت العملية");
    }
  };

  const navItems = getNavItems(currentRole || 'driver', t);

  // مكون شكل الإشعار الواحد عشان نستخدمه في مكانين
  const NotificationItem = ({ n }: { n: any }) => (
    <div className={cn("p-4 flex gap-3 group border-b relative", !n.is_read && "bg-primary/5")}>
      <div className={cn(
        "h-10 w-10 rounded-full shrink-0 flex items-center justify-center",
        n.type === 'accept' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
      )}>
        {n.type === 'accept' ? <CheckCircle2 size={20} /> : <DollarSign size={20} />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex justify-between items-start">
          <p className="font-black text-sm">{n.title}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => deleteNotif(n.id, e)}>
            <Trash2 size={14} className="text-destructive" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground font-bold">{n.message}</p>
        
        {n.type === 'bid' && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-8 bg-emerald-600 font-bold" onClick={() => handleBidAction(n, 'accepted')}>قبول</Button>
            <Button size="sm" variant="outline" className="h-8 text-rose-600 font-bold" onClick={() => handleBidAction(n, 'rejected')}>رفض</Button>
          </div>
        )}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
          <Clock size={10} /> {new Date(n.created_at).toLocaleTimeString('ar-SA')}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      <GpsLockOverlay />
      
      {/* القائمة الجانبية للموبايل */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:static inset-y-0 start-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white"><Truck size={20} /></div>
            <h1 className="font-black text-lg italic">SAS Transport</h1>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-bold transition-all",
                location.pathname === item.path ? "bg-primary text-white shadow-xl shadow-primary/30" : "text-slate-400 hover:bg-white/5 hover:text-white"
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
          {/* زرار القائمة يظهر يمين في الـ RTL */}
          <Button variant="ghost" size="icon" className="lg:hidden rounded-xl h-12 w-12" onClick={() => setSidebarOpen(true)}>
            <Menu size={28} />
          </Button>

          <div className="flex items-center gap-2">
            {/* جرس التنبيهات */}
            <Popover onOpenChange={(open) => open && markAsRead()}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl hover:bg-muted">
                  <Bell size={24} className="text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white border-2 border-background">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-none" align="start">
                <div className="p-4 bg-primary text-white font-black text-sm flex justify-between">
                  التنبيهات
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{notifications.length} إشعار</span>
                </div>
                <ScrollArea className="h-80">
                  {notifications.length > 0 ? notifications.slice(0, 5).map(n => <NotificationItem key={n.id} n={n} />) 
                  : <div className="p-10 text-center opacity-30 font-bold">لا توجد إشعارات</div>}
                </ScrollArea>
                <Button variant="ghost" className="w-full h-12 text-xs font-bold rounded-none border-t" onClick={() => setIsAllNotifsOpen(true)}>عرض جميع التنبيهات</Button>
              </PopoverContent>
            </Popover>

            <div className="h-6 w-px bg-border mx-1" />
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl border bg-card/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Live</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* نافذة "عرض جميع التنبيهات" */}
      <Dialog open={isAllNotifsOpen} onOpenChange={setIsAllNotifsOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <DialogHeader className="p-8 bg-muted/30 border-b">
            <DialogTitle className="text-2xl font-black">مركز التنبيهات</DialogTitle>
            <DialogDescription className="font-bold">إدارة جميع إشعاراتك وعروض الأسعار في مكان واحد.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col">
              {notifications.length > 0 ? notifications.map(n => <NotificationItem key={n.id} n={n} />)
              : <div className="p-20 text-center text-muted-foreground font-bold">القائمة فارغة</div>}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
