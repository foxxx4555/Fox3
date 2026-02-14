import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Truck as TruckIcon, Settings2, Info } from 'lucide-react';
import { Truck } from '@/types';

// قائمة أنواع الشاحنات بالعربي مباشرة
const truckTypesList = [
  { id: 'trella', label: 'تريلا' },
  { id: 'lorry', label: 'لوري' },
  { id: 'dyna', label: 'دينا' },
  { id: 'pickup', label: 'بيك أب' },
  { id: 'refrigerated', label: 'مبردة' },
  { id: 'tanker', label: 'صهريج' },
  { id: 'flatbed', label: 'سطحة' },
  { id: 'container', label: 'حاوية' },
];

export default function DriverTrucks() {
  const { userProfile } = useAuth();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ plate_number: '', brand: '', model_year: '', truck_type: 'trella', capacity: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTrucks = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getTrucks(userProfile.id);
      setTrucks(data as Truck[] || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrucks(); }, [userProfile]);

  const handleAdd = async () => {
    if (!form.plate_number) return toast.error("رقم اللوحة مطلوب");
    setSubmitting(true);
    try {
      await api.addTruck(form, userProfile?.id || "");
      toast.success("تم تسجيل الشاحنة بنجاح 🚛");
      setDialogOpen(false);
      setForm({ plate_number: '', brand: '', model_year: '', truck_type: 'trella', capacity: '' });
      fetchTrucks();
    } catch (err: any) { toast.error("حدث خطأ أثناء التسجيل"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشاحنة؟")) return;
    try {
      await api.deleteTruck(id);
      toast.success("تم الحذف بنجاح");
      fetchTrucks();
    } catch (err: any) { toast.error("فشل الحذف"); }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 text-right">أسطول شاحناتي</h1>
            <p className="text-muted-foreground font-medium mt-1">أضف وأدر الشاحنات الخاصة بك لتتمكن من قبول العروض</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-100">
                <Plus size={22} className="me-2" /> تسجيل شاحنة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none max-w-lg">
              <DialogHeader className="p-8 bg-slate-900 text-white">
                <DialogTitle className="text-2xl font-black">إضافة شاحنة</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold">أدخل بيانات الشاحنة بشكل دقيق لتظهر في طلبات التاجر.</DialogDescription>
              </DialogHeader>
              <div className="p-8 space-y-5 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 mr-1">رقم اللوحة *</Label>
                    <Input value={form.plate_number} onChange={e => setForm(p => ({...p, plate_number: e.target.value}))} className="h-12 rounded-xl border-2 font-black" dir="ltr" placeholder="1234 ABC" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 mr-1">الماركة / الموديل</Label>
                    <Input value={form.brand} onChange={e => setForm(p => ({...p, brand: e.target.value}))} className="h-12 rounded-xl border-2 font-bold" placeholder="مثلاً: مرسيدس" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700 mr-1">نوع الشاحنة</Label>
                  <Select value={form.truck_type} onValueChange={v => setForm(p => ({...p, truck_type: v}))}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {truckTypesList.map(t => (
                        <SelectItem key={t.id} value={t.id} className="h-10 font-bold">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700 mr-1">سنة الصنع</Label>
                      <Input value={form.model_year} onChange={e => setForm(p => ({...p, model_year: e.target.value}))} className="h-12 rounded-xl border-2 font-bold text-right" placeholder="2024" />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700 mr-1">حمولة القصوى (طن)</Label>
                      <Input value={form.capacity} onChange={e => setForm(p => ({...p, capacity: e.target.value}))} className="h-12 rounded-xl border-2 font-bold text-right" placeholder="25" />
                   </div>
                </div>

                <Button onClick={handleAdd} disabled={submitting} className="w-full h-14 mt-4 rounded-xl bg-blue-600 text-lg font-black shadow-lg">
                  {submitting ? <Loader2 className="animate-spin" /> : "إكمال التسجيل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : trucks.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed">
            <TruckIcon size={64} className="mx-auto text-slate-200 mb-6" />
            <p className="text-xl font-black text-slate-400 italic">لا توجد شاحنات مسجلة حالياً</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {trucks.map(truck => (
              <Card key={truck.id} className="rounded-3xl border-none shadow-lg bg-white overflow-hidden group">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <TruckIcon size={28} />
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-slate-900">{truck.brand || "شاحنة عامة"}</p>
                        <p className="font-black text-blue-600 text-lg" dir="ltr">{truck.plate_number}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-full" onClick={() => handleDelete(truck.id)}>
                      <Trash2 size={20} />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase">النوع</p>
                        <p className="font-bold text-sm text-slate-700">{truckTypesList.find(t => t.id === truck.truck_type)?.label || truck.truck_type}</p>
                     </div>
                     <div className="space-y-1 text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase">الحمولة</p>
                        <p className="font-bold text-sm text-slate-700">{truck.capacity || 'غير محدد'} طن</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
