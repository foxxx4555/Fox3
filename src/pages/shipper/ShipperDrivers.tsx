import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Plus, Search, MapPin, Loader2, ArrowRight, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; 
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const statusMap: Record<string, string> = {
  available: 'متاحة', pending: 'معلقة', in_progress: 'قيد التنفيذ', completed: 'مكتملة', cancelled: 'ملغاة',
};

export default function ShipperDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0 });
  const [recentLoads, setRecentLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!userProfile?.id) return;
    try {
      const [s, l] = await Promise.all([api.getShipperStats(userProfile.id), api.getUserLoads(userProfile.id)]);
      setStats(s);
      setRecentLoads(l.slice(0, 3));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('shipper-dash').on('postgres_changes', { event: '*', table: 'loads' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">مرحباً بك، {userProfile?.full_name} ✨</h1>
            <p className="text-muted-foreground font-medium text-lg mt-1">تابع شحناتك وسائقيك لحظة بلحظة</p>
          </div>
          <Button className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl" onClick={() => navigate('/shipper/post')}>
            <Plus className="me-2" /> نشر شحنة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="الشحنات النشطة" value={stats.activeLoads} icon={<Package size={28} />} color="primary" />
          <StatCard title="الرحلات المكتملة" value={stats.completedTrips} icon={<CheckCircle size={28} />} color="accent" />
          <Card className="rounded-[2.5rem] bg-gradient-to-tr from-slate-800 to-slate-950 text-white p-8">
             <p className="text-sm font-bold opacity-60">تتبع سريع</p>
             <p className="text-xl font-black mb-4">ابحث برقم البوليصة</p>
             <div className="relative">
                <Search className="absolute end-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input type="text" placeholder="رقم الشحنة..." className="w-full h-12 rounded-xl bg-white/10 border-none px-4 focus:bg-white/20 font-bold" />
             </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-[2.5rem] shadow-xl border-none p-8 bg-white">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black">آخر العمليات</h3>
              <Button variant="ghost" className="font-bold text-blue-600" onClick={() => navigate('/shipper/history')}>سجل الشحنات <ArrowRight className="ms-2" size={18}/></Button>
            </div>
            <div className="space-y-4">
              {recentLoads.map(load => (
                <div key={load.id} className="flex justify-between items-center p-6 rounded-3xl bg-slate-50 border-2 border-transparent hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center text-blue-600"><Package /></div>
                    <div className="text-right">
                      <p className="font-black">{load.origin} ← {load.destination}</p>
                      <Badge variant="secondary" className="text-[10px] font-bold mt-1">{statusMap[load.status]}</Badge>
                    </div>
                  </div>
                  <p className="font-black text-blue-600">{load.price} ر.س</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[2.5rem] shadow-xl border-none bg-emerald-600 text-white p-8 relative overflow-hidden">
            <h3 className="text-2xl font-black flex items-center gap-3 mb-4"><Users size={28} /> رادار السائقين</h3>
            <p className="font-medium text-emerald-50 mb-8 leading-relaxed">شاهد مواقع السائقين المعتمدين وتواصل معهم مباشرة عبر الخريطة.</p>
            <Button className="w-full h-14 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 font-black text-lg" onClick={() => navigate('/shipper/drivers')}>فتح الرادار المباشر</Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
