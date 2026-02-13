import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useLocationTracker() {
  const { userProfile, currentRole } = useAuth();

  useEffect(() => {
    // التتبع يعمل فقط إذا كان المستخدم "سائق"
    if (currentRole !== 'driver' || !userProfile?.id) return;

    let watchId: number | null = null;

    const updateLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      await supabase
        .from('profiles')
        .update({ 
          latitude, 
          longitude, 
          last_seen_at: new Date().toISOString() 
        })
        .eq('id', userProfile.id);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("GPS Error:", error.message);
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      });
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [userProfile, currentRole]);
}
