import { useState } from 'react';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { toast } from 'sonner';
import { Loader2, ChevronsUpDown, Package, Info, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    origin: '', 
    destination: '', 
    weight: '', 
    price: '',
    description: '', 
    package_type: '', // نوع البضاعة
    pickup_date: today, 
    body_type: '',    // نوع الشاحنة
    receiver_name: '', 
    receiver_phone: '', 
    receiver_address: '',
  });

  // دالة التأكد من ملء البيانات (لتشغيل الزر)
  const isFormValid = () => {
    return (
      form.origin !== '' && 
      form.destination !== '' && 
      form.weight !== '' && 
      form.price !== '' && 
      form.package_type !== '' && 
      form.body_type !== '' && 
      form.receiver_name !== '' && 
      form.receiver_phone.length >= 9
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalData = {
        ...form,
        receiver_phone: '+966' + form.receiver_phone
      };
      await api.postLoad(finalData, userProfile?.id || "");
      toast.success("تم نشر الشحنة بنجاح ✅");
      navigate('/shipper/dashboard'); 
    } catch (err) { 
      toast.error("حدث خطأ أثناء النشر"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-10 pt-4 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
            
            {/* الهيدر الكحلي */}
            <CardHeader className="bg-[#0f172a] text-white p-8 pb-16 text-center">
              <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-lg">
                <Package size={32} className="text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">التفاصيل الشحنة</CardTitle>
              <CardDescription className="text-slate-400 font-bold text-xs mt-2">يرجى ملاحظة أن جميع الحقول التي تحتوي على (*) هي حقول إجبارية</CardDescription>
            </CardHeader>

            <CardContent className="p-6 md:p-10 -mt-10 bg-white rounded-[3rem] relative z-10">
              <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* 1. مسار الرحلة */}
                <section className="space-y-6">
                  <h3 className="text-md font-black flex items-center gap-3 text-slate-800 border-r-4 border-blue-600 pr-3">
                    مسار الرحلة *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-[10px] text-slate-400 mr-1">موقع التحميل (من) *</Label>
                      <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-xl border-slate-200 font-bold justify-between bg-slate-50/50">
                            {form.origin || "اختر المدينة"}
                            <ChevronsUpDown size={14} className="opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-xl shadow-2xl border-none">
                          <Command>
                            <div className="flex items-center border-b px-3"><Search className="mr-2 h-4 w-4 opacity-50" /><input placeholder="بحث..." className="h-11 w-full bg-transparent outline-none font-bold text-sm" /></div>
                            <CommandList>
                              <CommandEmpty>لا توجد نتائج</CommandEmpty>
                              {SAUDI_CITIES.map(c => (
                                <CommandItem key={c.value} onSelect={() => { setForm(p=>({...p, origin: c.label})); setOpenOrigin(false); }} className="font-bold cursor-pointer h-10">{c.label}</CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-[10px] text-slate-400 mr-1">موقع التسليم (إلى) *</Label>
                      <Popover open={openDest} onOpenChange={setOpenDest}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-xl border-slate-200 font-bold justify-between bg-slate-50/50">
                            {form.destination || "اختر المدينة"}
                            <ChevronsUpDown size={14} className="opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-xl shadow-2xl border-none">
                          <Command>
                            <CommandList>
                               {SAUDI_CITIES.map(c => (
                                 <CommandItem key={c.value} onSelect={() => { setForm(p=>({...p, destination: c.label})); setOpenDest(false); }} className="font-bold cursor-pointer h-10">{c.label}</CommandItem>
                               ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </section>

                {/* 2. مواصفات الشحنة */}
                <section className="space-y-6">
                  <h3 className="text-md font-black flex items-center gap-3 text-slate-800 border-r-4 border-emerald-500 pr-3">
                    مواصفات الشحنة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-[10px] text-slate-400">الوزن (طن) *</Label>
                      <Input type="number" value={form.weight} onChange={e=>setForm(p=>({...p, weight: e.target.value}))} className="h-14 rounded-xl border-slate-200 font-bold bg-slate-50/50" placeholder="25" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-[10px] text-slate-400">السعر (ر.س) *</Label>
                      <Input type="number" value={form.price} onChange={e=>setForm(p=>({...p, price: e.target.value}))} className="h-14 rounded-xl border-slate-200 font-bold bg-slate-50/50" placeholder="2500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-[10px] text-slate-400">نوع البضاعة (العبوة) *</Label>
                      <Input value={form.package_type} onChange={e=>setForm(p=>({...p, package_type: e.target.value}))} className="h-14 rounded-xl border-slate-200 font-bold bg-slate-50/50" placeholder="كراتين" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-[10px] text-slate-400">نوع الشاحنة المطلوب *</Label>
                      <Select value={form.body_type} onValueChange={(v) => setForm(p=>({...p, body_type: v}))}>
                        <SelectTrigger className="h-14 rounded-xl border-slate-200 font-bold bg-slate-50/50">
                          <SelectValue placeholder="اختر نوع الشاحنة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="box" className="font-bold">صندوق مغلق (Box)</SelectItem>
                          <SelectItem value="flatbed" className="font-bold">سطحة (Flatbed)</SelectItem>
                          <SelectItem value="refrigerated" className="font-bold">براد (Refrigerated)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-bold text-[10px] text-slate-400">تاريخ التحميل *</Label>
                      <Input type="date" value={form.pickup_date} min={today} onChange={e=>setForm(p=>({...p, pickup_date: e.target.value}))} className="h-14 rounded-xl border-slate-200 font-bold bg-slate-50/50" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-bold text-[10px] text-slate-400">الوصف (اختياري)</Label>
                      <Textarea value={form.description} onChange={e=>setForm(p=>({...p, description: e.target.value}))} className="min-h-[80px] rounded-xl border-slate-200 font-bold p-4 bg-slate-50/50" placeholder="..." />
                    </div>
                  </div>
                </section>

                {/* 3. تفاصيل المستلم (شكل 834) */}
                <section className="space-y-6">
                  <h3 className="text-md font-black flex items-center gap-3 text-slate-800 border-r-4 border-amber-500 pr-3">
                    تفاصيل المستلم
                  </h3>
                  <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/30 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-[10px] text-slate-400">اسم المستلم *</Label>
                        <Input value={form.receiver_name} onChange={e=>setForm(p=>({...p, receiver_name: e.target.value}))} className="h-14 rounded-xl border-slate-200 font-bold bg-white" placeholder="Mohamed" />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-[10px] text-slate-400">جوال المستلم *</Label>
                        <div className="relative">
                           <div className="absolute left-0 top-0 h-full flex items-center px-4 border-r border-slate-100 font-black text-slate-400 bg-slate-50 rounded-l-xl z-10 text-sm">
                             +966
                           </div>
                           <Input 
                            value={form.receiver_phone} 
                            onChange={(e) => setForm(p => ({ ...p, receiver_phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                            className="h-14 rounded-xl border-2 border-blue-100 focus:border-blue-500 bg-white font-black text-md pl-20 text-right" 
                            placeholder="05xxxxxxx" 
                            dir="ltr"
                           />
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">يجب أن يتكون من 10 أرقام ويبدأ بـ 05</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-[10px] text-slate-400">عنوان المستلم (اختياري)</Label>
                        <Input value={form.receiver_address} onChange={e=>setForm(p=>({...p, receiver_address: e.target.value}))} className="h-14 rounded-xl border-slate-200 font-bold bg-white" placeholder="Bbvv" />
                    </div>
                  </div>
                </section>

                {/* زر النشر المنور */}
                <div className="pt-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 mb-6 items-start">
                      <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                        بضغطك على زر "نشر الشحنة"، فإنك توافق على شروط وأحكام منصة SAS Transport، وسيتم إبلاغ جميع الناقلين.
                      </p>
                   </div>
                   
                   <Button 
                    type="submit" 
                    disabled={loading || !isFormValid()} 
                    className={`w-full h-16 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 ${
                      !isFormValid() 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                    }`}
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
