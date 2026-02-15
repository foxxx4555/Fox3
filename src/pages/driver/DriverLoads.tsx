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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export default function DriverLoads() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // حالة التحميل عند التحديث
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null); // لحفظ ID الشحنة التي يتم التفاوض عليها

  const fetchLoads = async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('available-loads')
      .on('postgres_changes', { event: '*', table: 'loads' }, () => fetchLoads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // دالة تأكيد الاتفاق وتحويل الشحنة لـ "قيد التنفيذ" للسائق الحالي
  const handleConfirmAgreement = async () => {
    if (!pendingLoadId || !userProfile?.id) return;

    setIsProcessing(true);
    try {
      // استدعاء الـ API لتحديث الحالة وتعيين السائق
      await api.acceptLoad(pendingLoadId, userProfile.id);
      
      toast.success("تم بنجاح! انتقلت الشحنة إلى قائمة مهامك الحالية 🚛");
      setShowSurvey(false);
      setPendingLoadId(null);
      fetchLoads(); // لتختفي الشحنة من قائمة "المتاحة"
    } catch (error) {
      console.error(error);
      toast.error("فشل تحديث حالة الشحنة، يرجى المحاولة لاحقاً");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsApp = (load: any) => {
    const phone = load.receiver_phone || load.owner?.phone;
    if (!phone) return toast.error("رقم التواصل غير متاح");
    
    setPendingLoadId(load.id); // حفظ المعرف للتعامل معه في الاستبيان
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
    else if (cleanPhone.startsWith('5')) cleanPhone = '966' + cleanPhone;

    const message = `السلام عليكم، أنا ناقل مهتم بشحنتك المعروضة من ${load.origin} إلى ${load.destination}. هل لا تزال متاحة؟`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    
    setTimeout(() => { 
        setSelectedLoad(null); 
        setShowSurvey(true); 
    }, 1500);
  };

  const handleCall = (load: any) => {
    const phone = load.receiver_phone || load.owner?.phone;
    if (!phone) return toast.error("رقم الهاتف غير متاح");
    
    setPendingLoadId(load.id); // حفظ المعرف
    window.location.href = `tel:${phone}`;
    
    setTimeout(() => { 
        setSelectedLoad(null); 
        setShowSurvey(true); 
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-20">
        <div className="flex justify-between items-center">
           <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 py-1.5 rounded-full font-black animate-pulse">متصل الآن • تحديث حي</Badge>
           <h1 className="text-3xl font-black text-slate-900 text-right">الشحنات المتاحة</h1>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : (
          <div className="grid gap-6">
            {loads.map((load) => (
              <Card key={load.id} className="rounded-[2.5rem] border-none shadow-md bg-white overflow-hidden hover:shadow-xl transition-all border-r-8 border-r-blue-600">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full text-right space-y-4">
                       <div className="flex items-center gap-4 justify-end">
                          <div><p className="text-[10px] font-black text-slate-400 uppercase">من</p><p className="font-black text-lg">{load.origin}</p></div>
                          <div className="flex-1 h-px bg-slate-100 relative min-w-[40px]"><MapPin size={14} className="absolute inset-0 m-auto text-blue-600"/></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase text-left">إلى</p><p className="font-black text-lg text-left">{load.destination}</p></div>
                       </div>
                    </div>
                    <div className="md:w-48 text-center md:border-r md:pr-6">
                       <p className="text-2xl font-black text-blue-600 mb-3">{load.price} <span className="text-xs">ر.س</span></p>
                       <Button onClick={() => setSelectedLoad(load)} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-blue-600 font-black transition-all">عرض التفاصيل</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* --- نافذة تفاصيل الشحنة --- */}
        <Dialog open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none bg-white shadow-2xl">
            <div className="sr-only">
              <DialogTitle>تفاصيل الشحنة</DialogTitle>
              <DialogDescription>عرض بيانات مواقع التحميل والتفريغ والتواصل</DialogDescription>
            </div>

            <div className="p-6 bg-[#0f172a] text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Package size={22}/></div>
                  <div>
                    <h2 className="text-xl font-black leading-none">تفاصيل الشحنة</h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Load ID: {selectedLoad?.id?.slice(0,8)}</p>
                  </div>
               </div>
               <Button variant="ghost" size="icon" onClick={() => setSelectedLoad(null)} className="text-white hover:bg-white/10 rounded-full"><X /></Button>
            </div>

            {selectedLoad && (
              <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto">
                <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      <p className="text-2xl font-black text-slate-900">{selectedLoad.origin}</p>
                      <p className="text-[10px] text-blue-600 font-black uppercase">التحميل</p>
                    </div>
                    <div className="flex flex-col items-center px-6">
                      <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-blue-100 mb-2">
                        <span className="text-xs font-black text-blue-600">{selectedLoad.distance || '---'} كم</span>
                      </div>
                      <div className="w-24 h-0.5 bg-blue-200 border-dashed border-t-2" />
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-2xl font-black text-slate-900">{selectedLoad.destination}</p>
                      <p className="text-[10px] text-blue-600 font-black uppercase">التفريغ</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1">
                    <Weight className="text-slate-400" size={20} />
                    <p className="text-[9px] font-black text-slate-400 uppercase">الوزن</p>
                    <p className="font-black text-base text-slate-800">{selectedLoad.weight} طن</p>
                  </div>
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1">
                    <Truck className="text-slate-400" size={20} />
                    <p className="text-[9px] font-black text-slate-400 uppercase">الشاحنة</p>
                    <p className="font-black text-base text-slate-800">{selectedLoad.body_type || 'مسطحة'}</p>
                  </div>
                  <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center gap-1">
                    <Banknote className="text-emerald-600" size={20} />
                    <p className="text-[9px] font-black text-emerald-400 uppercase">الأجرة</p>
                    <p className="font-black text-base text-emerald-700">{selectedLoad.price} ريال</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                   <Button onClick={() => handleCall(selectedLoad)} className="h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-lg font-black gap-3 shadow-xl transition-all active:scale-95">
                      <Phone size={24} /> اتصال
                   </Button>
                   <Button onClick={() => handleWhatsApp(selectedLoad)} className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-black gap-3 shadow-xl transition-all active:scale-95">
                      <MessageCircle size={24} /> واتساب
                   </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* --- شاشة التقرير المعدلة (منطق التحديث) --- */}
        <Dialog open={showSurvey} onOpenChange={(val) => !isProcessing && setShowSurvey(val)}>
          <DialogContent className="max-w-md rounded-[3rem] p-0 overflow-hidden border-none bg-white shadow-2xl">
             <div className="sr-only">
               <DialogTitle>تأكيد نقل الشحنة</DialogTitle>
               <DialogDescription>تأكيد الاتفاق مع التاجر لنقل الحمولة إلى مهامك</DialogDescription>
             </div>

             <div className="p-6 bg-blue-600 text-white text-center">
                <p className="font-black text-lg">تقرير SAS للعمليات</p>
             </div>
             <div className="p-8 space-y-6">
                <h3 className="text-xl font-black text-center text-slate-800 leading-tight">هل تم الاتفاق مع التاجر على نقل هذه الحمولة؟</h3>
                <div className="space-y-3">
                   <Button 
                    className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black justify-between px-6 shadow-lg shadow-emerald-100" 
                    onClick={handleConfirmAgreement}
                    disabled={isProcessing}
                   >
                      {isProcessing ? "جاري التحديث..." : "نعم، تم الاتفاق بنجاح"} 
                      {!isProcessing && <CheckCircle2 />}
                   </Button>
                   <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold justify-between px-6 hover:bg-slate-50" 
                    onClick={() => { setShowSurvey(false); setPendingLoadId(null); }}
                    disabled={isProcessing}
                   >
                      لا، لم يتم الاتفاق <X />
                   </Button>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-bold">بمجرد الضغط على "نعم"، ستنتقل الشحنة إلى قائمة مهامك الحالية</p>
             </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
