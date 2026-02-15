import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Package, Truck, CircleDollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function DriverLoads() {
  const { t } = useTranslation();
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
    
    // التحديث اللحظي عند إضافة شحنات جديدة
    const channel = supabase.channel('available-loads')
      .on('postgres_changes', { event: '*', table: 'loads', filter: 'status=eq.available' }, () => fetchLoads())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAcceptLoad = async (loadId: string) => {
    if (!userProfile?.id) return;
    try {
      await api.acceptLoad(loadId, userProfile.id);
      toast.success("تم قبول الشحنة بنجاح! توجه لمهامي لبدء التنفيذ.");
      fetchLoads();
    } catch (err: any) {
      toast.error("فشل في قبول الشحنة");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="text-right">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">الشحنات المتاحة</h1>
          <p className="text-muted-foreground font-medium mt-1">تصفح الشحنات الحالية واقبل ما يناسب شاحنتك</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : loads.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed">
            <Package size={64} className="mx-auto text-slate-200 mb-4" />
            <p className="text-xl font-black text-slate-400 italic">لا توجد شحنات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {loads.map((load) => (
              <Card key={load.id} className="rounded-[2rem] border-none shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all group">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                           <Truck size={20} />
                        </div>
                        <span className="font-bold text-slate-400 text-sm uppercase tracking-widest">عرض توصيل مباشر</span>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">من</p>
                          <p className="font-black text-xl">{load.origin}</p>
                        </div>
                        <div className="flex-1 h-px bg-slate-100 relative">
                           <div className="absolute inset-0 flex items-center justify-center">
                              <MapPin size={16} className="text-blue-600 bg-white" />
                           </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إلى</p>
                          <p className="font-black text-xl">{load.destination}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-4">
                        <Badge variant="secondary" className="rounded-xl px-4 py-2 bg-slate-50 text-slate-700 font-bold border-none">
                          الوزن: {load.weight} طن
                        </Badge>
                        <Badge variant="secondary" className="rounded-xl px-4 py-2 bg-slate-50 text-slate-700 font-bold border-none">
                          النوع: {load.package_type || 'بضائع عامة'}
                        </Badge>
                      </div>
                    </div>

                    <div className="md:w-64 flex flex-col justify-between items-end gap-6 md:border-r md:pr-8 border-slate-50">
                      <div className="text-left md:text-right w-full">
                        <p className="text-xs font-black text-slate-400 uppercase mb-1">الأجرة المعروضة</p>
                        <p className="text-3xl font-black text-blue-600 tracking-tight">{load.price} <span className="text-sm">ر.س</span></p>
                      </div>
                      
                      <Button 
                        onClick={() => handleAcceptLoad(load.id)}
                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-lg shadow-xl transition-all active:scale-95"
                      >
                        قبول الشحنة الآن
                      </Button>
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
