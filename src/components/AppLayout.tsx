import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Package, Truck, Users, Settings, LogOut, 
  FileText, Plus, Menu, X, Bell, Trash2, Clock, CheckCircle2, 
  DollarSign, History, ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/api';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useLocationTracker } from '@/hooks/useLocationTracker';
import GpsLockOverlay from '@/components/GpsLockOverlay';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useLocationTracker();

  // جلب الإشعارات والاشتراك اللحظي (Lightning Speed)
  const fetchNotifs = useCallback(async () => {
    if (!userProfile?.id) return;
    const data = await api.getNotifications(userProfile.id);
    setNotifications(data || []);
  }, [userProfile?.id]);

  useEffect(() => {
    fetchNotifs();
    // ⚡️ رصد أي إشعار جديد ينزل في القاعدة فوراً
    const channel = supabase.channel(`notifs-${userProfile?.id}`)
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile?.id}` }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              toast.info(payload.new.title, { description: payload.new.message });
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
              audio.play().catch(() => {});
            }
            fetchNotifs();
          })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id, fetchNotifs]);

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    await api.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const navItems = getNavItems(currentRole || 'shipper');

  return (
    <div className="min-h-screen flex bg-background w-full overflow-x-hidden" dir="rtl">
      <GpsLockOverlay />
      
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
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
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white"><Truck size={22} /></div>
            <h1 className="font-black text-xl italic tracking-tighter">SAS TRANSPORT</h1>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white/40" onClick={() => setSidebarOpen(false)}><X size={28} /></Button>
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
        <div className="p-6 border-t border-white/5">
          <Button variant="ghost" className="w-full justify-start gap-4 text-rose-500 font-black h-14 rounded-2xl" onClick={logout}><LogOut size={20} /> خروج</Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-background/80 backdrop-blur-xl border-b px-4 flex items-center justify-between shrink-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden h-16 w-16" onClick={() => setSidebarOpen(true)}>
             <Menu size={40} strokeWidth={2.5} className="text-primary" />
          </Button>
          
          <div className="flex items-center gap-3">
            <Popover onOpenChange={(open) => { if(open) markNotifsAsRead(userProfile?.id, setNotifications) }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl hover:bg-muted transition-all">
                  <Bell size={26} className="text-slate-600" />
                  {notifications.some(n => !n.is_read) && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-destructive rounded-full border-2 border-background" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-[2rem] shadow-2xl border-none overflow-hidden" align="start">
                <div className="p-4 bg-primary text-white font-black text-sm">التنبيهات الأخيرة</div>
                <ScrollArea className="h-80">
                  {notifications.map(n => (
                    <div key={n.id} className="p-4 border-b flex gap-3 group relative hover:bg-muted/30">
                       <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          {n.type === 'accept' ? <CheckCircle2 size={18}/> : <DollarSign size={18}/>}
                       </div>
                       <div className="flex-1 pr-1">
                          <p className="font-bold text-sm leading-tight">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{n.message}</p>
                       </div>
                       <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => handleDeleteNotif(n.id, e)}><Trash2 size={14}/></Button>
                    </div>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <div className="h-6 w-px bg-border mx-1" />
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[11px] font-black uppercase">Live System</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30">
          {children}
        </div>
      </main>
    </div>
  );
}

// دالة تحديث الحالة لمقروء
async function markNotifsAsRead(userId: string | undefined, setter: any) {
  if (!userId) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  setter((prev: any) => prev.map((n: any) => ({...n, is_read: true})));
}

function getNavItems(role: string) {
  const common = [{ label: "الرئيسية", path: `/${role}/dashboard`, icon: <LayoutDashboard size={20} /> }];
  if (role === 'shipper') return [
    ...common,
    { label: "نشر شحنة", path: '/shipper/post', icon: <Plus size={20} /> },
    { label: "السائقين", path: '/shipper/drivers', icon: <Users size={20} /> },
    { label: "سجل العمليات", path: '/shipper/history', icon: <History size={20} /> },
    { label: "تتبع الشحنة", path: '/shipper/track', icon: <FileText size={20} /> },
    { label: "حسابي", path: '/shipper/account', icon: <Settings size={20} /> },
  ];
  if (role === 'driver') return [
    ...common,
    { label: "البحث عن عمل", path: '/driver/loads', icon: <Package size={20} /> },
    { label: "شحناتي", path: '/driver/tasks', icon: <Truck size={20} /> },
    { label: "شاحناتي", path: '/driver/trucks', icon: <Truck size={20} /> },
    { label: "حسابي", path: '/driver/account', icon: <Settings size={20} /> },
  ];
  return common;
}
