import { useState } from 'react';
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
import { Loader2, ChevronsUpDown, Package, Info, Settings2 } from 'lucide-react';
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
    pickup_date: today, truck_size: '', body_type: 'box',
    receiver_name: '', receiver_phone: '', receiver_address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    if (form.receiver_phone.length !== 9 || !form.receiver_phone.startsWith('5')) {
      toast.error('رقم جوال المستلم يجب أن يتكون من 9 أرقام ويبدأ بـ 5');
      return;
    }

    setLoading(true);
    try {
      const finalData = {
        ...form,
        receiver_phone: '+966' + form.receiver_phone
      };
      await api.postLoad(finalData, userProfile.id);
      toast.success("تم نشر الشحنة بنجاح ✅");
      navigate('/shipper/dashboard', { replace: true });
    } catch (err: any) {
      toast.error('حدث خطأ أثناء النشر');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return form.origin && form.destination && form.weight && form.price && form.receiver_phone.length === 9 && form.receiver_name;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-20 pt-6 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-[#f8fafc]">
            {/* الهيدر الجديد باللون الكحلي */}
            <CardHeader className="bg-[#0f172a] text-white p-8 pb-20 text-center relative">
              <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <Package size={32} className="text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-black mb-2">التفاصيل الشحنة</CardTitle>
              <CardDescription className="text-slate-400 font-medium">يرجى ملاحظة أن جميع الحقول التي تحتوي على (*) هي حقول إجبارية</CardDescription>
            </CardHeader>

            <CardContent className="p-4 md:p-8 -mt-12 bg-white rounded-[3rem] relative z-10 mx-2 md:mx-4 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* 1. مسار الرحلة */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800 border-r-4 border-blue-500 pr-3">
                    مسار الرحلة *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 ms-1">موقع التحميل (من) *</Label>
                      <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl justify-between border-2 font-bold bg-slate-50/30">
                            {form.origin || "المدينة المنورة"}
                            <ChevronsUpDown size={16} className="opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command>
                            <CommandInput placeholder="ابحث عن مدينة..." className="font-bold" />
                            <CommandList>
                                <CommandEmpty>لم يتم العثور على نتائج</CommandEmpty>
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
                          <Button variant="outline" className="w-full h-14 rounded-2xl justify-between border-2 font-bold bg-slate-50/30">
                            {form.destination || "مكة المكرمة"}
                            <ChevronsUpDown size={16} className="opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command>
                            <CommandInput placeholder="ابحث عن مدينة..." className="font-bold" />
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

                {/* 2. مواصفات الشحنة (التعديلات الرئيسية هنا) */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800 border-r-4 border-emerald-500 pr-3">
                    مواصفات الشحنة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">الوزن (طن) *</Label>
                      <Input type="number" value={form.weight} onChange={e=>setForm(p=>({...p, weight: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold bg-slate-50/30" placeholder="25" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">السعر (ر.س) (ر.س) *</Label>
                      <Input type="number" value={form.price} onChange={e=>setForm(p=>({...p, price: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold bg-slate-50/30" placeholder="2500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">نوع البضاعة (العبوة) *</Label>
                      <Input value={form.package_type} onChange={e=>setForm(p=>({...p, package_type: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold bg-slate-50/30" placeholder="كراتين" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">نوع الشاحنة المطلوب *</Label>
                      <Select value={form.body_type} onValueChange={(v) => setForm(p => ({ ...p, body_type: v }))}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-slate-50/30">
                          <SelectValue placeholder="اختر نوع الشاحنة" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="box" className="font-bold">صندوق مغلق (Box)</SelectItem>
                          <SelectItem value="flatbed" className="font-bold">سطحة (Flatbed)</SelectItem>
                          <SelectItem value="refrigerated" className="font-bold">براد (Refrigerated)</SelectItem>
                          <SelectItem value="curtain" className="font-bold">جوانب (Curtain)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-black text-slate-500">تاريخ التحميل *</Label>
                      <div className="relative">
                        <Input type="date" value={form.pickup_date} onChange={e=>setForm(p=>({...p, pickup_date: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold bg-slate-50/30 pr-10" />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-black text-slate-500">الوصف (اختياري)</Label>
                      <Textarea value={form.description} onChange={e=>setForm(p=>({...p, description: e.target.value}))} className="min-h-[100px] rounded-2xl border-2 font-bold bg-slate-50/30" placeholder="Hhg" />
                    </div>
                  </div>
                </section>

                {/* 3. تفاصيل المستلم (مع الحفاظ على خانة الجوال القديمة) */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800 border-r-4 border-amber-500 pr-3">
                    تفاصيل المستلم
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2rem] bg-slate-50/30 border-2 border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 ms-1">اسم المستلم *</Label>
                      <Input value={form.receiver_name} onChange={e=>setForm(p=>({...p, receiver_name: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold bg-white" placeholder="Mohamed" />
                    </div>

                    {/* ✅ تم الحفاظ على خانة الجوال كما هي ✅ */}
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
                          placeholder="059586678646" 
                          dir="ltr" 
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 ms-1 font-bold">يجب أن يتكون من 10 أرقام ويبدأ بـ 05</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-black text-slate-500 ms-1">عنوان المستلم (اختياري)</Label>
                      <Input value={form.receiver_address} onChange={e=>setForm(p=>({...p, receiver_address: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold bg-white" placeholder="Bbvv" />
                    </div>
                  </div>
                </section>

                {/* زر النشر وصندوق المعلومات */}
                <div className="pt-6 space-y-6">
                  <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 flex gap-4 items-start relative group">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                      <Info className="text-blue-500" size={18} />
                    </div>
                    <p className="text-[11px] md:text-xs font-bold text-slate-500 leading-relaxed">
                      بضغطك على زر "نشر الشحنة"، فإنك توافق على شروط وأحكام منصة SAS Transport، وسيتم إبلاغ جميع الناقلين المتاحين الذين يطابقون مواصفات شحنتك فوراً بمجرد الضغط.
                    </p>
                    <Settings2 className="absolute left-4 top-4 text-slate-300 opacity-50" size={16} />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading || !isFormValid()} 
                    className={`w-full h-16 rounded-[1.5rem] font-black text-xl shadow-xl transition-all active:scale-95 ${
                      !isFormValid() ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
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
