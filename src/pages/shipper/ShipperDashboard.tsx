import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Plus, Search, MapPin, Loader2, ArrowRight } from 'lucide-react';
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

    const channel = supabase
      .channel('shipper-dashboard')
      .on('postgres_changes', { event: '*', table: 'loads', schema: 'public' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight">{t('welcome')}، {userProfile?.full_name} ✨</h1>
            <p className="text-muted-foreground font-medium text-lg mt-2">نظم شحناتك وراقب أعمالك بكل سهولة وذكاء</p>
          </motion.div>

          <Button className="rounded-2xl h-14 px-8 font-black text-lg bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform" onClick={() => navigate('/shipper/post')}>
            <Plus className="me-2" size={24} strokeWidth={3} /> {t('post_load')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title={t('active_loads')}
            value={stats.activeLoads}
            icon={<Package size={28} />}
            color="primary"
            trend={{ value: "4", isPositive: true }}
          />
          <StatCard
            title={t('completed_trips')}
            value={stats.completedTrips}
            icon={<CheckCircle size={28} />}
            color="accent"
            trend={{ value: "10", isPositive: true }}
          />

          <Card className="rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-700 text-white shadow-2xl border-none overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-sm font-bold opacity-60 uppercase tracking-widest">تتبع سريع</p>
                <p className="text-xl font-black">ابحث عن شحنتك برقم البوليصة</p>
              </div>
              <div className="relative mt-4">
                <Search className="absolute end-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
                <input
                  type="text"
                  placeholder="رقم الشحنة..."
                  className="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 focus:outline-none focus:bg-white/20 transition-all font-bold placeholder:text-white/40"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-[2.5rem] shadow-2xl border-none p-8">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between space-y-0 pb-8">
              <div>
                <CardTitle className="text-2xl font-black">{t('my_shipments')}</CardTitle>
                <CardDescription className="font-medium text-base mt-1">آخر الشحنات التي قمت بنشرها</CardDescription>
              </div>
              <Button variant="ghost" className="font-black text-primary hover:bg-primary/5 rounded-xl" onClick={() => navigate('/shipper/loads')}>
                عرض الكل <ArrowRight className="ms-2" size={18} />
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={40} /></div>
                ) : recentLoads.length > 0 ? (
                  recentLoads.map((load) => (
                    <div key={load.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] bg-muted/30 border-2 border-transparent hover:border-primary/20 hover:bg-white transition-all cursor-pointer group">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary transition-transform group-hover:rotate-6">
                          <Package size={28} />
                        </div>
                        <div>
                          <p className="font-black text-lg">{load.type || 'شحنة عامة'}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm font-bold text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin size={14} className="text-primary" /> {load.origin}</span>
                            <span className="text-xl">←</span>
                            <span className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {load.destination}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center gap-6">
                        <div className="text-end">
                          <p className="font-black text-primary text-xl">{load.price} ر.س</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase">{load.status === 'available' ? 'في انتظار ناقل' : 'جاري التنفيذ'}</p>
                        </div>
                        <div className={cn(
                          "w-3 h-3 rounded-full animate-pulse",
                          load.status === 'available' ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border">
                    <Package className="mx-auto text-muted-foreground/30 mb-4" size={48} />
                    <p className="font-bold text-muted-foreground">لا توجد شحنات حالية</p>
                    <Button variant="link" onClick={() => navigate('/shipper/post')} className="font-black mt-2">ابدأ بنشر أول شحنة الآن</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] shadow-2xl border-none bg-accent text-white p-8 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/5 skew-y-12 translate-y-20" />
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-black">أضف شركاء جدد</CardTitle>
            </CardHeader>
            <CardContent className="px-0 relative z-10">
              <p className="font-medium text-white/80 leading-relaxed mb-8 text-lg">أضف مستلمين دائمين لمنتجاتك لتسريع عملية حجز الشحنات في المرات القادمة</p>
              <div className="space-y-4">
                <Button className="w-full h-14 rounded-2xl bg-white text-accent hover:bg-white/90 font-black text-lg shadow-xl shadow-accent/20">
                  + إضافة مستلم جديد
                </Button>
                <Button variant="ghost" className="w-full h-14 rounded-2xl border-2 border-white/20 text-white hover:bg-white/10 font-black">
                  إدارة جهات الاتصال
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
