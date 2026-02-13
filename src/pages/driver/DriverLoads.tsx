import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { MapPin, Weight, DollarSign, Loader2, Search } from 'lucide-react';
import { Load } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

export default function DriverLoads() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bidLoadId, setBidLoadId] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidMsg, setBidMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLoads = async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads(data as any as Load[]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('loads-changes')
      .on('postgres_changes', { event: '*', table: 'loads', schema: 'public' }, () => fetchLoads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAccept = async (loadId: string) => {
    if (!userProfile?.id) return;
    try {
      await api.acceptLoad(loadId, userProfile.id);
      toast.success(t('success'));
      fetchLoads();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBid = async () => {
    if (!userProfile?.id || !bidLoadId) return;
    setSubmitting(true);
    try {
      await api.submitBid(bidLoadId, userProfile.id, parseFloat(bidPrice), bidMsg);
      toast.success(t('success'));
      setBidLoadId(null);
      setBidPrice('');
      setBidMsg('');
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const filtered = loads.filter(l =>
    l.origin.toLowerCase().includes(search.toLowerCase()) ||
    l.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} className="ps-10" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(load => (
              <Card key={load.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                     <Badge variant="outline">{t(load.status)}</Badge>
                     <span className="text-xs text-muted-foreground">{new Date(load.created_at).toLocaleDateString('ar')}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-primary" /> {load.origin} → {load.destination}</div>
                  <div className="flex gap-4 text-sm mb-4"><span className="flex items-center gap-1"><Weight size={14}/> {load.weight} طن</span><span className="flex items-center gap-1"><DollarSign size={14}/> {load.price} ر.س</span></div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAccept(load.id)}>{t('accept_load')}</Button>
                    <Dialog open={bidLoadId === load.id} onOpenChange={open => !open && setBidLoadId(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setBidLoadId(load.id)}>{t('submit_bid')}</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('submit_bid')}</DialogTitle>
                          <DialogDescription>أدخل السعر المقترح ورسالة لصاحب الشحنة لتقديم عرضك.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div><Label>{t('bid_price')}</Label><Input type="number" value={bidPrice} onChange={e => setBidPrice(e.target.value)} dir="ltr" className="mt-1" /></div>
                          <div><Label>{t('messages')}</Label><Textarea value={bidMsg} onChange={e => setBidMsg(e.target.value)} className="mt-1" /></div>
                          <Button onClick={handleBid} disabled={submitting} className="w-full">
                            {submitting ? <Loader2 className="animate-spin" /> : t('submit')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
