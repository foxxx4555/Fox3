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
import { Loader2, Check, ChevronsUpDown, MapPin, Calculator, Info, Package, User, Phone, Calendar } from 'lucide-react';
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
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d);
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
    origin: '',
    destination: '',
    origin_obj: null as any,
    dest_obj: null as any,
    weight: '',
    price: '',
    description: '',
    type: 'general',
    package_type: '',
    pickup_date: today,
    truck_size: '',
    body_type: 'flatbed',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
  });

  useEffect(() => {
    if (form.origin_obj && form.dest_obj) {
      const dist = calculateDistance(
        form.origin_obj.lat,
        form.origin_obj.lng,
        form.dest_obj.lat,
        form.dest_obj.lng
      );
      setDistance(dist);
    } else {
      setDistance(null);
    }
  }, [form.origin_obj, form.dest_obj]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    if (!form.origin || !form.destination || !form.weight || !form.price || !form.package_type || !form.pickup_date || !form.receiver_name || !form.receiver_phone) {
      toast.error('يرجى إكمال جميع الحقول الإجبارية');
      return;
    }

    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(form.receiver_phone)) {
      toast.error('رقم هاتف المستلم غير صحيح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)');
      return;
    }

    setLoading(true);
    try {
      const { origin_obj, dest_obj, ...apiPayload } = form;
      const loadData = {
        ...apiPayload,
        distance: distance || 0,
        origin_lat: origin_obj?.lat || null,
        origin_lng: origin_obj?.lng || null,
        dest_lat: dest_obj?.lat || null,
        dest_lng: dest_obj?.lng || null,
      };
      await api.postLoad(loadData, userProfile.id);
      toast.success(t('success'));
      // بدل ما يروح لـ /shipper/loads
navigate('/shipper/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء نشر الشحنة');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const phoneRegex = /^05\d{8}$/;
    return (
      form.origin &&
      form.destination &&
      form.weight &&
      form.price &&
      form.package_type &&
      form.pickup_date &&
      form.receiver_name &&
      phoneRegex.test(form.receiver_phone)
    );
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const bodyTypes = [
    { value: 'flatbed', label: t('flatbed') },
    { value: 'curtain', label: 'ستارة (Curtain)' },
    { value: 'box', label: 'صندوق مغلق (Box)' },
    { value: 'refrigerated', label: t('refrigerated') },
    { value: 'lowboy', label: 'لوبد (Lowboy)' },
    { value: 'tank', label: t('tanker') },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-20 pt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          <Card className="rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-none overflow-hidden bg-white">
            <CardHeader className="bg-[#0f172a] text-white p-8 pb-14 text-center">
              <div className="flex justify-center mb-4">
                 <Package className="text-blue-400" size={32} />
              </div>
              <CardTitle className="text-2xl font-black mb-2">التفاصيل الشحنة</CardTitle>
              <CardDescription className="text-slate-400 font-medium">يرجى ملاحظة أن جميع الحقول التي تحتوي على (*) هي حقول إجبارية</CardDescription>
            </CardHeader>

            <CardContent className="p-8 -mt-10 bg-white rounded-[3rem] relative z-10">
              <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Section 1: Route */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    مسار الرحلة <span className="text-blue-500">*</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-wider ms-1 text-slate-500">موقع التحميل (من) *</Label>
                      <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl justify-between border-2 bg-white hover:border-blue-400 transition-all font-bold">
                            {form.origin ? <span className="flex items-center gap-2">{form.origin}</span> : "اختر مدينة التحميل"}
                            <ChevronsUpDown className="opacity-30" size={16} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command className="rounded-2xl">
                            <CommandInput placeholder="ابحث عن مدينة..." className="h-12 font-bold" />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على المدينة</CommandEmpty>
                              <CommandGroup>
                                {SAUDI_CITIES.map((city) => (
                                  <CommandItem
                                    key={city.value}
                                    value={city.label}
                                    onSelect={() => {
                                      setForm(p => ({ ...p, origin: city.label, origin_obj: city }));
                                      setOpenOrigin(false);
                                    }}
                                    className="h-12 font-bold cursor-pointer"
                                  >
                                    <Check className={cn("me-3 h-5 w-5 text-blue-500", form.origin === city.label ? "opacity-100" : "opacity-0")} />
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
                      <Label className="text-xs font-black uppercase tracking-wider ms-1 text-slate-500">موقع التسليم (إلى) *</Label>
                      <Popover open={openDest} onOpenChange={setOpenDest}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl justify-between border-2 bg-white hover:border-blue-400 transition-all font-bold">
                            {form.destination ? <span className="flex items-center gap-2">{form.destination}</span> : "اختر مدينة التسليم"}
                            <ChevronsUpDown className="opacity-30" size={16} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl">
                          <Command className="rounded-2xl">
                            <CommandInput placeholder="ابحث عن مدينة..." className="h-12 font-bold" />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على المدينة</CommandEmpty>
                              <CommandGroup>
                                {SAUDI_CITIES.map((city) => (
                                  <CommandItem
                                    key={city.value}
                                    value={city.label}
                                    onSelect={() => {
                                      setForm(p => ({ ...p, destination: city.label, dest_obj: city }));
                                      setOpenDest(false);
                                    }}
                                    className="h-12 font-bold cursor-pointer"
                                  >
                                    <Check className={cn("me-3 h-5 w-5 text-blue-500", form.destination === city.label ? "opacity-100" : "opacity-0")} />
                                    {city.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </section>

                {/* Section 2: Specs */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    مواصفات الشحنة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-1 text-slate-500">{t('weight')} (طن) *</Label>
                      <Input type="number" value={form.weight} onChange={set('weight')} className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white font-bold text-base px-6" placeholder="مثلاً: 25" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-1 text-slate-500">{t('price')} (ر.س) *</Label>
                      <Input type="number" value={form.price} onChange={set('price')} className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white font-bold text-base px-6" placeholder="مثلاً: 2500" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-1 text-slate-500">نوع البضاعة (العبوة) *</Label>
                      <Input value={form.package_type} onChange={set('package_type')} className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white font-bold text-base px-6" placeholder="طبالي، كراتين، حديد..." required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-1 text-slate-500">نوع الشاحنة المطلوب *</Label>
                      <Select value={form.body_type} onValueChange={(val) => setForm(p => ({ ...p, body_type: val }))}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white font-bold text-base px-6">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {bodyTypes.map(type => (
                            <SelectItem key={type.value} value={type.value} className="h-11 font-bold">{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label className="text-xs font-black uppercase ms-1 text-slate-500">{t('pickup_date')} *</Label>
                      <div className="relative">
                        <Input type="date" value={form.pickup_date} onChange={set('pickup_date')} min={today} className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white font-bold text-base px-6 text-end" required />
                        <Calendar className="absolute start-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase ms-1 text-slate-500">{t('description')} (اختياري)</Label>
                    <Textarea value={form.description} onChange={set('description')} className="min-h-[120px] rounded-[2rem] border-2 border-slate-100 bg-slate-50/50 focus:bg-white font-bold text-base p-6" placeholder="أية تعليمات إضافية للناقل مثل وقت الوصول المفضل أو نوع الرافعة..." />
                  </div>
                </section>

                {/* Section 3: Receiver */}
                <section className="space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3 text-slate-800">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    تفاصيل المستلم
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-8 bg-slate-50/30 rounded-[2.5rem] border-2 border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-1 flex items-center gap-1 text-slate-500"><User size={14} className="opacity-40" /> {t('receiver_name')} *</Label>
                      <Input value={form.receiver_name} onChange={set('receiver_name')} className="h-14 rounded-2xl border-none shadow-sm font-bold px-6 bg-white" placeholder="اسم الشخص أو المؤسسة" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-1 flex items-center gap-1 text-slate-500"><Phone size={14} className="opacity-40" /> {t('receiver_phone')} *</Label>
                      <Input value={form.receiver_phone} onChange={set('receiver_phone')} className="h-14 rounded-2xl border-none shadow-sm font-bold px-6 bg-white" placeholder="05xxxxxxxx" dir="ltr" required />
                      <p className="text-[10px] text-slate-400 ms-1 font-bold">يجب أن يتكون من 10 أرقام ويبدأ بـ 05</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-black uppercase ms-1 flex items-center gap-1 text-slate-500"><MapPin size={14} className="opacity-40" /> {t('receiver_address')} (اختياري)</Label>
                      <Input value={form.receiver_address} onChange={set('receiver_address')} className="h-14 rounded-2xl border-none shadow-sm font-bold px-6 bg-white" placeholder="الحي، المعلم القريب، رقم المستودع أو اللوكيشن..." />
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-6 pt-4">
                  <div className="flex items-start gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">بضغطك على زر "نشر الشحنة"، فإنك توافق على شروط وأحكام منصة SAS Transport، وسيتم إبلاغ جميع الناقلين المتاحين الذين يطابقون مواصفات شحنتك فوراً بمجرد الضغط.</p>
                  </div>
                  <Button
                    type="submit"
                    className={cn(
                      "w-full h-16 rounded-[1.5rem] text-xl font-black transition-all shadow-lg",
                      isFormValid() 
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    )}
                    disabled={loading || !isFormValid()}
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : "نشر شحنة"}
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
