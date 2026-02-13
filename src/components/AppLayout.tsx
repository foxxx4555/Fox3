import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Package, Truck, Users, Settings, LogOut, 
  FileText, Plus, Menu, X, Bell, Trash2, Clock, CheckCircle2, 
  DollarSign, History, ShieldAlert 
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
  
  // تشغيل مراقب الـ GPS للسائقين تلقائياً
  useLocationTracker();

  // جلب الإشعارات والاشتراك اللحظي
  const loadNotifs = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getNotifications(userProfile.id);
      setNotifications(data || []);
    } catch (e) {
      console.error("Notif Error:", e);
    }
  };

  useEffect(() => {
    loadNotifs();
    // مراقب التغييرات الحية
    const channel = supabase.channel('global-notifs')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile?.id}` }, 
          () => loadNotifs())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  // مسح الإشعار نهائياً من السيرفر
  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("تم الحذف");
    } catch (err) {
      toast.error("فشل حذف التنبيه");
    }
  };

  const navItems = getNavItems(currentRole || 'shipper');

  return (
    <div className="min-h-screen flex bg-background w-full overflow-x-hidden" dir="rtl">
      {/* قفل الشاشة في حال إغلاق الـ GPS للسائقين */}
      <GpsLockOverlay />
      
      {/* طبقة تظليل خلف القائمة في الموبايل */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* الشريط الجانبي (Sidebar) - يمين الصفحة */}
      <aside className={cn(
        "fixed lg:static inset-y-0 right-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col transition-transform duration-300 shadow-2xl",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Truck size={22} className="text-white" />
            </div>
            <h1 className="font-black text-xl italic text-white tracking-tight">SAS Transport</h1>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
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
                <span className={cn("transition-transform", isActive ? "scale-110" : "group-hover:scale-110")}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 text-rose-500 hover:bg-rose-500/10 h-14 rounded-2xl font-black" 
            onClick={logout}
          >
            <LogOut size={20} /> تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-16 bg-background/80 backdrop-blur-xl border-b px-4 flex items-center justify-between shrink-0 z-30">
          {/* زر فتح القائمة (يظهر فقط في الموبايل) */}
          <Button variant="ghost" size="icon" className="lg:hidden hover:bg-muted h-11 w-11 rounded-xl" onClick={() => setSidebarOpen(true)}>
             <Menu size={28} />
          </Button>
          
          <div className="flex items-center gap-3">
            {/* جرس التنبيهات مع Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted h-10 w-10 rounded-xl transition-all">
                  <Bell size={22} className="text-slate-600" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-3xl shadow-2xl border-none overflow-hidden mt-2" align="start">
                <div className="p-5 bg-primary text-white font-black text-sm flex justify-between items-center">
                   <span>تنبيهات النظام</span>
                   <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{notifications.length} جديد</span>
                </div>
                <ScrollArea className="h-80">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {notifications.map(n => (
                        <div key={n.id} className="p-4 flex gap-3 group relative hover:bg-muted/30 transition-colors">
                          <div className={cn(
                            "shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm",
                            n.type === 'accept' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                          )}>
                            {n.type === 'accept' ? <CheckCircle2 size={18}/> : <DollarSign size={18}/>}
                          </div>
                          <div className="flex-1 min-w-0 pr-1">
                             <p className="font-bold text-sm leading-tight text-slate-800">{n.title}</p>
                             <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                             <p className="text-[9px] text-slate-400 mt-2 font-bold flex items-center gap-1">
                               <Clock size={10} /> {new Date(n.created_at).toLocaleTimeString('ar-SA')}
                             </p>
                          </div>
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity absolute left-2 top-2" 
                            onClick={(e) => handleDeleteNotif(n.id, e)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 opacity-30 italic">
                      <Bell size={40} className="mb-2" />
                      <p className="font-bold text-sm">لا توجد تنبيهات جديدة</p>
                    </div>
                  )}
                </ScrollArea>
                <div className="p-3 bg-muted/20 border-t text-center">
                   <Button variant="link" className="text-xs font-bold text-primary h-auto p-0">عرض السجل الكامل</Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-6 w-px bg-border mx-1" />
            
            {/* مؤشر اتصال النظام */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">Live System</span>
            </div>
          </div>
        </header>

        {/* محتوي الصفحات */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/40 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

// وظيفة جلب الروابط حسب الدور (Role)
function getNavItems(role: string) {
  const common = [{ label: "لوحة القيادة", path: `/${role}/dashboard`, icon: <LayoutDashboard size={20} /> }];
  
  if (role === 'shipper') return [
    ...common,
    { label: "نشر شحنة", path: '/shipper/post', icon: <Plus size={20} /> },
    { label: "السائقين المتاحين", path: '/shipper/drivers', icon: <Users size={20} /> },
    { label: "سجل العمليات", path: '/shipper/history', icon: <History size={20} /> },
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

  if (role === 'admin') return [
    ...common,
    { label: "إدارة المستخدمين", path: '/admin/users', icon: <Users size={20} /> },
    { label: "إدارة الشحنات", path: '/admin/loads', icon: <Package size={20} /> },
    { label: "بلاغات الدعم", path: '/admin/tickets', icon: <ShieldAlert size={20} /> },
    { label: "إعدادات النظام", path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return common;
}
