import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Load } from '@/types';

const statusColors: Record<string, string> = {
  available: 'bg-accent/10 text-accent', pending: 'bg-secondary/10 text-secondary',
  in_progress: 'bg-primary/10 text-primary', completed: 'bg-accent/10 text-accent',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function AdminLoads() {
  const { t } = useTranslation();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllLoads().then(data => setLoads(data as Load[])).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{t('shipment_management')}</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('origin')}</TableHead>
                  <TableHead>{t('destination')}</TableHead>
                  <TableHead>{t('weight')}</TableHead>
                  <TableHead>{t('price')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map(load => (
                  <TableRow key={load.id}>
                    <TableCell>{load.origin}</TableCell>
                    <TableCell>{load.destination}</TableCell>
                    <TableCell>{load.weight} طن</TableCell>
                    <TableCell>{load.price} ر.س</TableCell>
                    <TableCell><Badge className={statusColors[load.status]}>{t(load.status)}</Badge></TableCell>
                    <TableCell>{new Date(load.created_at).toLocaleDateString('ar')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
