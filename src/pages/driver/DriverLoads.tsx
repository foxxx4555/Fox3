import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Package, Phone, MessageCircle, X, Info, User, Weight, Truck, Banknote, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function DriverLoads() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [showSurvey, setShowSurvey] = useState(false);

  const fetchLoads = async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('public-market').on('postgres_changes', { event: '*', table: 'loads' }, () => fetchLoads()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAgree = async () => {
    if (!selectedLoad || !userProfile?.id) return;
    try {
      await api.acceptLoad(selectedLoad.id, userProfile.id);
      toast.success("تم نقل الشحنة إلى مهامي ✅");
      setShowSurvey(false); 
      setSelectedLoad(null); 
      fetchLoads();
    } catch (err) { toast.error("فشل في القبول"); }
  };

  const handleWhatsApp = (load: any) => {
    const phone = load.owner?.phone;
    if (!phone) return;
    const cleanPhone = phone.startsWith('05') ? '966' + phone.slice(1) : phone;
    const msg = `السلام عليكم، أنا ناقل ومهتم بشحنتك من ${load.origin} إلى ${load.destination}. هل لا تزال متاحة؟`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    setTimeout(() => { setSelectedLoad(null); setShowSurvey(true); }, 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl font-black text-slate-900 text-right">البحث عن عمل</h1>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : (
          <div className="grid gap-6">
            {loads.length > 0 ? loads.map((load) => (
              <Card key={load.id} className="rounded-[2.5rem] border-none shadow-md bg-white overflow-hidden hover:shadow-xl transition-all border-r-8 border-r-blue-600">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1 w-full text-right space-y-4">
                    <div className="flex items-center gap-4 justify-end">
                      <div><p className="text-[10px] font-black text-slate-400 uppercase">من</p><p className="font-black text-lg">{load.origin}</p></div>
                      <div className="flex-1 h-px bg-slate-100 relative min-w-[40px]"><MapPin size={14} className="absolute inset-0 m-auto text-blue-600"/></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase text-left">إلى</p><p className="font-black text-lg text-left">{load.destination}</p></div>
                    </div>
                  </div>
                  <div className="md:w-48 text-center md:border-r md:pr-6">
                    <p className="text-2xl font-black text-blue-600 mb-3">{load.price} <span className="text-xs">ر.س</span></p>
                    <Button onClick={() => setSelectedLoad(load)} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-blue-600 font-black">عرض التفاصيل</Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed">
                <p className="font-bold text-muted-foreground">لا توجد شحنات متاحة حالياً</p>
              </div>
            )}
          </div>
        )}

        {/* دايالوج تفاصيل الشحنة */}
        <Dialog open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none bg-white shadow-2xl">
            <DialogHeader className="p-6 bg-[#0f172a] text-white flex flex-row justify-between items-center space-y-0">
               <DialogTitle className="text-xl font-black text-white">تفاصيل الحمولة الكاملة</DialogTitle>
               <Button variant="ghost" size="icon" onClick={() => setSelectedLoad(null)} className="text-white hover:bg-white/20 h-8 w-8"><X size={20} /></Button>
            </DialogHeader>
            {selectedLoad && (
              <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 flex justify-between items-center">
                    <div className="text-center flex-1"><p className="text-2xl font-black">{selectedLoad.origin}</p><p className="text-[10px] text-blue-600 font-black">التحميل</p></div>
                    <div className="flex flex-col items-center px-6"><Badge className="bg-blue-600 mb-2">{selectedLoad.distance || '---'} كم</Badge><div className="w-24 h-0.5 bg-blue-200 border-dashed border-t-2" /></div>
                    <div className="text-center flex-1"><p className="text-2xl font-black">{selectedLoad.destination}</p><p className="text-[10px] text-blue-600 font-black">التفريغ</p></div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-3xl bg-slate-50 border flex flex-col items-center gap-1"><Weight size={20}/><p className="text-[9px] font-black uppercase">الوزن</p><p className="font-black">{selectedLoad.weight} طن</p></div>
                  <div className="p-4 rounded-3xl bg-slate-50 border flex flex-col items-center gap-1"><Truck size={20}/><p className="text-[9px] font-black uppercase">الشاحنة</p><p className="font-black text-sm">{selectedLoad.body_type || 'مسطحة'}</p></div>
                  <div className="p-4 rounded-3xl bg-slate-50 border flex flex-col items-center gap-1"><Package size={20}/><p className="text-[9px] font-black uppercase">النوع</p><p className="font-black text-sm">{selectedLoad.package_type || 'بضائع'}</p></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <Button onClick={() => { window.location.href=`tel:${selectedLoad.owner?.phone}`; setTimeout(()=>setShowSurvey(true), 2000); }} className="h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg gap-3 shadow-xl"><Phone size={24} /> اتصال</Button>
                   <Button onClick={() => handleWhatsApp(selectedLoad)} className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg gap-3 shadow-xl"><MessageCircle size={24} /> واتساب</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* دايالوج الاستبيان بعد الاتصال */}
        <Dialog open={showSurvey} onOpenChange={setShowSurvey}>
          <DialogContent className="max-w-md rounded-[3rem] p-8 text-center bg-white shadow-2xl">
             <DialogHeader>
                <DialogTitle className="text-xl font-black mb-6 text-center">هل تم الاتفاق مع التاجر في SAS؟</DialogTitle>
                <DialogDescription className="sr-only">تأكيد عملية الاتفاق</DialogDescription>
             </DialogHeader>
             <div className="space-y-3">
                <Button className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black" onClick={handleAgree}>نعم، تم الاتفاق بنجاح ✅</Button>
                <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-bold" onClick={() => setShowSurvey(false)}>لا، لم يتم الاتفاق</Button>
             </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
