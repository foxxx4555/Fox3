import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Truck as TruckIcon } from 'lucide-react';
import { Truck } from '@/types';

export default function DriverTrucks() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ plate_number: '', brand: '', model_year: '', truck_type: 'trella' as any, capacity: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTrucks = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getTrucks(userProfile.id);
      setTrucks(data as Truck[]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrucks(); }, [userProfile]);

  const handleAdd = async () => {
    if (!userProfile?.id) return;
    setSubmitting(true);
    try {
      await api.addTruck(form, userProfile.id);
      toast.success(t('success'));
      setDialogOpen(false);
      setForm({ plate_number: '', brand: '', model_year: '', truck_type: 'trella', capacity: '' });
      fetchTrucks();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTruck(id);
      toast.success(t('success'));
      fetchTrucks();
    } catch (err: any) { toast.error(err.message); }
  };

  const truckTypes = ['trella', 'lorry', 'dyna', 'pickup', 'refrigerated', 'tanker', 'flatbed', 'container'];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('my_trucks')}</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus size={18} className="me-2" />{t('register_truck')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('register_truck')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t('plate_number')}</Label><Input value={form.plate_number} onChange={e => setForm(p => ({...p, plate_number: e.target.value}))} className="mt-1" dir="ltr" /></div>
                <div><Label>{t('brand')}</Label><Input value={form.brand} onChange={e => setForm(p => ({...p, brand: e.target.value}))} className="mt-1" /></div>
                <div><Label>{t('model_year')}</Label><Input value={form.model_year} onChange={e => setForm(p => ({...p, model_year: e.target.value}))} className="mt-1" dir="ltr" /></div>
                <div>
                  <Label>{t('truck_type')}</Label>
                  <Select value={form.truck_type} onValueChange={v => setForm(p => ({...p, truck_type: v}))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {truckTypes.map(tt => <SelectItem key={tt} value={tt}>{t(tt === 'pickup' ? 'pickup_truck' : tt)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t('capacity')}</Label><Input value={form.capacity} onChange={e => setForm(p => ({...p, capacity: e.target.value}))} className="mt-1" /></div>
                <Button onClick={handleAdd} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="animate-spin" /> : t('save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : trucks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{t('no_data')}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {trucks.map(truck => (
              <Card key={truck.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10"><TruckIcon size={24} className="text-primary" /></div>
                      <div>
                        <p className="font-semibold">{truck.brand || t('truck_type')}</p>
                        <p className="text-sm text-muted-foreground">{truck.plate_number}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(truck.id)}>
                      <Trash2 size={18} />
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    {truck.model_year && <span>{t('model_year')}: {truck.model_year}</span>}
                    {truck.truck_type && <span>{t('truck_type')}: {t(truck.truck_type === 'pickup' ? 'pickup_truck' : truck.truck_type)}</span>}
                    {truck.capacity && <span>{t('capacity')}: {truck.capacity}</span>}
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
