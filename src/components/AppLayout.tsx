import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Package, Truck, Users, Settings, LogOut, 
  FileText, Plus, Menu, X, Bell, Trash2, Clock, CheckCircle2, 
  DollarSign, History 
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

  // تشغيل التتبع (للسائقين فقط)
  useLocationTracker();

  const fetchNotifs = useCallback(async () => {
    if (!userProfile?.id) return;
    const data = await api.getNotifications(userProfile.id);
    setNotifications(data || []);
  }, [userProfile?.id]);

  useEffect(() => {
    fetchNotifs();
    const channel = supabase.channel(`notifs-${userProfile?.id}`)
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile?.id}` }, 
          () => fetchNotifs())
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
    <div className="min-h-screen flex bg-slate-50 w-full overflow-x-hidden" dir="rtl">
      {/* ⚠️ قفل الـ GPS للسائقين فقط ⚠️ */}
      <GpsLockOverlay />
      
      {/* الـ Overlay الشفاف للموبايل */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* الشريط الجانبي (Sidebar) */}
      <aside className={cn(
        "fixed lg:static inset-y-0 right-0 z-[70] w-72 bg-[#0f172a] text-white flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Truck size={22} className="text-white" />
            </div>
            <h1 className="font-black text-xl italic tracking-tighter">SAS TRANSPORT</h1>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={28} />
          </Button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-bold transition-all duration-200",
                location.pathname === item.path 
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-14 rounded-2xl font-black" 
            onClick={logout}
          >
            <LogOut size={20} /> خروج من النظام
          </Button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white border-b px-4 flex items-center justify-between shrink-0 z-50 shadow-sm">
          {/* زر المنيو الضخم لضعاف النظر */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden h-14 w-14 rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center" 
            onClick={() => setSidebarOpen(true)}
          >
             <Menu size={36} strokeWidth={2.5} className="text-blue-600" />
          </Button>
          
          <div className="flex items-center gap-3">
            {/* جرس الإشعارات */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 h-11 w-11 rounded-xl">
                  <Bell size={24} className="text-slate-600" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-[2rem] shadow-2xl border-none overflow-hidden" align="start">
                <div className="p-5 bg-blue-600 text-white font-black text-sm flex justify-between items-center">
                   <span>مركز التنبيهات</span>
                   <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{notifications.length}</span>
                </div>
                <ScrollArea className="h-80 bg-white">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 border-b flex gap-3 group relative hover:bg-slate-50 transition-colors">
                        <div className="shrink-0 h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          {n.type === 'accept' ? <CheckCircle2 size={16}/> : <DollarSign size={16}/>}
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                           <p className="font-bold text-xs leading-tight text-slate-800">{n.title}</p>
                           <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                        </div>
                        <Button 
                          variant="ghost" size="icon" 
                          className="h-7 w-7 text-rose-500 opacity-0 group-hover:opacity-100 absolute left-1 top-1 transition-opacity" 
                          onClick={(e) => handleDeleteNotif(n.id, e)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-16 text-center text-slate-400 italic font-bold">لا توجد تنبيهات</div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="h-8 w-px bg-slate-200 mx-2" />
            
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-wider">النظام نشط</span>
            </div>
          </div>
        </header>

        {/* محتوى الصفحة الفعلي */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 relative z-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
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
