import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Plus, Search, MapPin, Loader2, ArrowRight, Users, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { supabase } from '@/integrations/supabase/client';

export default function ShipperDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0 });
  const [recentLoads, setRecentLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!userProfile?.id) return;
    try {
      const [s, l] = await Promise.all([
        api.getShipperStats(userProfile.id),
        api.getUserLoads(userProfile.id)
      ]);
      setStats(s);
      setRecentLoads(l.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase.channel('shipper-dashboard')
      .on('postgres_changes', { event: '*', table: 'loads', schema: 'public' }, () => fetchDashboardData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight">{t('welcome')}، {userProfile?.full_name} 👋</h1>
            <p className="text-muted-foreground font-medium text-lg mt-2">نظم شحناتك وراقب أسطول سائقيك بكل سهولة</p>
          </motion.div>

          <Button className="rounded-2xl h-14 px-8 font-black text-lg bg-primary shadow-xl shadow-primary/20" onClick={() => navigate('/shipper/post')}>
            <Plus className="me-2" size={24} strokeWidth={3} /> {t('post_load')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<Package size={28} />} color="primary" trend={{ value: "4", isPositive: true }} />
          <StatCard title={t('completed_trips')} value={stats.completedTrips} icon={<CheckCircle size={28} />} color="accent" trend={{ value: "10", isPositive: true }} />

          <Card className="rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-700 text-white shadow-2xl border-none overflow-hidden relative">
            <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-sm font-bold opacity-60 uppercase">تتبع سريع</p>
                <p className="text-xl font-black">ابحث عن شحنتك برقم البوليصة</p>
              </div>
              <div className="relative mt-4">
                <Search className="absolute end-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
                <input type="text" placeholder="رقم الشحنة..." className="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 focus:outline-none transition-all font-bold placeholder:text-white/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-[2.5rem] shadow-2xl border-none p-8">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between pb-8">
              <div>
                <CardTitle className="text-2xl font-black">{t('my_shipments')}</CardTitle>
                <CardDescription className="font-medium text-base">آخر الشحنات التي قمت بنشرها</CardDescription>
              </div>
              <Button variant="ghost" className="font-black text-primary" onClick={() => navigate('/shipper/loads')}>
                عرض الكل <ArrowRight className="ms-2" size={18} />
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={40} /></div>
                ) : recentLoads.length > 0 ? (
                  recentLoads.map((load) => (
                    <div key={load.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] bg-muted/30 hover:bg-white border-2 border-transparent hover:border-primary/20 transition-all cursor-pointer group">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary group-hover:rotate-6 transition-transform">
                          <Package size={28} />
                        </div>
                        <div>
                          <p className="font-black text-lg">{load.type || 'شحنة عامة'}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm font-bold text-muted-foreground">
                            <span><MapPin size={14} className="inline me-1" /> {load.origin}</span>
                            <span>←</span>
                            <span><MapPin size={14} className="inline me-1" /> {load.destination}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="font-black text-primary text-xl">{load.price} ر.س</p>
                        <p className="text-xs font-bold text-muted-foreground">{load.status === 'available' ? 'في انتظار ناقل' : 'جاري التنفيذ'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-[2rem] border-2 border-dashed">
                    <p className="font-bold text-muted-foreground">لا توجد شحنات حالية</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* تم تغيير البطاقة الخضراء هنا */}
          <Card className="rounded-[2.5rem] shadow-2xl border-none bg-accent text-white p-8 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/5 skew-y-12 translate-y-20" />
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <Users size={28} /> إدارة السائقين
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 relative z-10">
              <p className="font-medium text-white/80 leading-relaxed mb-8 text-lg">
                تابع السائقين المسجلين في برنامجك أو أرسل دعوات انضمام لسائقين جدد لتوسيع شبكتك.
              </p>
              <div className="space-y-4">
                <Button className="w-full h-14 rounded-2xl bg-white text-accent hover:bg-white/90 font-black text-lg shadow-xl shadow-accent/20 gap-2">
                  <UserPlus size={20} /> + دعوة سائق جديد
                </Button>
                <Button variant="ghost" className="w-full h-14 rounded-2xl border-2 border-white/20 text-white hover:bg-white/10 font-black" onClick={() => navigate('/shipper/drivers')}>
                  إدارة السائقين المسجلين
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
