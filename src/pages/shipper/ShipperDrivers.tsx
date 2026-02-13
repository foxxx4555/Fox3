import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, User, Star, MapPin, Search, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// واجهة مؤقتة للـ Geocoding API
const GEOCODING_API_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

// وظيفة جلب اسم المدينة من الإحداثيات
const getCityFromCoords = async (lat: number, lon: number) => {
  if (!lat || !lon) return "غير محدد";
  try {
    const response = await fetch(`${GEOCODING_API_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=ar`);
    const data = await response.json();
    return data.city || data.locality || "غير محدد";
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return "تحديث الموقع...";
  }
};

export default function ShipperDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // جلب البيانات الأولية للسائقين
  const fetchInitialDrivers = useCallback(async () => {
    try {
      const initialData = await api.getAvailableDrivers();
      // جلب اسم المدينة لكل سائق
      const driversWithLocation = await Promise.all(
        initialData.map(async (driver) => ({
          ...driver,
          currentCity: await getCityFromCoords(driver.latitude, driver.longitude),
        }))
      );
      setDrivers(driversWithLocation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialDrivers();

    // الاستماع للتحديثات الحية من Supabase
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        async (payload) => {
          const updatedDriver = payload.new;
          // تحديث اسم المدينة فقط للسائق الذي تغير موقعه
          const city = await getCityFromCoords(updatedDriver.latitude, updatedDriver.longitude);
          
          setDrivers((prevDrivers) =>
            prevDrivers.map((driver) =>
              driver.id === updatedDriver.id
                ? { ...driver, ...updatedDriver, currentCity: city }
                : driver
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitialDrivers]);

  // ... باقي الوظائف (الاتصال، واتساب)
  const handleCall = (phoneNumber: string) => { /* ... */ };
  const handleWhatsApp = (phoneNumber: string) => { /* ... */ };

  const filteredDrivers = drivers.filter(d => 
    d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.includes(searchTerm)
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* ... قسم البحث والعنوان ... */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">تتبع السائقين المباشر</h1>
            <p className="text-muted-foreground font-medium text-lg mt-1">شاهد مواقع سائقيك المتاحين على الخريطة لحظة بلحظة</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDrivers.map((driver, index) => (
              <motion.div key={driver.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all group bg-white">
                  <CardContent className="p-8">
                    {/* ... قسم معلومات السائق ... */}
                    <div className="flex items-center gap-5 mb-8">
                      {/* ... الصورة والاسم ... */}
                    </div>
                    
                    <div className="space-y-4 mb-8 bg-muted/30 p-5 rounded-[1.5rem]">
                      {/* ... رقم الهاتف ... */}
                      <div className="flex items-center gap-3 text-sm font-black text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-accent">
                          <MapPin size={16} />
                        </div>
                        {/* عرض الموقع الحي */}
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          {driver.currentCity || "جاري تحديد الموقع..."}
                        </span>
                      </div>
                    </div>

                    {/* ... أزرار الاتصال والواتساب ... */}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
