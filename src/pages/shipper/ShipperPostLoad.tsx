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
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function ShipperPostLoad() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [openOrigin, setOpenOrigin] = useState(false);
  const [openDest, setOpenDest] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

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
      setDistance(calculateDistance(
        form.origin_obj.lat,
        form.origin_obj.lng,
        form.dest_obj.lat,
        form.dest_obj.lng
      ));
    } else setDistance(null);
  }, [form.origin_obj, form.dest_obj]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    if (!isFormValid() || !agreeTerms) {
      toast.error('يرجى إكمال جميع الحقول الإجبارية والموافقة على الشروط');
      return;
    }

    setLoading(true);
    try {
      const { origin_obj, dest_obj, ...payload } = form;
      const loadData = {
        ...payload,
        distance: distance || 0,
        origin_lat: origin_obj?.lat || null,
        origin_lng: origin_obj?.lng || null,
        dest_lat: dest_obj?.lat || null,
        dest_lng: dest_obj?.lng || null,
      };
      await api.postLoad(loadData, userProfile.id);
      toast.success(t('success'));
      navigate('/shipper/loads', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء نشر الشحنة');
    } finally { setLoading(false); }
  };

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
      <div className="max-w-4xl mx-auto pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tight">{t('post_load')}</h1>
            <p className="text-muted-foreground font-medium text-lg">أدخل جميع تفاصيل شحنتك لنشرها في النظام فوراً</p>
          </div>

          <Card className="rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border-none overflow-hidden bg-white">
            <CardHeader className="bg-slate-950 text-white p-10 pb-16">
              <CardTitle className="text-2x font-black flex items-center gap-3">
                <Package className="text-primary" size={32} /> {t('details')} الشحنة
              </CardTitle>
              <CardDescription className="text-slate-400 font-bold text-base mt-2">
                جميع الحقول التي تحتوي على (*) هي حقول إجبارية
              </CardDescription>
            </CardHeader>

            <CardContent className="p-10 -mt-10 bg-white rounded-[3rem] relative z-10 border-t">
              <form onSubmit={handleSubmit} className="space-y-10">

                {/* هنا تضع كل الفورم مثل ما كان عندك: اختيار المدن، مواصفات الشحنة، بيانات المستلم ... */}
                {/* يمكنك نسخ الفورم الأصلي بدون أي تعديل */}

                {/* Checkbox للموافقة */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-primary accent-primary"
                  />
                  <label htmlFor="agreeTerms" className="text-sm font-bold text-slate-600">
                    بضغطك على زر "نشر الشحنة"، فإنك توافق على شروط وأحكام منصة SAS Transport، وسيتم إبلاغ جميع الناقلين المتاحين الذين يطابقون مواصفات شحنتك فوراً بمجرد الضغط.
                  </label>
                </div>

                {/* زر النشر */}
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-20 rounded-[1.5rem] text-2xl font-black transition-all shadow-2xl",
                    isFormValid() && agreeTerms
                      ? "bg-primary hover:bg-primary/95 shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  )}
                  disabled={loading || !isFormValid() || !agreeTerms}
                >
                  {loading ? <Loader2 className="animate-spin me-3" size={28} /> : t('post_load')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
