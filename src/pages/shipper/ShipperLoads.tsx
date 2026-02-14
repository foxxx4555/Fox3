import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, X, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// قاموس الترجمة لمنع الخطأ
const statusTranslations: Record<string, string> = {
  all: 'الكل',
  available: 'متاحة',
  pending: 'معلقة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

export default function ShipperLoads() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    const channel = supabase.channel('shipper-loads-realtime')
      .on('postgres_changes', { event: '*', table: 'loads' }, () => fetchLoads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const handleComplete = async (loadId: string) => {
    if (!confirm("هل تم استلام وتوصيل الشحنة فعلياً؟")) return;
    try {
      await api.completeLoad(loadId);
      toast.success("تم تحديث حالة الشحنة لمكتملة");
      fetchLoads();
    } catch (e) { toast.error("حدث خطأ"); }
  };

  const filteredLoads = statusFilter === 'all' ? loads : loads.filter(l => l.status === statusFilter);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-black mb-6">إدارة شحناتي</h1>
        
        {/* فلاتر الحالات */}
        <div className="flex gap-2 flex-wrap mb-8">
          {['all', 'available', 'in_progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-black transition-all border-2",
                statusFilter === status ? "bg-primary border-primary text-white" : "bg-white border-slate-100 text-slate-400"
              )}
            >
              {statusTranslations[status]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : filteredLoads.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed">
            <p className="font-bold text-muted-foreground">لا توجد شحنات في هذا القسم حالياً</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLoads.map(load => (
              <Card key={load.id} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <Badge className="font-black">{statusTranslations[load.status] || load.status}</Badge>
                    <span className="text-xs font-bold text-muted-foreground">{new Date(load.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <p className="font-black text-lg mb-2 flex items-center gap-2"><MapPin size={18} className="text-primary"/> {load.origin} ← {load.destination}</p>
                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-50">
                     <p className="font-black text-xl text-primary">{load.price} ريال</p>
                     {load.status === 'in_progress' && (
                       <Button onClick={() => handleComplete(load.id)} className="bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl">تم التوصيل</Button>
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

// دالة مساعدة
function cn(...inputs: any) { return inputs.filter(Boolean).join(" "); }
