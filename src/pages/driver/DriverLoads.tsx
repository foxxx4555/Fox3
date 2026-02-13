import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { MapPin, Weight, DollarSign, Loader2, Search, Phone, MessageCircle, X, ArrowRight, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Load } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export default function DriverLoads() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // التحكم في الشاشات (list -> details -> feedback)
  const [activeView, setActiveView] = useState<'list' | 'details' | 'feedback'>('list');
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

  const fetchLoads = useCallback(async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads(data as any as Load[]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('loads-sync')
      .on('postgres_changes', { event: '*', table: 'loads', schema: 'public' }, () => fetchLoads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLoads]);

  // الاتصال
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
    setActiveView('feedback');
  };

  // الواتساب
  const handleWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
    setActiveView('feedback');
  };

  // تأكيد الاتفاق
  const handleConfirmAgreement = async (agreed: boolean) => {
    if (!selectedLoad || !userProfile?.id) return;
    
    if (agreed) {
      try {
        await api.acceptLoad(selectedLoad.id, userProfile.id);
        toast.success("تمت إضافة الشحنة إلى قائمة مهامك بنجاح ✅");
        setActiveView('list');
        setSelectedLoad(null);
      } catch (err: any) { toast.error(err.message); }
    } else {
      // إذا لم يتفق، يرجع للقائمة فقط وتظل الشحنة متاحة للكل
      setActiveView('list');
      setSelectedLoad(null);
    }
  };

  const filtered = loads.filter(l =>
    l.origin.toLowerCase().includes(search.toLowerCase()) ||
    l.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* 1. قائمة الشحنات المتاحة */}
        {activeView === 'list' && (
          <>
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input placeholder="البحث عن مدينة أو شحنة..." value={search} onChange={e => setSearch(e.target.value)} className="ps-12 h-14 rounded-2xl border-2 font-bold" />
            </div>

            {loading ? (
              <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary" size={40} /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed">
                <p className="font-bold text-muted-foreground">لا توجد شحنات متاحة الآن</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.map(load => (
                  <Card key={load.id} className="rounded-3xl border-none shadow-md overflow-hidden hover:shadow-xl transition-all group">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/20">{t('available')}</Badge>
                        <span className="text-[11px] font-bold text-muted-foreground">{new Date(load.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-4 font-black text-lg">
                         <span className="text-primary">{load.origin}</span>
                         <ArrowRight size={18} className="text-muted-foreground" />
                         <span className="text-accent">{load.destination}</span>
                      </div>
                      <div className="flex gap-4 text-sm font-bold text-muted-foreground mb-6">
                        <div className="flex items-center gap-1"><Weight size={16} /> {load.weight} طن</div>
                        <div className="flex items-center gap-1"><DollarSign size={16} /> {load.price} ريال</div>
                      </div>
                      <Button 
                        onClick={() => { setSelectedLoad(load); setActiveView('details'); }}
                        className="w-full h-12 rounded-2xl bg-primary text-white font-black text-md shadow-lg shadow-primary/20"
                      >
                        عرض التفاصيل
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* 2. شاشة تفاصيل الحمولة (Modal/View) */}
        {activeView === 'details' && selectedLoad && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="font-black text-xl">تفاصيل الحمولة</h2>
                <Button variant="ghost" size="icon" onClick={() => setActiveView('list')}><X /></Button>
              </div>
              
              <div className="p-8 space-y-8">
                {/* رسم توضيحي للمسار */}
                <div className="flex items-center justify-between px-10 relative">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 border-b-2 border-dashed border-muted-foreground/30 -z-0" />
                   <div className="z-10 bg-white p-2 border-2 border-primary rounded-full"><MapPin className="text-primary" /></div>
                   <div className="z-10 bg-white p-2 border-2 border-accent rounded-full"><MapPin className="text-accent" /></div>
                </div>
                <div className="flex justify-between px-2 text-center">
                   <div><p className="font-black text-lg">{selectedLoad.origin}</p><p className="text-xs text-muted-foreground font-bold">موقع التحميل</p></div>
                   <div className="bg-muted px-4 py-1 rounded-full text-xs font-black">{selectedLoad.distance || '---'} كم</div>
                   <div><p className="font-black text-lg">{selectedLoad.destination}</p><p className="text-xs text-muted-foreground font-bold">موقع التسليم</p></div>
                </div>

                <div className="bg-muted/30 p-6 rounded-3xl space-y-4">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-primary shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-black uppercase text-muted-foreground">الوصف:</p>
                      <p className="font-bold leading-relaxed">{selectedLoad.description || "طلب شحن حمولة عامة حسب المواصفات المذكورة."}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex gap-3 text-sm">
                   <AlertTriangle className="shrink-0" />
                   <p className="font-bold">يرجى العلم بأنك ستتواصل مع صاحب الشحنة مباشرة للاتفاق على التفاصيل.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button 
                    onClick={() => handleCall(selectedLoad.owner?.phone || "")}
                    className="h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-xl shadow-orange-500/20 gap-3"
                  >
                    <Phone size={24} /> اتصال
                  </Button>
                  <Button 
                    onClick={() => handleWhatsApp(selectedLoad.owner?.phone || "")}
                    className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-500/20 gap-3"
                  >
                    <MessageCircle size={24} /> مراسلة
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* 3. شاشة التقرير (بعد الاتصال - صورة 20260207) */}
        {activeView === 'feedback' && selectedLoad && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
             <div className="bg-orange-500 p-8 rounded-[2rem] text-white text-center relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <h2 className="text-lg font-bold">تقرير الاتصال مع صاحب البضاعة</h2>
                  <div className="flex items-center gap-4 text-2xl font-black">
                     <span>{selectedLoad.origin}</span>
                     <span>←</span>
                     <span>{selectedLoad.destination}</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -z-0" />
             </div>

             <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600">
                <XCircle size={20} />
                <p className="text-sm font-black italic">نقليات غير مسؤولة عن دفع العمولة لهذا المرسل!</p>
             </div>

             <div className="text-center space-y-6 pt-4">
                <h3 className="text-2xl font-black text-slate-800">هل اتفقت مع صاحب الحمولة؟</h3>
                
                <div className="space-y-3 px-4">
                   <Button 
                    onClick={() => handleConfirmAgreement(true)}
                    variant="outline" 
                    className="w-full h-16 rounded-2xl border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white font-black text-xl justify-between px-8 group transition-all"
                   >
                     نعم، اتفقت <CheckCircle2 className="group-hover:scale-125 transition-transform" />
                   </Button>

                   <Button 
                    onClick={() => handleConfirmAgreement(false)}
                    variant="outline" 
                    className="w-full h-16 rounded-2xl border-2 border-slate-200 text-slate-400 font-bold justify-start px-8"
                   >
                     لا، لقد كانت الحمولة قد مرت
                   </Button>

                   <Button 
                    onClick={() => handleConfirmAgreement(false)}
                    variant="outline" 
                    className="w-full h-16 rounded-2xl border-2 border-slate-200 text-slate-400 font-bold justify-start px-8"
                   >
                     لا، لم يجب صاحب الحمولة
                   </Button>

                   <Button 
                    onClick={() => handleConfirmAgreement(false)}
                    variant="outline" 
                    className="w-full h-16 rounded-2xl border-2 border-slate-200 text-slate-400 font-bold justify-start px-8"
                   >
                     لا، لأسباب أخرى
                   </Button>
                </div>
                
                <Button variant="ghost" onClick={() => setActiveView('list')} className="text-muted-foreground font-bold mt-4 underline underline-offset-4">تجاهل الآن والعودة</Button>
             </div>
          </motion.div>
        )}

      </div>
    </AppLayout>
  );
}
