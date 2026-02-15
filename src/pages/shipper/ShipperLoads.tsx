import { useState, useEffect } from 'react';
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
import { Loader2, Check, ChevronsUpDown, MapPin, Package, User, Phone, Calendar, Info } from 'lucide-react';
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
    if (!form.origin || !form.destination || !form.weight || !form.price) {
      toast.error('يرجى إكمال البيانات الأساسية');
      return;
    }

    setLoading(true);
    try {
      await api.postLoad(form, userProfile?.id || "");
      toast.success("تم نشر الشحنة بنجاح ✅");
      
      // ✅ التعديل المهم هنا: التوجيه للداشبورد بدل الصفحة القديمة لمنع 404
      navigate('/shipper/dashboard'); 
      
    } catch (err) { 
      toast.error("حدث خطأ أثناء النشر"); 
    } finally { 
      setLoading(false); 
    }
  };

  const set = (key: string) => (val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-10 pt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
            <CardHeader className="bg-[#0f172a] text-white p-10 pb-16 text-center">
              <Package size={40} className="mx-auto text-blue-400 mb-4" />
              <CardTitle className="text-3xl font-black italic">التفاصيل الشحنة</CardTitle>
              <CardDescription className="text-slate-400 font-bold">يرجى ملاحظة أن جميع الحقول التي تحتوي على (*) هي حقول إجبارية</CardDescription>
            </CardHeader>

            <CardContent className="p-8 -mt-10 bg-white rounded-[3rem] relative z-10">
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* مسار الرحلة */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-2 text-slate-800">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" /> مسار الرحلة *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-50 border-2 border-slate-100">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs text-slate-500 mr-1">موقع التحميل (من) *</Label>
                      <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-bold justify-between bg-white">
                            {form.origin || "اختر المدينة"}
                            <ChevronsUpDown size={16} className="opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command>
                            <CommandInput placeholder="ابحث..." className="font-bold" />
                            <CommandList>
                              <CommandEmpty>لا توجد نتائج</CommandEmpty>
                              <CommandGroup>
                                {SAUDI_CITIES.map(c => (
                                  <CommandItem key={c.value} onSelect={() => { set('origin')(c.label); setOpenOrigin(false); }} className="font-bold cursor-pointer h-10">
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
                      <Label className="font-bold text-xs text-slate-500 mr-1">موقع التسليم (إلى) *</Label>
                      <Popover open={openDest} onOpenChange={setOpenDest}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-bold justify-between bg-white">
                            {form.destination || "اختر المدينة"}
                            <ChevronsUpDown size={16} className="opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command>
                            <CommandInput placeholder="ابحث..." className="font-bold" />
                            <CommandList>
                               {SAUDI_CITIES.map(c => (
                                 <CommandItem key={c.value} onSelect={() => { set('destination')(c.label); setOpenDest(false); }} className="font-bold cursor-pointer h-10">
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

                {/* المواصفات */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-2 text-slate-800">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" /> مواصفات الشحنة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="font-bold text-xs text-slate-500">الوزن (طن) *</Label><Input type="number" value={form.weight} onChange={e=>set('weight')(e.target.value)} className="h-14 rounded-2xl border-2 font-bold" /></div>
                    <div className="space-y-2"><Label className="font-bold text-xs text-slate-500">السعر المعروض (ر.س) *</Label><Input type="number" value={form.price} onChange={e=>set('price')(e.target.value)} className="h-14 rounded-2xl border-2 font-bold" /></div>
                    <div className="space-y-2"><Label className="font-bold text-xs text-slate-500">نوع البضاعة *</Label><Input value={form.package_type} onChange={e=>set('package_type')(e.target.value)} className="h-14 rounded-2xl border-2 font-bold" placeholder="مثلاً: كراتين" /></div>
                    <div className="space-y-2"><Label className="font-bold text-xs text-slate-500">تاريخ التحميل *</Label><Input type="date" value={form.pickup_date} min={today} onChange={e=>set('pickup_date')(e.target.value)} className="h-14 rounded-2xl border-2 font-bold" /></div>
                  </div>
                  <div className="space-y-2"><Label className="font-bold text-xs text-slate-500">الوصف (اختياري)</Label><Textarea value={form.description} onChange={e=>set('description')(e.target.value)} className="min-h-[100px] rounded-2xl border-2 font-bold p-4" /></div>
                </section>

                <div className="pt-6">
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 mb-6">
                      <Info className="text-blue-600 shrink-0" size={20} />
                      <p className="text-xs font-bold text-blue-800 leading-relaxed">بضغطك على "نشر شحنة" سيتم إبلاغ جميع الناقلين المتاحين فوراً بمواصفات طلبك.</p>
                   </div>
                   <Button type="submit" disabled={loading} className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl shadow-xl shadow-blue-100 transition-all active:scale-95">
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
