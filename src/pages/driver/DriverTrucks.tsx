import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Truck, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriverTrucks() {
  const { userProfile } = useAuth();
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب بيانات الشاحنات من جدول trucks
  const fetchTrucks = async () => {
    if (!userProfile?.id) return;
    try {
      const { data, error } = await supabase
        .from('trucks') 
        .select('*')
        .eq('driver_id', userProfile.id);
      
      if (error) throw error;
      setTrucks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, [userProfile?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشاحنة؟")) return;
    try {
      const { error } = await supabase.from('trucks').delete().eq('id', id);
      if (error) throw error;
      toast.success("تم حذف الشاحنة بنجاح");
      fetchTrucks();
    } catch (e) {
      toast.error("فشل الحذف");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-20">
        <div className="flex justify-between items-center px-4">
          <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 h-12 px-6 gap-2 shadow-lg shadow-blue-100 font-bold">
            <Plus size={20} /> إضافة شاحنة جديدة
          </Button>
          <h1 className="text-3xl font-black text-slate-900 text-right">شاحناتي</h1>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : trucks.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold mx-4">
            <Truck size={64} className="mx-auto mb-4 opacity-20" />
            <p>لا توجد شاحنات مسجلة حالياً</p>
            <p className="text-sm font-medium mt-2">قم بإضافة شاحنتك لتبدأ في استقبال الطلبات</p>
          </div>
        ) : (
          <div className="grid gap-6 px-4">
            <AnimatePresence>
              {trucks.map((truck) => (
                <motion.div key={truck.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden border-r-8 border-r-blue-500">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                           <Button 
                             variant="ghost" size="icon" 
                             className="h-12 w-12 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white"
                             onClick={() => handleDelete(truck.id)}
                           >
                             <Trash2 size={20} />
                           </Button>
                        </div>

                        <div className="text-right flex items-center gap-5">
                          <div>
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <ShieldCheck size={16} className="text-emerald-500" />
                              <p className="font-black text-2xl text-slate-800">{truck.plate_number}</p>
                            </div>
                            <p className="text-slate-500 font-bold">{truck.truck_type} - {truck.capacity} طن</p>
                          </div>
                          <div className="p-5 bg-blue-50 text-blue-600 rounded-[2rem]">
                            <Truck size={35} />
                          </div>
                        </div>
                      </div>
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
