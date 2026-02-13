import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, User, Star, MapPin, Search, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function ShipperDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const data = await api.getAvailableDrivers();
      setDrivers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.includes(searchTerm)
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">السائقين المسجلين</h1>
            <p className="text-muted-foreground font-medium text-lg mt-1">قائمة بجميع السائقين المعتمدين في برنامجك</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input 
              placeholder="ابحث بالاسم أو رقم الجوال..." 
              className="ps-12 h-14 rounded-2xl border-2 focus:border-primary transition-all font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="font-bold text-muted-foreground animate-pulse">جاري جلب قائمة السائقين...</p>
          </div>
        ) : filteredDrivers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDrivers.map((driver, index) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all group bg-white">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black shadow-inner">
                        {driver.avatar_url ? (
                          <img src={driver.avatar_url} alt="" className="w-full h-full object-cover rounded-3xl" />
                        ) : driver.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-xl truncate">{driver.full_name}</h3>
                        <div className="flex items-center gap-1.5 text-amber-500 mt-1">
                          <Star size={16} fill="currentColor" />
                          <span className="text-sm font-black">4.9</span>
                          <span className="text-xs font-bold text-muted-foreground ms-1">(120 رحلة)</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 bg-muted/30 p-5 rounded-[1.5rem]">
                      <div className="flex items-center gap-3 text-sm font-black text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                          <Phone size={16} />
                        </div>
                        <span dir="ltr">{driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-black text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-accent">
                          <MapPin size={16} />
                        </div>
                        <span>متاح الآن في الرياض</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button className="h-12 rounded-xl font-bold bg-slate-900 hover:bg-primary transition-all gap-2">
                        <Phone size={18} /> اتصال
                      </Button>
                      <Button variant="outline" className="h-12 rounded-xl font-bold border-2 gap-2">
                        <MessageCircle size={18} /> رسالة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/50">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="text-muted-foreground/30" size={40} />
            </div>
            <p className="text-xl font-black text-muted-foreground">لا يوجد سائقين مسجلين حالياً</p>
            <p className="text-muted-foreground font-medium mt-2 px-6">بمجرد تسجيل سائقين جدد باستخدام رابط الدعوة الخاص بك سيظهرون هنا.</p>
            <Button className="mt-8 rounded-xl h-12 px-8 font-bold" variant="outline">
              نسخ رابط الدعوة
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
