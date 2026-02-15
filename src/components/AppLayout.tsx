import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Package, Truck, Users, Settings, LogOut, FileText, Plus, Menu, X, Bell, Search, History, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { api } from '@/services/api';
// الاستيرادات المطلوبة لحل المشكلة ✅
import { Badge } from '@/components/ui/badge'; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // جلب الإشعارات عند فتح الصفحة
  const fetchInitialNotifications = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getNotifications(userProfile.id);
      setNotifications(data || []);
      setUnreadCount(data?.filter((n: any) => !n.is_read).length || 0);
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  useEffect(() => {
    if (!userProfile?.id) return;

    fetchInitialNotifications();

    // الاستماع للإشعارات الجديدة لحظياً
    const channel = supabase.channel(`notifs-${userProfile.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` }, 
        (p) => {
          setNotifications(prev => [p.new, ...prev]);
          setUnreadCount(prev => prev + 1);

          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});

          toast.success(p.new.title, { description: p.new.message });
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  const markAsRead = async () => {
    if (!userProfile?.id) return;
    setUnreadCount(0);
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id);
  };

  const navItems = (() => {
    const role = currentRole || 'shipper';
    if (role === 'shipper') return [
      { label: "الرئيسية", path: '/shipper/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: "نشر شحنة", path: '/shipper/post', icon: <Plus size={20} /> },
      { label: "رادار السائقين", path: '/shipper/drivers', icon: <Users size={20} /> },
      { label: "سجل العمليات", path: '/shipper/history', icon: <History size={20} /> },
      { label: "تتبع الشحنة", path: '/shipper/track', icon: <FileText size={20} /> },
      { label: "حسابي", path: '/shipper/account', icon: <Settings size={20} /> },
    ];
    return [
      { label: "الرئيسية", path: '/driver/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: "البحث عن عمل", path: '/driver/loads', icon: <Search size={20} /> },
      { label: "مهامي", path: '/driver/tasks', icon: <Truck size={20} /> },
      { label: "شاحناتي", path: '/driver/trucks', icon: <Truck size={20} /> },
      { label: "حسابي", path: '/driver/account', icon: <Settings size={20} /> },
    ];
  })();

  return (
    <div className="min-h-screen flex bg-slate-50 w-full overflow-x-hidden" dir="rtl">
      <aside className={cn("fixed lg:static inset-y-0 right-0 z-50 w-72 bg-[#0f172a] text-white flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0")}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <h1 className="font-black text-xl italic tracking-tighter">SAS TRANSPORT</h1>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X /></Button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn("flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all", location.pathname === item.path ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-6">
          <Button variant="ghost" className="w-full justify-start gap-4 text-rose-400 font-black h-14 rounded-2xl" onClick={logout}>
            <LogOut size={20} /> خروج
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white border-b px-6 flex items-center justify-between shadow-sm">
          <Button variant="ghost" size="icon" className="lg:hidden h-12 w-12 rounded-xl" onClick={() => setSidebarOpen(true)}>
            <Menu size={28} className="text-blue-600" />
          </Button>
          
          <div className="flex items-center gap-3">
             <Popover onOpenChange={(open) => open && markAsRead()}>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50">
                      <Bell size={22} className="text-slate-600" />
                    </Button>
                    {unreadCount > 0 && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-black animate-bounce">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-[2rem] shadow-2xl border-none overflow-hidden bg-white" align="start">
                   <div className="p-5 bg-[#0f172a] text-white flex justify-between items-center">
                      <p className="font-black text-sm uppercase tracking-widest">التنبيهات</p>
                      <Badge className="bg-blue-600 text-white border-none">{notifications.length}</Badge>
                   </div>
                   <ScrollArea className="h-[350px]">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {notifications.map((notif) => (
                            <div key={notif.id} className={cn("p-4 hover:bg-slate-50 transition-colors flex gap-3 text-right", !notif.is_read && "bg-blue-50/50")}>
                               <div className="w-10 h-10 rounded-full bg-white shadow-sm border flex items-center justify-center shrink-0">
                                  {notif.type === 'accept' ? <Check className="text-emerald-500" size={18}/> : <Bell className="text-blue-600" size={18}/>}
                               </div>
                               <div className="flex-1">
                                  <p className="font-black text-xs text-slate-800">{notif.title}</p>
                                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{notif.message}</p>
                                  <p className="text-[8px] text-slate-400 font-bold mt-2 uppercase">{new Date(notif.created_at).toLocaleTimeString('ar-SA')}</p>
                               </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 text-center">
                           <Bell className="mx-auto text-slate-200 mb-2" size={40} />
                           <p className="text-xs font-bold text-slate-400">لا توجد إشعارات حالياً</p>
                        </div>
                      )}
                   </ScrollArea>
                </PopoverContent>
             </Popover>

             <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                {userProfile?.full_name?.charAt(0) || 'U'}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#f8fafc]">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
