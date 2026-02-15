import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Package, Truck, Users, Settings, LogOut, FileText, Plus, Menu, X, Bell, Search, History, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge'; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAllNotifsOpen, setIsAllNotifsOpen] = useState(false); // حالة نافذة "عرض المزيد"

  const fetchInitialNotifications = async () => {
    if (!userProfile?.id) return;
    const data = await api.getNotifications(userProfile.id);
    setNotifications(data || []);
    setUnreadCount(data?.filter((n: any) => !n.is_read).length || 0);
  };

  useEffect(() => {
    if (!userProfile?.id) return;
    fetchInitialNotifications();
    const channel = supabase.channel(`notifs-${userProfile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` }, 
      (p) => {
        setNotifications(prev => [p.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
        toast.success(p.new.title, { description: p.new.message });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  const markAsRead = async () => {
    if (!userProfile?.id) return;
    setUnreadCount(0);
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id);
  };

  // دالة حذف إشعار واحد
  const deleteNotif = async (id: string) => {
    const success = await api.deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.info("تم حذف الإشعار");
    }
  };

  // دالة مسح الكل
  const clearAll = async () => {
    if (!userProfile?.id) return;
    if (!confirm("هل أنت متأكد من مسح جميع الإشعارات؟")) return;
    const success = await api.clearAllNotifications(userProfile.id);
    if (success) {
      setNotifications([]);
      setUnreadCount(0);
      toast.success("تم مسح السجل بالكامل");
    }
  };

  const navItems = (() => {
    const role = currentRole || 'shipper';
    const items = role === 'shipper' ? [
      { label: "الرئيسية", path: '/shipper/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: "نشر شحنة", path: '/shipper/post', icon: <Plus size={20} /> },
      { label: "رادار السائقين", path: '/shipper/drivers', icon: <Users size={20} /> },
      { label: "سجل العمليات", path: '/shipper/history', icon: <History size={20} /> },
      { label: "تتبع الشحنة", path: '/shipper/track', icon: <FileText size={20} /> },
      { label: "حسابي", path: '/shipper/account', icon: <Settings size={20} /> },
    ] : [
      { label: "الرئيسية", path: '/driver/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: "البحث عن عمل", path: '/driver/loads', icon: <Search size={20} /> },
      { label: "مهامي", path: '/driver/tasks', icon: <Truck size={20} /> },
      { label: "شاحناتي", path: '/driver/trucks', icon: <Truck size={20} /> },
      { label: "حسابي", path: '/driver/account', icon: <Settings size={20} /> },
    ];
    return items;
  })();

  return (
    <div className="min-h-screen flex bg-slate-50 w-full overflow-x-hidden" dir="rtl">
      <aside className={cn("fixed lg:static inset-y-0 right-0 z-50 w-72 bg-[#0f172a] text-white flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0")}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h1 className="font-black text-xl italic">SAS TRANSPORT</h1>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X /></Button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn("flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all", location.pathname === item.path ? "bg-blue-600 text-white shadow-xl" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-6"><Button variant="ghost" className="w-full justify-start gap-4 text-rose-400 font-black h-14 rounded-2xl" onClick={logout}><LogOut size={20} /> خروج</Button></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b px-6 flex items-center justify-between shadow-sm shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={28} className="text-blue-600" /></Button>
          
          <div className="flex items-center gap-3">
             <Popover onOpenChange={(open) => open && markAsRead()}>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50">
                      <Bell size={22} className="text-slate-600" />
                    </Button>
                    {unreadCount > 0 && <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-black animate-bounce">{unreadCount}</div>}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-[2rem] shadow-2xl border-none overflow-hidden bg-white" align="start">
                   <div className="p-5 bg-[#0f172a] text-white flex justify-between items-center">
                      <p className="font-black text-sm">التنبيهات</p>
                      <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-500 hover:bg-white/10 h-8 rounded-lg" onClick={clearAll}><Trash2 size={16} /></Button>
                   </div>
                   <ScrollArea className="h-[300px]">
                      {notifications.slice(0, 5).map((notif) => (
                        <div key={notif.id} className="p-4 border-b border-slate-50 flex gap-3 group relative">
                           <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Bell size={14}/></div>
                           <div className="flex-1 text-right">
                              <p className="font-black text-[11px] text-slate-800">{notif.title}</p>
                              <p className="text-[10px] text-slate-500 leading-tight mt-1">{notif.message}</p>
                           </div>
                           <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-full text-slate-300 hover:text-rose-500 transition-all" onClick={() => deleteNotif(notif.id)}><X size={12}/></Button>
                        </div>
                      ))}
                      {notifications.length === 0 && <div className="p-10 text-center text-slate-400 text-xs font-bold">لا توجد إشعارات</div>}
                   </ScrollArea>
                   {notifications.length > 0 && (
                     <div className="p-3 bg-slate-50 text-center">
                        <Button variant="link" className="text-blue-600 font-black text-xs" onClick={() => setIsAllNotifsOpen(true)}>عرض المزيد من الإشعارات</Button>
                     </div>
                   )}
                </PopoverContent>
             </Popover>

             <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg">{userProfile?.full_name?.charAt(0)}</div>
          </div>
        </header>

        {/* نافذة جميع الإشعارات ✅ */}
        <Dialog open={isAllNotifsOpen} onOpenChange={setIsAllNotifsOpen}>
           <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none bg-white">
              <DialogHeader className="p-6 bg-[#0f172a] text-white flex flex-row items-center justify-between">
                 <div>
                    <DialogTitle className="text-xl font-black">سجل التنبيهات</DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs">إدارة ومسح كافة الإشعارات الواردة</DialogDescription>
                 </div>
                 <Button variant="destructive" size="sm" className="rounded-xl h-10 gap-2 font-black" onClick={clearAll}><Trash2 size={16}/> مسح الكل</Button>
              </DialogHeader>
              <ScrollArea className="h-[450px] p-2">
                 <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0"><Bell size={20}/></div>
                         <div className="flex-1 text-right">
                            <p className="font-black text-sm text-slate-800">{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-2">{new Date(notif.created_at).toLocaleString('ar-SA')}</p>
                         </div>
                         <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-rose-50 hover:text-rose-500" onClick={() => deleteNotif(notif.id)}><X size={18}/></Button>
                      </div>
                    ))}
                 </div>
              </ScrollArea>
           </DialogContent>
        </Dialog>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#f8fafc]">
          <AnimatePresence mode="wait"><motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>{children}</motion.div></AnimatePresence>
        </div>
      </main>
    </div>
  );
}
