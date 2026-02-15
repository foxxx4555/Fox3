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
  { value: "riyadh", label: "الرياض", lat: 24.7136, lng: 46.6753 },
  { value: "jeddah", label: "جدة", lat: 21.5433, lng: 39.1728 },
  { value: "mecca", label: "مكة المكرمة", lat: 21.3891, lng: 39.8579 },
  { value: "medina", label: "المدينة المنورة", lat: 24.5247, lng: 39.5692 },
  { value: "dammam", label: "الدمام", lat: 26.4207, lng: 50.0888 },
  { value: "khobar", label: "الخبر", lat: 26.2172, lng: 50.1971 },
  { value: "tabuk", label: "تبوك", lat: 28.3835, lng: 36.5662 },
  { value: "hail", label: "حائل", lat: 27.5114, lng: 41.7208 },
  { value: "abha", label: "أبها", lat: 18.2164, lng: 42.5053 },
  { value: "jizan", label: "جازان", lat: 16.8894, lng: 42.5706 },
  { value: "najran", label: "نجران", lat: 17.4917, lng: 44.1322 },
  { value: "buraidah", label: "بريدة", lat: 26.3260, lng: 43.9750 },
  { value: "taif", label: "الطائف", lat: 21.4418, lng: 40.5078 },
  { value: "jubail", label: "الجبيل", lat: 27.0000, lng: 49.6111 },
  { value: "yanbu", label: "ينبع", lat: 24.0232, lng: 38.1900 },
  { value: "arar", label: "عرعر", lat: 30.9833, lng: 41.0167 },
  { value: "sakaka", label: "سكاكا", lat: 29.9697, lng: 40.2064 },
  { value: "al_bahah", label: "الباحة", lat: 20.0129, lng: 41.4677 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function ShipperPostLoad() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [openOrigin, setOpenOrigin] = useState(false);
  const [openDest, setOpenDest] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    origin: '', destination: '', origin_obj: null as any, dest_obj: null as any,
    weight: '', price: '', description: '', type: 'general', package_type: '',
    pickup_date: today, truck_size: '', body_type: 'flatbed',
    receiver_name: '', receiver_phone: '', receiver_address: '',
  });

  useEffect(() => {
    if (form.origin_obj && form.dest_obj) {
      setDistance(calculateDistance(form.origin_obj.lat, form.origin_obj.lng, form.dest_obj.lat, form.dest_obj.lng));
    }
  }, [form.origin_obj, form.dest_obj]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;
    if (form.receiver_phone.length !== 9) {
      toast.error('رقم الجوال يجب أن يكون 9 أرقام');
      return;
    }

    setLoading(true);
    try {
      const { origin_obj, dest_obj, ...apiPayload } = form;
      const loadData = {
        ...apiPayload,
        distance: distance || 0,
        receiver_phone: '+966' + form.receiver_phone // إضافة الرمز الدولي
      };
      await api.postLoad(loadData, userProfile.id);
      toast.success(t('success'));
      // ✅ التوجيه للداشبورد لإنهاء الـ Loop
      navigate('/shipper/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-20 pt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
            <CardHeader className="bg-[#0f172a] text-white p-8 pb-14 text-center">
              <Package size={32} className="mx-auto text-blue-400 mb-4" />
              <CardTitle className="text-2xl font-black">التفاصيل الشحنة</CardTitle>
              <CardDescription className="text-slate-400 font-medium tracking-tight">يرجى ملاحظة أن جميع الحقول التي تحتوي على (*) هي حقول إجبارية</CardDescription>
            </CardHeader>

            <CardContent className="p-8 -mt-10 bg-white rounded-[3rem] relative z-10">
              <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* مسار الرحلة */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" /> مسار الرحلة *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30">
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-500">موقع التحميل (من) *</Label>
                      <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl justify-between border-2 bg-white font-bold">
                            {form.origin || "اختر مدينة التحميل"}
                            <ChevronsUpDown className="opacity-30" size={16} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command>
                            <CommandInput placeholder="ابحث..." className="h-12 font-bold" />
                            <CommandList>
                              <CommandGroup>
                                {SAUDI_CITIES.map((city) => (
                                  <CommandItem key={city.value} onSelect={() => { setForm(p => ({ ...p, origin: city.label, origin_obj: city })); setOpenOrigin(false); }} className="h-12 font-bold cursor-pointer">
                                    {city.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-500">موقع التسليم (إلى) *</Label>
                      <Popover open={openDest} onOpenChange={setOpenDest}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl justify-between border-2 bg-white font-bold">
                            {form.destination || "اختر مدينة التسليم"}
                            <ChevronsUpDown className="opacity-30" size={16} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command>
                            <CommandInput placeholder="ابحث..." className="h-12 font-bold" />
                            <CommandList>
                                {SAUDI_CITIES.map((city) => (
                                  <CommandItem key={city.value} onSelect={() => { setForm(p => ({ ...p, destination: city.label, dest_obj: city })); setOpenDest(false); }} className="h-12 font-bold cursor-pointer">
                                    {city.label}
                                  </CommandItem>
                                ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </section>

                {/* مواصفات الشحنة */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" /> مواصفات الشحنة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">الوزن (طن) *</Label>
                      <Input type="number" value={form.weight} onChange={e=>setForm(p=>({...p, weight: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold" placeholder="مثلاً: 25" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">السعر المعروض (ر.س) *</Label>
                      <Input type="number" value={form.price} onChange={e=>setForm(p=>({...p, price: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold" placeholder="مثلاً: 2500" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">نوع البضاعة *</Label>
                      <Input value={form.package_type} onChange={e=>setForm(p=>({...p, package_type: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold" placeholder="طبالي، كراتين..." required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">تاريخ التحميل *</Label>
                      <Input type="date" value={form.pickup_date} min={today} onChange={e=>setForm(p=>({...p, pickup_date: e.target.value}))} className="h-14 rounded-2xl border-2 font-bold" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-500">الوصف (اختياري)</Label>
                    <Textarea value={form.description} onChange={e=>setForm(p=>({...p, description: e.target.value}))} className="min-h-[120px] rounded-[2rem] border-2 font-bold p-6" placeholder="أي تعليمات إضافية..." />
                  </div>
                </section>

                {/* تفاصيل المستلم */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" /> تفاصيل المستلم
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50/30 rounded-[2.5rem] border-2 border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">اسم المستلم *</Label>
                      <Input value={form.receiver_name} onChange={e=>setForm(p=>({...p, receiver_name: e.target.value}))} className="h-14 rounded-2xl border-none shadow-sm font-bold bg-white" placeholder="الاسم أو المؤسسة" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500">جوال المستلم *</Label>
                      <div className="relative group">
                        <div className="absolute start-0 top-0 h-full flex items-center px-4 border-e-2 border-slate-100 font-black text-slate-400 bg-slate-50 rounded-s-2xl z-10">+966</div>
                        <Input value={form.receiver_phone} onChange={e=>setForm(p=>({...p, receiver_phone: e.target.value.replace(/\D/g, '').slice(0,9)}))} className="h-14 rounded-2xl border-2 ps-24 font-black text-lg" placeholder="5xxxxxxxx" dir="ltr" required />
                      </div>
                    </div>
                  </div>
                </section>

                <Button type="submit" disabled={loading} className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl shadow-xl shadow-blue-100 transition-all active:scale-95">
                  {loading ? <Loader2 className="animate-spin" /> : "نشر شحنة"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
