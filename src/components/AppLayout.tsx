import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Truck, Users, Settings, LogOut, FileText, Plus, Menu, X, Bell, Search, History, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 🔊 نظام التحكم في الصوت
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // دالة لتشغيل الصوت والنطق (Text-to-Speech)
  const playNotificationEffects = (title: string) => {
    if (!isAudioEnabled) return;

    try {
      // 1. تشغيل الرنة
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play blocked"));
      }

      // 2. النطق الصوتي (عربي)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // إلغاء أي كلام سابق
        const msg = new SpeechSynthesisUtterance(title);
        msg.lang = 'ar-SA';
        window.speechSynthesis.speak(msg);
      }
    } catch (err) {
      console.error("Sound error:", err);
    }
  };

  // دالة تفعيل الصوت (لازم المستخدم يدوس عليها مرة واحدة)
  const handleEnableAudio = () => {
    if (!audioRef.current) return;
    
    // تشغيل تجريبي لفك قفل المتصفح
    audioRef.current.play().then(() => {
      audioRef.current?.pause();
      setIsAudioEnabled(true);
      toast.success("تم تفعيل نظام التنبيهات الصوتية 🔊");
    }).catch(() => {
      toast.error("يرجى الضغط مرة أخرى لتفعيل الصوت");
    });
  };

  useEffect(() => {
    if (!userProfile?.id) return;
    
    // تجهيز كائن الصوت
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.load();

    const fetchInitialNotifications = async () => {
      const data = await api.getNotifications(userProfile.id);
      setNotifications(data || []);
      setUnreadCount(data?.filter((n: any) => !n.is_read).length || 0);
    };
    fetchInitialNotifications();

    // الاشتراك في التنبيهات اللحظية
    const channel = supabase.channel(`notifs-realtime-${userProfile.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userProfile.id}` 
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);

        // تشغيل الصوت والنطق فوراً
        playNotificationEffects(payload.new.title);

        toast.success(payload.new.title, { description: payload.new.message });
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id, isAudioEnabled]);

  const markAsRead = async () => {
    if (!userProfile?.id) return;
    setUnreadCount(0);
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id);
  };

  const clearAll = async () => {
    if (!userProfile?.id) return;
    if (!confirm("مسح سجل الإشعارات؟")) return;
    await api.clearAllNotifications(userProfile.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  const navItems = currentRole === 'shipper' ? [
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
    { label: "سجل الرحلات", path: '/driver/history', icon: <History size={20} /> }, 
    { label: "حسابي", path: '/driver/account', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 w-full overflow-x-hidden" dir="rtl">
      {/* القائمة الجانبية */}
      <aside className={cn("fixed lg:static inset-y-0 right-0 z-50 w-72 bg-[#0f172a] text-white flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0")}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h1 className="font-black text-xl italic tracking-tighter">SAS TRANSPORT</h1>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X /></Button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn("flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all", location.pathname === item.path ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5"><Button variant="ghost" className="w-full justify-start gap-4 text-rose-400 font-black h-14 rounded-2xl" onClick={logout}><LogOut size={20} /> خروج</Button></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b px-6 flex items-center justify-between shadow-sm shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={28} className="text-blue-600" /></Button>
          
          <div className="flex items-center gap-3">
             {/* 🔊 زر تفعيل الصوت الذكي */}
             <div className="relative">
                {!isAudioEnabled && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
                <Button 
                    variant={isAudioEnabled ? "ghost" : "destructive"} 
                    size="icon" 
                    className={cn("h-11 w-11 rounded-xl transition-all", isAudioEnabled ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600 shadow-md")}
                    onClick={handleEnableAudio}
                >
                    {isAudioEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
                </Button>
             </div>

             <Popover onOpenChange={(open) => open && markAsRead()}>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50">
                      <Bell size={22} className="text-slate-600" />
                    </Button>
                    {unreadCount > 0 && <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-black animate-bounce shadow-sm">{unreadCount}</div>}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-[2rem] shadow-2xl border-none overflow-hidden bg-white" align="start">
                   <div className="p-5 bg-[#0f172a] text-white flex justify-between items-center">
                      <p className="font-black text-sm">التنبيهات المباشرة</p>
                      <Button variant="ghost" size="sm" className="text-rose-400 h-8 hover:bg-white/10" onClick={clearAll}><Trash2 size={16} /></Button>
                   </div>
                   <ScrollArea className="h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-xs font-bold">لا توجد تنبيهات</div>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <div key={notif.id} className="p-4 border-b border-slate-50 flex gap-3 hover:bg-slate-50">
                             <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", notif.is_read ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600")}><Bell size={14}/></div>
                             <div className="flex-1 text-right">
                                <p className="font-black text-[11px] text-slate-800">{notif.title}</p>
                                <p className="text-[10px] text-slate-500 leading-tight mt-1">{notif.message}</p>
                             </div>
                          </div>
                        ))
                      )}
                   </ScrollArea>
                </PopoverContent>
             </Popover>

             <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-inner">{userProfile?.full_name?.charAt(0)}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#f8fafc]">
          <AnimatePresence mode="wait"><motion.div key={location.pathname} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.2 }}>{children}</motion.div></AnimatePresence>
        </div>
      </main>
    </div>
  );
}
