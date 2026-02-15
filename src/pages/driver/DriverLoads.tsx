import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, MapPin, Package, Phone, MessageCircle, X, 
  CheckCircle2, AlertTriangle, Info, Weight, 
  Banknote, Calendar, Truck, User
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function DriverLoads() {
  const { userProfile } = userProfile();
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
    const channel = supabase.channel('loads-sync').on('postgres_changes', { event: '*', table: 'loads' }, () => fetchLoads()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleWhatsApp = (load: any) => {
    const phone = load.owner?.phone;
    if (!phone) return;
    const cleanPhone = phone.startsWith('05') ? '966' + phone.slice(1) : phone;
    const msg = `السلام عليكم، أنا ناقل من تطبيق SAS ومهتم بنقل شحنتك:\n📍 من: ${load.origin}\n🏁 إلى: ${load.destination}\n📦 النوع: ${load.package_type}\n⚖️ الوزن: ${load.weight} طن.\nهل لا تزال متاحة؟`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    setTimeout(() => { setSelectedLoad(null); setShowSurvey(true); }, 2000);
  };

  const handleAgree = async () => {
    if (!selectedLoad) return;
    try {
      await api.acceptLoad(selectedLoad.id, userProfile.id);
      toast.success("تم الاتفاق! الشحنة الآن في قائمة مهامي ✅");
      setShowSurvey(false); setSelectedLoad(null); fetchLoads();
    } catch (err) { toast.error("خطأ في التحديث"); }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl font-black text-slate-900 text-right">الشحنات المتاحة</h1>
        
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div> : (
          <div className="grid gap-6">
            {loads.map((load) => (
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
            ))}
          </div>
        )}

        <Dialog open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none bg-white shadow-2xl">
            <div className="p-6 bg-[#0f172a] text-white flex justify-between items-center">
               <h2 className="text-xl font-black">تفاصيل الحمولة الكاملة</h2>
               <Button variant="ghost" size="icon" onClick={() => setSelectedLoad(null)} className="text-white hover:bg-white/10 rounded-full"><X /></Button>
            </div>
            {selectedLoad && (
              <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-3xl bg-slate-50 border flex flex-col items-center gap-1"><Weight className="text-slate-400" size={20}/><p className="text-[9px] font-black text-slate-400 uppercase">الوزن</p><p className="font-black">{selectedLoad.weight} طن</p></div>
                  <div className="p-4 rounded-3xl bg-slate-50 border flex flex-col items-center gap-1"><Truck className="text-slate-400" size={20}/><p className="text-[9px] font-black text-slate-400 uppercase">الشاحنة</p><p className="font-black text-sm">{selectedLoad.body_type || 'مسطحة'}</p></div>
                  <div className="p-4 rounded-3xl bg-slate-50 border flex flex-col items-center gap-1"><Package className="text-slate-400" size={20}/><p className="text-[9px] font-black text-slate-400 uppercase">النوع</p><p className="font-black text-sm">{selectedLoad.package_type}</p></div>
                  <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-100 flex flex-col items-center gap-1"><Banknote className="text-emerald-600" size={20}/><p className="text-[9px] font-black text-emerald-400 uppercase">الأجرة</p><p className="font-black text-emerald-700">{selectedLoad.price} ريال</p></div>
                  <div className="p-4 rounded-3xl bg-purple-50 border border-purple-100 flex flex-col items-center gap-1 col-span-2 md:col-span-1"><Calendar className="text-purple-600" size={20}/><p className="text-[9px] font-black text-purple-400 uppercase">التاريخ</p><p className="font-black text-sm">{new Date(selectedLoad.pickup_date).toLocaleDateString('ar-SA')}</p></div>
                </div>
                <div className="space-y-4">
                  <p className="font-black text-slate-800 flex items-center gap-2 text-sm"><User size={18} className="text-emerald-500"/> تفاصيل المستلم</p>
                  <div className="p-6 rounded-[2rem] bg-emerald-50/30 border-2 border-emerald-100/50 space-y-3">
                    <div className="flex justify-between"><span className="text-xs font-bold text-slate-500">الاسم:</span><span className="font-black text-slate-800">{selectedLoad.receiver_name}</span></div>
                    <div className="flex justify-between"><span className="text-xs font-bold text-slate-500">الجوال:</span><span className="font-black text-slate-800" dir="ltr">{selectedLoad.receiver_phone}</span></div>
                    <div className="pt-2 border-t border-emerald-100/50"><span className="text-xs font-bold text-slate-500 block mb-1">العنوان:</span><p className="font-black text-sm text-slate-700">{selectedLoad.receiver_address || 'سيتم التزويد بالموقع عند الاتفاق'}</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <Button onClick={() => { window.location.href=`tel:${selectedLoad.owner?.phone}`; setTimeout(()=>setShowSurvey(true), 2000); }} className="h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg gap-3 shadow-xl shadow-orange-100"><Phone size={24} /> اتصال</Button>
                   <Button onClick={() => handleWhatsApp(selectedLoad)} className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg gap-3 shadow-xl shadow-emerald-100"><MessageCircle size={24} /> واتساب</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showSurvey} onOpenChange={setShowSurvey}>
          <DialogContent className="max-w-md rounded-[3rem] p-8 text-center bg-white shadow-2xl">
             <h3 className="text-xl font-black mb-6">هل تم الاتفاق مع التاجر في SAS؟</h3>
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
