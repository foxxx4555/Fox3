import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useLocationTracker() {
  const { userProfile } = useAuth();

  useEffect(() => {
    let watchId: number | null = null;

    const updateLocation = (position: GeolocationPosition) => {
      if (!userProfile?.id) return;
      
      const { latitude, longitude } = position.coords;
      
      supabase
        .from('profiles')
        .update({ latitude, longitude, last_seen_at: new Date().toISOString() })
        .eq('id', userProfile.id)
        .then(({ error }) => {
          if (error) console.error("Error updating location:", error);
        });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation Error:", error.message);
    };

    // طلب صلاحية الـ GPS والبدء في المراقبة
    if (navigator.geolocation && userProfile) {
      watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      });
    }

    // إيقاف المراقبة عند إغلاق المكون
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [userProfile]);
}
