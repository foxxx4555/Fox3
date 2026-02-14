import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Weight, DollarSign, Loader2, Search, ArrowRight, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function DriverLoads() {
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchLoads = useCallback(async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('loads-market')
      .on('postgres_changes', { event: '*', table: 'loads' }, () => fetchLoads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLoads]);

  const filtered = loads.filter(l => 
    (l.origin || "").toLowerCase().includes(search.toLowerCase()) || 
    (l.destination || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Package className="text-blue-600" size={36} /> سوق الشحنات
            </h1>
            <p className="text-muted-foreground font-medium text-lg mt-1">اكتشف الشحنات المتاحة الآن وابدأ عملك</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="البحث عن مدينة..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="h-14 rounded-2xl border-2 font-bold ps-12"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed font-bold text-slate-400">لا توجد شحنات متاحة حالياً</div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {filtered.map((load) => (
                <motion.div key={load.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group">
                    <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                       <div className="flex-1 text-right w-full">
                          <Badge className="bg-emerald-50 text-emerald-600 border-none mb-3 font-black">متاحة للتعاقد</Badge>
                          <div className="flex items-center gap-5 font-black text-2xl md:text-3xl text-slate-800">
                             <span className="text-blue-600">{load.origin}</span>
                             <ArrowRight className="text-slate-200" />
                             <span className="text-orange-500">{load.destination}</span>
                          </div>
                          <div className="flex gap-6 text-sm font-bold text-slate-400 mt-4">
                             <span><Weight size={18} className="inline me-1" /> {load.weight} طن</span>
                             <span><DollarSign size={18} className="inline me-1" /> {load.price} ريال</span>
                          </div>
                       </div>
                       <Button onClick={() => navigate(`/driver/details/${load.id}`)} className="h-16 px-12 rounded-2xl bg-blue-600 text-xl font-black text-white shadow-xl shadow-blue-200">عرض التفاصيل</Button>
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
