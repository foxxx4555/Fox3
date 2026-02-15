import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Package, Phone, MessageCircle, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('available-loads')
      .on('postgres_changes', { event: '*', table: 'loads' }, () => fetchLoads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // دالة فتح الواتساب برسالة تلقائية
  const handleWhatsApp = (load: any) => {
    const phone = load.owner?.phone;
    if (!phone) return toast.error("رقم صاحب الشحنة غير متاح");
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);

    const message = `السلام عليكم، أنا ناقل من تطبيق SAS ومهتم بنقل شحنتك المروضة من (${load.origin}) إلى (${load.destination}).
تفاصيل الشحنة:
- النوع: ${load.package_type || 'بضائع عامة'}
- الوزن: ${load.weight} طن
- السعر المعروض: ${load.price} ريال
هل الشحنة لا تزال متاحة؟`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    
    // إظهار شاشة التقرير بعد ثواني من الانتقال للواتساب
    setTimeout(() => {
      setSelectedLoad(null);
      setShowSurvey(true);
    }, 2000);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
    setTimeout(() => {
      setSelectedLoad(null);
      setShowSurvey(true);
    }, 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl font-black text-slate-900 text-right">الشحنات المتاحة</h1>
        
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
              <Card key={load.id} className="rounded-[2rem] border-none shadow-md bg-white overflow-hidden hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full text-right space-y-4">
                       <div className="flex items-center gap-4 justify-end">
                          <div><p className="text-[10px] font-black text-slate-400 uppercase">من</p><p className="font-black text-lg">{load.origin}</p></div>
                          <div className="flex-1 h-px bg-slate-100 relative min-w-[40px]"><MapPin size={14} className="absolute inset-0 m-auto text-blue-600"/></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase text-left">إلى</p><p className="font-black text-lg text-left">{load.destination}</p></div>
                       </div>
                       <div className="flex gap-2 justify-end">
                         <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold">{load.weight} طن</Badge>
                         <Badge variant="outline" className="font-bold border-slate-100">{load.package_type || 'بضائع'}</Badge>
                       </div>
                    </div>
                    <div className="md:w-48 text-center md:border-r md:pr-6">
                       <p className="text-2xl font-black text-blue-600 mb-3">{load.price} <span className="text-xs">ر.س</span></p>
                       <Button onClick={() => setSelectedLoad(load)} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-blue-600 font-black">عرض التفاصيل</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* --- 1. شاشة تفاصيل الحمولة (زي سكرين wa0044) --- */}
        <Dialog open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <DialogContent className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none bg-white">
            <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex justify-between items-center">
               <h2 className="text-xl font-black">تفاصيل الحمولة</h2>
               <Button variant="ghost" size="icon" onClick={() => setSelectedLoad(null)} className="text-white hover:bg-white/20"><X /></Button>
            </div>
            {selectedLoad && (
              <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-6">
                   <div className="text-center flex-1">
                      <p className="text-2xl font-black">{selectedLoad.origin}</p>
                      <p className="text-xs text-slate-400 font-bold">المصدر</p>
                   </div>
                   <div className="flex flex-col items-center px-4">
                      <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-1">{selectedLoad.distance || '---'} Km</span>
                      <div className="w-20 h-px bg-slate-200 border-dashed border-t-2" />
                   </div>
                   <div className="text-center flex-1">
                      <p className="text-2xl font-black">{selectedLoad.destination}</p>
                      <p className="text-xs text-slate-400 font-bold">الوجهة</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <Info className="text-blue-500 shrink-0 mt-1" />
                      <div>
                        <p className="font-black text-slate-900 mb-1">وصف الحمولة:</p>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                          {selectedLoad.description || "طلب نقل بضائع متنوعة حسب النوع والوزن الموضح."}
                          <br/>الحمولة: {selectedLoad.package_type}. الوزن: {selectedLoad.weight} طن. الأجرة: {selectedLoad.price} ريال شاملة كل شيء.
                        </p>
                      </div>
                   </div>

                   <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                      <p className="text-xs font-black text-emerald-600 uppercase mb-1">سيتم توصيلك مباشرة بصاحب الطلب</p>
                      <p className="text-[10px] text-slate-500 font-bold leading-tight">SAS لا تشارك في تحديد التكاليف ولا تفرض عمولة على هذه العملية.</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <Button onClick={() => handleCall(selectedLoad.owner?.phone)} className="h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-lg font-black gap-2 shadow-xl shadow-orange-100">
                      <Phone /> اتصال
                   </Button>
                   <Button onClick={() => handleWhatsApp(selectedLoad)} className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-black gap-2 shadow-xl shadow-emerald-100">
                      <MessageCircle /> أرسل رسالة
                   </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* --- 2. شاشة التقرير (SAS) بعد الاتصال (زي سكرين wa0036) --- */}
        <Dialog open={showSurvey} onOpenChange={setShowSurvey}>
          <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none bg-white">
             <div className="p-6 bg-orange-500 text-white text-center">
                <p className="font-black">تقرير الاتصال مع صاحب البضائع</p>
             </div>
             <div className="p-8 space-y-6">
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center gap-3">
                   <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                   <p className="text-xs font-bold text-rose-800">SAS غير مسؤول عن دفع العمولة لهذا المرسل!</p>
                </div>

                <h3 className="text-xl font-black text-center text-slate-800 py-2">هل اتفقت مع صاحب الحمولة؟</h3>
                
                <div className="space-y-3">
                   <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-emerald-500 text-emerald-600 font-black justify-between px-6 hover:bg-emerald-50" onClick={() => setShowSurvey(false)}>
                      نعم، اتفقت <CheckCircle2 className="opacity-50" />
                   </Button>
                   <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-rose-100 text-rose-500 font-bold justify-between px-6 hover:bg-rose-50" onClick={() => setShowSurvey(false)}>
                      لا، لقد كانت الحمولة قد مرت <span className="opacity-30 italic font-normal">🚫</span>
                   </Button>
                   <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-rose-100 text-rose-500 font-bold justify-between px-6 hover:bg-rose-50" onClick={() => setShowSurvey(false)}>
                      لا، لم يجب صاحب الحمولة <span className="opacity-30 italic font-normal">!</span>
                   </Button>
                   <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-rose-100 text-rose-500 font-bold justify-between px-6 hover:bg-rose-50" onClick={() => setShowSurvey(false)}>
                      لا، لأسباب أخرى <span className="opacity-30 italic font-normal">...</span>
                   </Button>
                </div>
             </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
