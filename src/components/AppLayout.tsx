import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Package, Truck, Users, Settings, LogOut, 
  FileText, Plus, Menu, X, Bell, Trash2, Clock, CheckCircle2, DollarSign, History 
} from 'lucide-react'; // ✅ تمت مراجعة جميع الأيقونات هنا
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

  const loadNotifs = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getNotifications(userProfile.id);
      setNotifications(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadNotifs();
    const channel = supabase.channel('realtime-notif')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile?.id}` }, () => loadNotifs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    await api.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("تم الحذف");
  };

  const navItems = getNavItems(currentRole || 'shipper');

  return (
    <div className="min-h-screen flex bg-background w-full overflow-x-hidden" dir="rtl">
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
        "fixed lg:static inset-y-0 right-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col transition-transform duration-300 shadow-2xl",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white"><Truck size={22} /></div>
            <h1 className="font-black text-lg italic">SAS Transport</h1>
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
          <Button variant="ghost" className="w-full justify-start gap-4 text-rose-500 font-bold hover:bg-rose-500/10 h-14 rounded-2xl" onClick={logout}>
            <LogOut size={20} /> تسجيل الخروج
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-16 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between shrink-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden rounded-xl h-11 w-11" onClick={() => setSidebarOpen(true)}>
             <Menu size={28} />
          </Button>
          
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted h-10 w-10 rounded-xl">
                  <Bell size={22} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-none overflow-hidden" align="start">
                <div className="p-4 bg-primary text-white font-black text-sm flex justify-between items-center">
                   تنبيهات النظام
                   <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{notifications.length} إشعار</span>
                </div>
                <ScrollArea className="h-80">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 border-b flex gap-3 group relative hover:bg-muted/30">
                        <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {n.type === 'accept' ? <CheckCircle2 size={16}/> : <DollarSign size={16}/>}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                           <p className="font-bold text-xs truncate">{n.title}</p>
                           <p className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 absolute left-1 top-1" onClick={(e) => handleDeleteNotif(n.id, e)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-muted-foreground italic">لا توجد تنبيهات</div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="h-6 w-px bg-border mx-1" />
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-wider">Live System</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function getNavItems(role: string) {
  const common = [{ label: "الرئيسية", path: `/${role}/dashboard`, icon: <LayoutDashboard size={20} /> }];
  if (role === 'shipper') return [
    ...common,
    { label: "نشر شحنة", path: '/shipper/post', icon: <Plus size={20} /> },
    { label: "السائقين المتاحين", path: '/shipper/drivers', icon: <Users size={20} /> },
    { label: "سجل الشحنات", path: '/shipper/history', icon: <History size={20} /> },
    { label: "تتبع الشحنة", path: '/shipper/track', icon: <FileText size={20} /> },
    { label: "حسابي", path: '/shipper/account', icon: <Settings size={20} /> },
  ];
  if (role === 'driver') return [
    ...common,
    { label: "البحث عن عمل", path: '/driver/loads', icon: <Package size={20} /> },
    { label: "شحناتي الحالية", path: '/driver/tasks', icon: <Truck size={20} /> },
    { label: "شاحناتي", path: '/driver/trucks', icon: <Truck size={20} /> },
    { label: "حسابي", path: '/driver/account', icon: <Settings size={20} /> },
  ];
  return common;
}
