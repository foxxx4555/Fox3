import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Weight, DollarSign, Loader2, Search, ArrowRight, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function DriverLoads() {
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // جلب الشحنات المتاحة
  const fetchLoads = useCallback(async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoads();

    // ⚡️ التحديث الفوري (Real-time): مراقبة أي شحنة جديدة أو تعديل
    const channel = supabase.channel('loads-market')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'loads' }, 
        () => {
          console.log("⚡️ تحديث فوري في الشحنات...");
          fetchLoads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLoads]);

  const filtered = loads.filter(l => 
    (l.origin || "").toLowerCase().includes(search.toLowerCase()) || 
    (l.destination || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Package className="text-primary" size={36} /> سوق الشحنات
            </h1>
            <p className="text-muted-foreground font-medium text-lg mt-1">اكتشف الشحنات المتاحة الآن وابدأ عملك</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input 
              placeholder="البحث عن مدينة أو مسار..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="h-14 rounded-2xl border-2 border-slate-100 bg-white shadow-sm font-bold ps-12"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="font-bold text-muted-foreground animate-pulse">جاري رصد الشحنات المتاحة...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed shadow-sm">
            <Package size={64} className="mx-auto text-muted-foreground/20 mb-6" />
            <p className="text-xl font-black text-muted-foreground">لا توجد شحنات متاحة في هذا المسار</p>
            <p className="text-muted-foreground mt-2 font-medium">سيتم تحديث القائمة تلقائياً بمجرد نشر شحنة جديدة</p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((load) => (
                <motion.div
                  key={load.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all">
                    <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                       <div className="flex-1 space-y-5 w-full">
                          <Badge className="bg-emerald-50 text-emerald-600 border-none font-black px-4 py-1.5 rounded-full uppercase tracking-widest text-[10px]">متاحة للتعاقد</Badge>
                          
                          <div className="flex items-center gap-5 font-black text-2xl md:text-3xl text-slate-800">
                             <span className="text-primary">{load.origin}</span>
                             <ArrowRight className="text-muted-foreground opacity-30 shrink-0" />
                             <span className="text-accent">{load.destination}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
                             <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                               <Weight size={18} className="text-primary" /> {load.weight} طن
                             </div>
                             <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                               <DollarSign size={18} className="text-emerald-500" /> {load.price} ريال
                             </div>
                          </div>
                       </div>
                       
                       <Button 
                         onClick={() => navigate(`/driver/details/${load.id}`)}
                         className="w-full md:w-auto h-16 px-12 rounded-2xl bg-primary text-xl font-black text-white shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all"
                       >
                         عرض التفاصيل
                       </Button>
                    </CardContent>
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
