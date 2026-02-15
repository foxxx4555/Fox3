import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function DriverLoads() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoads = async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('available-loads')
      .on('postgres_changes', { event: '*', table: 'loads', filter: 'status=eq.available' }, () => fetchLoads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAcceptLoad = async (loadId: string) => {
    if (!userProfile?.id) return;
    try {
      await api.acceptLoad(loadId, userProfile.id);
      toast.success("تم قبول الشحنة بنجاح! اذهب لصفحة مهامي للبدء.");
      fetchLoads();
    } catch (err: any) {
      toast.error("فشل في قبول الشحنة");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 text-right">الشحنات المتاحة</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : loads.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed">
            <Package size={64} className="mx-auto text-slate-200 mb-4" />
            <p className="text-xl font-black text-slate-400 italic">لا توجد شحنات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {loads.map((load) => (
              <Card key={load.id} className="rounded-[2rem] border-none shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">من</p>
                          <p className="font-black text-xl">{load.origin}</p>
                        </div>
                        <div className="flex-1 h-px bg-slate-100 relative"><MapPin size={16} className="absolute inset-0 m-auto text-blue-600 bg-white" /></div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إلى</p>
                          <p className="font-black text-xl">{load.destination}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-slate-50">{load.weight} طن</Badge>
                        <Badge variant="secondary" className="bg-slate-50">{load.package_type}</Badge>
                      </div>
                    </div>
                    <div className="md:w-64 flex flex-col justify-between items-end border-r pr-8">
                      <p className="text-3xl font-black text-blue-600">{load.price} <span className="text-sm">ر.س</span></p>
                      <Button onClick={() => handleAcceptLoad(load.id)} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg text-white">قبول الشحنة</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
