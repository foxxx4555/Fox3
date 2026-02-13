import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar, FileSearch, User, Phone, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function ShipperHistory() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);

  useEffect(() => {
    if (userProfile?.id) {
      api.getUserLoads(userProfile.id).then(data => {
        // فلترة الشحنات المكتملة فقط للشاحن
        setLoads(data.filter((l: any) => l.status === 'completed'));
      }).finally(() => setLoading(false));
    }
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight">أرشيف الشحنات</h1>
          <p className="text-muted-foreground font-medium mt-2">متابعة كافة العمليات التي تم تسليمها بنجاح</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary" size={48} /></div>
        ) : loads.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-muted shadow-sm">
            <History size={64} className="mx-auto text-muted-foreground/30 mb-6" />
            <p className="text-xl font-black text-muted-foreground">السجل فارغ حالياً</p>
            <p className="text-muted-foreground mt-2 font-medium">الشحنات المكتملة ستظهر هنا تلقائياً</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {loads.map(load => (
              <Card key={load.id} className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all bg-white group overflow-hidden">
                <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shrink-0">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-xl">{load.origin}</span>
                        <span className="text-muted-foreground">←</span>
                        <span className="font-black text-xl">{load.destination}</span>
                      </div>
                      <p className="text-sm text-muted-foreground font-bold flex items-center gap-2">
                        <Calendar size={14} /> تم الإنجاز بتاريخ: {new Date(load.updated_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end hidden md:block">
                       <p className="font-black text-xl text-primary">{load.price} ر.س</p>
                       <p className="text-[10px] font-black uppercase text-muted-foreground">تم الدفع</p>
                    </div>
                    <Button 
                      onClick={() => setSelectedLoad(load)}
                      className="rounded-2xl h-14 px-8 font-black bg-slate-950 hover:bg-primary transition-all gap-2"
                    >
                      <FileSearch size={20} /> تفاصيل العملية
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <DialogContent className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none">
            <DialogHeader className="p-8 bg-slate-950 text-white">
              <DialogTitle className="text-2xl font-black">ملخص الرحلة</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold">تم إغلاق هذه الرحلة بنجاح وهي مخزنة في الأرشيف</DialogDescription>
            </DialogHeader>
            {selectedLoad && (
              <div className="p-8 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-xs font-black text-muted-foreground uppercase mb-2">من</p>
                      <p className="font-black text-lg flex items-center gap-2"><MapPin size={16} className="text-primary"/> {selectedLoad.origin}</p>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-xs font-black text-muted-foreground uppercase mb-2">إلى</p>
                      <p className="font-black text-lg flex items-center gap-2"><MapPin size={16} className="text-accent"/> {selectedLoad.destination}</p>
                   </div>
                </div>
                
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-5 border-2 border-dashed rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><User size={20}/></div>
                         <div><p className="text-xs font-bold text-muted-foreground">السائق المنفذ</p><p className="font-black">{selectedLoad.driver?.full_name || 'سائق خارجي'}</p></div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => window.location.href=`tel:${selectedLoad.driver?.phone}`} className="rounded-full h-10 w-10 bg-muted"><Phone size={18}/></Button>
                   </div>

                   <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-3 font-black text-emerald-700"><DollarSign /> إجمالي الأجرة</div>
                      <p className="font-black text-2xl text-emerald-600">{selectedLoad.price} ريال</p>
                   </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
