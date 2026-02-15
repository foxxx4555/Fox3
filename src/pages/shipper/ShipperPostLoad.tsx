
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from 'sonner';
import { Loader2, Check, ChevronsUpDown, MapPin, Info, Package, User, Phone, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const SAUDI_CITIES = [
  { value: "riyadh", label: "الرياض" }, { value: "jeddah", label: "جدة" },
  { value: "mecca", label: "مكة المكرمة" }, { value: "medina", label: "المدينة المنورة" },
  { value: "dammam", label: "الدمام" }, { value: "khobar", label: "الخبر" },
  { value: "tabuk", label: "تبوك" }, { value: "abha", label: "أبها" },
  { value: "buraidah", label: "بريدة" }, { value: "hail", label: "حائل" },
];

export default function ShipperPostLoad() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [openOrigin, setOpenOrigin] = useState(false);
  const [openDest, setOpenDest] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    origin: '', destination: '', weight: '', price: '',
    description: '', type: 'general', package_type: '',
    pickup_date: today, truck_size: '', body_type: 'flatbed',
    receiver_name: '', receiver_phone: '', receiver_address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    // التأكد من أن رقم الجوال 9 أرقام ويبدأ بـ 5
    if (form.receiver_phone.length !== 9 || !form.receiver_phone.startsWith('5')) {
      toast.error('رقم جوال المستلم يجب أن يتكون من 9 أرقام ويبدأ بـ 5');
      return;
    }

    setLoading(true);
    try {
      // نرسل الرقم مع رمز الدولة لقاعدة البيانات
      const finalData = {
        ...form,
        receiver_phone: '+966' + form.receiver_phone
      };
      
      await api.postLoad(finalData, userProfile.id);
      toast.success("تم نشر الشحنة بنجاح ✅");
      
      // التوجيه للداشبورد لإنهاء مشكلة التكرار
      navigate('/shipper/dashboard', { replace: true });
      
    } catch (err: any) {
      toast.error('حدث خطأ أثناء النشر');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return form.origin && form.destination && form.weight && form.price && form.receiver_phone.length === 9;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-20 pt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
            <CardHeader className="bg-[#0f172a] text-white p-8 pb-14 text-center">
              <Package size={32} className="mx-auto text-blue-400 mb-4" />
              <CardTitle className="text-2xl font-black">تفاصيل الشحنة</CardTitle>
              <CardDescription className="text-slate-400 font-medium">يرجى تعبئة بيانات الحمولة بدقة ليراها السائقون</CardDescription>
            </CardHeader>

            <CardContent className="p-8 -mt-10 bg-white rounded-[3rem] relative z-10">
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* مسار الرحلة */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" /> مسار الرحلة *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2rem] bg-slate-50/50 border-2 border-slate-50">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 ms-1">موقع التحميل (من) *</Label>
                      <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl justify-between border-2 font-bold bg-white">
                            {form.origin || "اختر المدينة"}
                            <ChevronsUpDown size={16} className="opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command>
                            <CommandInput placeholder="ابحث..." className="font-bold" />
                            <CommandList>
                              <CommandGroup>
                                {SAUDI_CITIES.map(c => (
                                  <CommandItem key={c.value} onSelect={() => { setForm(p=>({...p, origin: c.label})); setOpenOrigin(false); }} className="font-bold h-10 cursor-pointer">
                                    {c.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 ms-1">موقع التسليم (إلى) *</Label>
                      <Popover open={openDest} onOpenChange={setOpenDest}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl justify-between border-2 font-bold bg-white">
                            {form.destination || "اختر المدينة"}
                            <ChevronsUpDown size={16} className="opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command>
                            <CommandInput placeholder="ابحث..." className="font-bold" />
                            <CommandList>
                              {SAUDI_CITIES.map(c => (
                                <CommandItem key={c.value} onSelect={() => { setForm(p=>({...p, destination: c.label})); setOpenDest(false); }} className="font-bold h-10 cursor-pointer">
                                  {c.label}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </section>

                {/* مواصفات الحمولة */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" /> مواصفات الشحنة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">الوزن (طن) *</Label>
                      <Input type="number" value={form.weight} onChange={e=>setForm(p=>({...p, weight: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold" placeholder="مثلاً: 25" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">السعر المعروض (ر.س) *</Label>
                      <Input type="number" value={form.price} onChange={e=>setForm(p=>({...p, price: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold" placeholder="مثلاً: 2500" />
                    </div>
                  </div>
                </section>

                {/* تفاصيل المستلم */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" /> تفاصيل المستلم
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2rem] bg-slate-50/50 border-2 border-slate-50">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 ms-1">اسم المستلم *</Label>
                      <Input value={form.receiver_name} onChange={e=>setForm(p=>({...p, receiver_name: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold bg-white" placeholder="اسم الشخص أو المؤسسة" />
                    </div>

                    {/* 🔽 خانة الجوال المطلوبة 🔽 */}
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 ms-1">جوال المستلم *</Label>
                      <div className="relative group">
                        <div className="absolute start-0 top-0 h-full flex items-center px-4 border-e-2 border-slate-100 font-black text-slate-400 bg-slate-50 rounded-s-2xl z-10">
                          +966
                        </div>
                        <Input 
                          value={form.receiver_phone} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                            setForm(p => ({ ...p, receiver_phone: val }));
                          }} 
                          className="h-14 rounded-2xl border-2 border-slate-100 bg-white font-black text-lg ps-24 focus:border-blue-500 transition-all shadow-sm" 
                          placeholder="5xxxxxxxx" 
                          dir="ltr" 
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 ms-1 font-bold">أدخل 9 أرقام (يبدأ بـ 5)</p>
                    </div>
                  </div>
                </section>

                <div className="pt-6">
                  <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-4 mb-8">
                    <Info className="text-blue-600 shrink-0" size={20} />
                    <p className="text-xs font-bold text-blue-800 leading-relaxed">
                      بضغطك على "نشر شحنة"، سيتم إرسال تنبيه فوري لجميع السائقين المتاحين في النظام.
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || !isFormValid()} 
                    className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl shadow-xl shadow-blue-100 transition-all active:scale-95"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "نشر شحنة"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
