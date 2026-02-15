import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Package, Truck, Users, Settings, LogOut, FileText, Plus, Menu, X, Bell, Search, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) return;

    // البدء في الاستماع للإشعارات اللحظية
    const channel = supabase.channel(`notifs-${userProfile.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${userProfile.id}` 
        }, 
        (p) => {
          console.log("🔔 إشعار جديد وصل:", p.new); // للتأكد من وصول البيانات في الكونسول
          
          // تشغيل صوت التنبيه
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {
            console.log("🔊 الصوت محجوب حتى يتفاعل المستخدم مع الصفحة");
          });

          // إظهار الإشعار بشكل احترافي
          toast.success(p.new.title, { 
            description: p.new.message,
            duration: 5000,
          });
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

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
      {/* القائمة الجانبية (Sidebar) */}
      <aside className={cn(
        "fixed lg:static inset-y-0 right-0 z-50 w-72 bg-[#0f172a] text-white flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <h1 className="font-black text-xl italic tracking-tighter">SAS TRANSPORT</h1>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X /></Button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => setSidebarOpen(false)} 
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all", 
                location.pathname === item.path ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-6">
          <Button variant="ghost" className="w-full justify-start gap-4 text-rose-400 font-black h-14 rounded-2xl hover:bg-rose-500/10" onClick={logout}>
            <LogOut size={20} /> خروج
          </Button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white border-b px-6 flex items-center justify-between shadow-sm shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden h-12 w-12 rounded-xl" onClick={() => setSidebarOpen(true)}>
            <Menu size={28} className="text-blue-600" />
          </Button>
          
          <div className="flex items-center gap-3">
             {/* زر الإشعارات مع نقطة حمراء وهمية لزيادة الجمالية */}
             <div className="relative">
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50">
                  <Bell size={22} className="text-slate-600" />
                </Button>
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
             </div>
             {/* صورة الملف الشخصي أو أول حرف من الاسم */}
             <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                {userProfile?.full_name?.charAt(0) || 'U'}
             </div>
          </div>
        </header>

        {/* جسم الصفحة */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#f8fafc]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
