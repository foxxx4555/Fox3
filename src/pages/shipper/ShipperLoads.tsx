import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, CheckCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const statusAr: Record<string, string> = {
  available: 'متاحة', in_progress: 'قيد التنفيذ', completed: 'مكتملة',
};

export default function ShipperLoads() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLoads = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('loads-live').on('postgres_changes', { event: '*', table: 'loads' }, () => fetchLoads()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const handleDone = async (id: string) => {
    if (!confirm("هل تؤكد إتمام التوصيل بنجاح؟")) return;
    await api.completeLoad(id);
    toast.success("تم إرسال إشعار للتاجر بإتمام الرحلة ✅");
    fetchLoads();
  };

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-black flex items-center gap-3"><Package className="text-primary"/> مهامي وشحناتي</h1>
        
        <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
          {['all', 'in_progress', 'completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={cn("px-6 py-2 rounded-full text-sm font-black transition-all border-2 shrink-0", 
            filter === s ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400")}>
              {s === 'all' ? 'الكل' : statusAr[s]}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div> : (
          <div className="grid gap-4">
            {filtered.map(load => (
              <Card key={load.id} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6">
                   <div className="flex justify-between items-center mb-4">
                      <Badge className="bg-blue-50 text-blue-600 border-none font-black">{statusAr[load.status]}</Badge>
                      <span className="text-xs font-bold text-slate-400">{new Date(load.created_at).toLocaleDateString('ar-SA')}</span>
                   </div>
                   <p className="font-black text-lg mb-2">{load.origin} ← {load.destination}</p>
                   <div className="flex justify-between items-center mt-6 pt-6 border-t">
                      <p className="font-black text-xl text-blue-600">{load.price} ريال</p>
                      {load.status === 'in_progress' && (
                        <Button onClick={() => handleDone(load.id)} className="bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl gap-2">
                           <CheckCircle size={18}/> تأكيد التوصيل
                        </Button>
                      )}
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
function cn(...i: any) { return i.filter(Boolean).join(" "); }
