import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';

export default function ShipperAccount() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: userProfile?.full_name || '',
    phone: userProfile?.phone || '',
    email: userProfile?.email || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userProfile?.id) return;
    setSaving(true);
    try {
      await api.updateProfile(userProfile.id, form);
      toast.success(t('success'));
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <AppLayout>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User size={20} /> {t('profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>{t('full_name')}</Label><Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} className="mt-1" /></div>
          <div><Label>{t('email')}</Label><Input value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="mt-1" dir="ltr" /></div>
          <div><Label>{t('phone')}</Label><Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="mt-1" dir="ltr" /></div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="animate-spin" /> : t('save')}
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
