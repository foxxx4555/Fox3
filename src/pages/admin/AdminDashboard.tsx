import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Users, Package, Truck, CheckCircle, ShieldCheck, Activity, BarChart3, AlertCircle } from 'lucide-react';
import { AdminStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalDrivers: 0, totalShippers: 0, activeLoads: 0, completedTrips: 0 });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [s, t] = await Promise.all([api.getAdminStats(), api.getTickets()]);
      setStats(s);
      setAlerts(t.slice(0, 4));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh on any load change or ticket change
    const channel = supabase
      .channel('admin-refresh')
      .on('postgres_changes', { event: '*', table: 'loads', schema: 'public' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'support_tickets', schema: 'public' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
              <ShieldCheck className="text-primary" size={40} strokeWidth={2.5} />
              {t('dashboard')} الإدارة
            </h1>
            <p className="text-muted-foreground font-medium text-lg mt-2">نظرة عامة على حالة النظام وأداء العمليات الحية</p>
          </motion.div>

          <Button className="h-12 px-6 rounded-2xl bg-slate-900 font-bold shadow-xl shadow-slate-900/10 gap-2">
            <BarChart3 size={20} /> تصدير التقارير
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title={t('total_users')} value={stats.totalUsers} icon={<Users size={28} />} color="primary" />
          <StatCard title={t('total_drivers')} value={stats.totalDrivers} icon={<Truck size={28} />} color="accent" />
          <StatCard title={t('total_shippers')} value={stats.totalShippers} icon={<Package size={28} />} color="secondary" />
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<Activity size={28} />} color="destructive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-[2.5rem] shadow-2xl border-none p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between pb-8">
              <div>
                <CardTitle className="text-2xl font-black">تحليل العمليات</CardTitle>
                <CardDescription className="font-medium text-base">معدل نمو الطلبات والمستخدمين الجدد</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-0 h-[300px] flex items-center justify-center border-2 border-dashed border-border rounded-[2rem] bg-muted/20">
              <div className="text-center space-y-4">
                <BarChart3 className="mx-auto text-muted-foreground/20" size={64} />
                <p className="font-bold text-muted-foreground">مخطط البيانات سيظهر هنا عند توفر المزيد من العمليات</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] shadow-2xl border-none p-8 bg-slate-950 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <AlertCircle className="text-destructive" />
                بلاغات الدعم
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4 mt-4">
              {alerts.length > 0 ? alerts.map((alert, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className={cn(
                    "w-1.5 h-10 rounded-full",
                    alert.status === 'open' ? "bg-destructive" : "bg-emerald-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{alert.subject || 'بلاغ رقم ' + alert.id.slice(0, 5)}</p>
                    <p className="text-[10px] font-medium opacity-50 mt-1 uppercase tracking-wider">{new Date(alert.created_at).toLocaleString('ar')}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 opacity-40">
                  <p className="font-bold">لا يوجد بلاغات حالية</p>
                </div>
              )}
              <Button variant="ghost" className="w-full h-12 rounded-xl text-white/40 hover:text-white hover:bg-white/5 font-bold mt-4">
                مشاهدة جميع البلاغات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
