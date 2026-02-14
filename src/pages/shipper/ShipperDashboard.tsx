import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Star, MapPin, Search, MessageCircle, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export default function ShipperDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDrivers = useCallback(async () => {
    const data = await api.getAvailableDrivers();
    setDrivers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDrivers();
    // ⚡️ اشتراك حي لمراقبة تحركات وحالات السائقين
    const channel = supabase.channel('drivers-radar')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
         // تحديث بيانات السائق المتغير فقط لسرعة الاستجابة
         setDrivers(current => current.map(d => d.id === payload.new.id ? {...d, ...payload.new} : d));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDrivers]);

  const filtered = drivers.filter(d => d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-4xl font-black">رادار السائقين المباشر</h1>
          <Input 
            placeholder="بحث عن سائق..." 
            className="w-full md:w-80 h-14 rounded-2xl border-2 font-bold ps-12"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary" size={48} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filtered.map(driver => (
                <motion.div key={driver.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black">
                          {driver.full_name?.charAt(0)}
                        </div>
                        {/* النقطة الخضراء للحالة الحية */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-sm" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-xl truncate">{driver.full_name}</h3>
                        <div className="flex items-center gap-1.5 text-amber-500 mt-1">
                           <Star size={16} fill="currentColor" /> <span className="font-black">4.9</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 mb-8 bg-muted/40 p-5 rounded-3xl">
                       <p className="flex items-center gap-3 font-bold text-slate-600 text-sm">
                          <MapPin size={18} className="text-accent"/>
                          {driver.latitude ? "متصل الآن (تتبع حي)" : "غير متاح حالياً"}
                       </p>
                       <p dir="ltr" className="flex items-center gap-3 font-bold text-slate-600 text-sm"><Phone size={18} className="text-primary"/> {driver.phone}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <Button className="rounded-xl h-12 bg-slate-950 font-black">اتصال</Button>
                       <Button variant="outline" className="rounded-xl h-12 border-2 font-black">واتساب</Button>
                    </div>
                    {driver.latitude && (
                      <Button onClick={() => window.open(`https://www.google.com/maps?q=${driver.latitude},${driver.longitude}`)} className="w-full mt-4 h-12 bg-emerald-600 font-black rounded-xl">عرض على الخريطة</Button>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
