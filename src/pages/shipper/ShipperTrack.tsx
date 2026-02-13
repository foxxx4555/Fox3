import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export default function ShipperTrack() {
  const { t } = useTranslation();

  return (
    <AppLayout>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <MapPin size={48} className="mb-4 text-primary/40" />
          <p className="text-lg font-medium">{t('track_shipment')}</p>
          <p className="text-sm">قريباً - سيتم إضافة خريطة التتبع المباشر</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
