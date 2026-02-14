import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { MapPin, Weight, DollarSign, Loader2, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export default function DriverLoads() {
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLoads = useCallback(async () => {
    const data = await api.getAvailableLoads();
    setLoads(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLoads();
    // ⚡️ مراقبة الشحنات الجديدة المتاحة
    const channel = supabase.channel('loads-market')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => {
        fetchLoads(); // إعادة الجلب عند حدوث أي تعديل في الشحنات
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLoads]);

  const filtered = loads.filter(l => l.origin.toLowerCase().includes(search.toLowerCase()) || l.destination.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-4xl font-black">الشحنات المتاحة الآن</h1>
          <Input placeholder="بحث عن مسار..." value={search} onChange={e => setSearch(e.target.value)} className="w-full md:w-80 h-14 rounded-2xl font-bold border-2" />
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary" size={48} /></div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {filtered.map(load => (
                <motion.div key={load.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group">
                    <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex-1 space-y-4">
                          <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1.5 rounded-full">شحنة متاحة</Badge>
                          <div className="flex items-center gap-4 font-black text-2xl">
                             <span className="text-primary">{load.origin}</span>
                             <ArrowRight className="text-muted-foreground opacity-30" />
                             <span className="text-accent">{load.destination}</span>
                          </div>
                          <div className="flex gap-6 text-sm font-bold text-muted-foreground">
                             <span className="flex items-center gap-1.5"><Weight size={18}/> {load.weight} طن</span>
                             <span className="flex items-center gap-1.5"><DollarSign size={18}/> {load.price} ريال</span>
                          </div>
                       </div>
                       <Button onClick={() => window.location.href=`/driver/details/${load.id}`} className="h-16 px-10 rounded-2xl bg-primary text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">عرض التفاصيل</Button>
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
},
