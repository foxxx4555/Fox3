import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Truck, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ShipperTrack() {
  const [activeLoads, setActiveLoads] = useState<any[]>([]);

  useEffect(() => {
    // جلب الشحنات اللي "قيد التنفيذ" فقط عشان نراقبها
    const fetchActiveLoads = async () => {
      const { data } = await supabase
        .from('loads')
        .select(`*, driver:profiles!loads_driver_id_fkey(*)`)
        .eq('status', 'in_progress');
      setActiveLoads(data || []);
    };

    fetchActiveLoads();

    // استماع لحظي لتحركات السواقين
    const channel = supabase.channel('tracking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, fetchActiveLoads)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-black">تتبع الشحنات الحية</h1>
        <div className="grid gap-4">
          {activeLoads.length > 0 ? activeLoads.map(load => (
            <Card key={load.id} className="rounded-2xl border-2 border-primary/10">
              <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-pulse">
                    <Truck />
                  </div>
                  <div>
                    <p className="font-black">شحنة: {load.origin} ← {load.destination}</p>
                    <p className="text-sm text-muted-foreground font-bold">السائق: {load.driver?.full_name}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => window.open(`https://www.google.com/maps?q=${load.driver?.latitude},${load.driver?.longitude}`, '_blank')}
                  className="bg-emerald-600 font-bold gap-2"
                >
                  <Navigation size={18} /> عرض مكان السائق الآن
                </Button>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <p className="font-bold text-muted-foreground">لا توجد شحنات قيد التنفيذ حالياً لتتبعها</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
