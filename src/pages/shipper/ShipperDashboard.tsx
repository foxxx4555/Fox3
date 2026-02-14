import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { 
  Package, 
  CheckCircle, 
  Search, 
  MapPin, 
  Loader2, 
  ArrowLeft, 
  Users, 
  Plus 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; 
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export default function ShipperDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0 });
  const [recentLoads, setRecentLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!userProfile?.id) return;
    try {
      const [s, l] = await Promise.all([
        api.getShipperStats(userProfile.id),
        api.getUserLoads(userProfile.id)
      ]);
      setStats(s);
      setRecentLoads(l.slice(0, 1)); // عرض آخر شحنة كما في الصورة
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('shipper-dash-sync')
      .on('postgres_changes', { event: '*', table: 'loads' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        
        {/* 1. الترحيب وزر نشر شحنة */}
        <div className="flex justify-between items-start pt-4">
           <Button onClick={() => navigate('/shipper/post')} className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl h-12 px-6 shadow-lg shadow-blue-200">
             <Plus size={20} className="me-1" /> نشر شحنة
           </Button>
           <div className="text-end">
             <h1 className="text-3xl font-black text-slate-900">مرحباً بك، {userProfile?.full_name?.split(' ')[0]} ✨</h1>
             <p className="text-sm text-slate-500 font-bold">نظم شحناتك وراقب أعمالك بكل سهولة وذكاء</p>
           </div>
        </div>

        {/* 2. عدادات الإحصائيات (مثل الصورة) */}
        <div className="grid grid-cols-2 gap-4">
           {/* الشحنات النشطة */}
           <Card className="rounded-[2rem] border-none shadow-sm bg-[#ebf3ff]">
              <CardContent className="p-6 flex items-center justify-between">
                 <div className="text-end">
                    <p className="text-xs text-slate-500 font-bold mb-1">الشحنات النشطة</p>
                    <p className="text-3xl font-black text-slate-900">{stats.activeLoads}</p>
                 </div>
                 <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Package size={24} />
                 </div>
              </CardContent>
           </Card>

           {/* الرحلات المكتملة */}
           <Card className="rounded-[2rem] border-none shadow-sm bg-[#e7f9f3]">
              <CardContent className="p-6 flex items-center justify-between">
                 <div className="text-end">
                    <p className="text-xs text-slate-500 font-bold mb-1">الرحلات المكتملة</p>
                    <p className="text-3xl font-black text-slate-900">{stats.completedTrips}</p>
                 </div>
                 <div className="w-12 h-12 bg-[#10b981] rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <CheckCircle size={24} />
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* 3. صندوق التتبع (الأزرق) */}
        <Card className="rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-700 text-white shadow-xl border-none p-8">
           <p className="text-xs font-black opacity-60 uppercase tracking-widest text-end mb-1">تتبع سريع</p>
           <h3 className="text-xl font-black text-end mb-4">ابحث عن شحنتك برقم البوليصة</h3>
           <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 opacity-40 text-white" size={18} />
              <input 
                type="text" 
                placeholder="رقم الشحنة..." 
                className="w-full h-12 rounded-xl bg-white/20 border border-white/10 px-12 focus:outline-none focus:bg-white/30 transition-all font-bold placeholder:text-white/50 text-right" 
              />
           </div>
        </Card>

        {/* 4. آخر الشحنات (الكارت الأبيض) */}
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
           <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                 <Button variant="link" onClick={() => navigate('/shipper/history')} className="text-blue-600 font-bold p-0">
                    عرض سجل الشحنات <ArrowLeft size={16} className="ms-1" />
                 </Button>
                 <h3 className="text-xl font-black text-slate-800">آخر الشحنات</h3>
              </div>

              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
              ) : recentLoads.length > 0 ? (
                recentLoads.map(load => (
                  <div key={load.id} className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50/50">
                     <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center text-blue-600 shrink-0">
                        <Package size={20} />
                     </div>
                     <div className="flex-1 text-end px-4">
                        <p className="font-black text-slate-800">{load.type || 'شحنة عامة'}</p>
                        <p className="text-xs text-slate-500 font-bold">{load.origin} ← {load.destination}</p>
                     </div>
                     <div className="text-start">
                        <p className="font-black text-blue-600">{load.price} ر.س</p>
                        <Badge variant="secondary" className="text-[9px] font-black">{t(load.status)}</Badge>
                     </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-10 font-bold italic">لا توجد بيانات حالية</p>
              )}
           </CardContent>
        </Card>

        {/* 5. إدارة السائقين (الكارت الأخضر) - تم حذف زر الدعوة */}
        <Card className="rounded-[2.5rem] shadow-xl border-none bg-[#10b981] text-white p-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-white/5 skew-y-12 translate-y-20 pointer-events-none" />
           <div className="relative z-10 text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                 <h3 className="text-2xl font-black italic">إدارة السائقين</h3>
                 <Users size={32} />
              </div>
              <p className="font-medium text-white/80 text-sm">تابع السائقين المسجلين في برنامجك لمراقبة سير العمليات الحية.</p>
              <div className="pt-2">
                 <Button 
                   variant="ghost" 
                   className="w-full h-14 rounded-2xl border-2 border-white/20 text-white font-black text-lg hover:bg-white/10" 
                   onClick={() => navigate('/shipper/drivers')}
                 >
                    إدارة السائقين
                 </Button>
              </div>
           </div>
        </Card>

      </div>
    </AppLayout>
  );
}
