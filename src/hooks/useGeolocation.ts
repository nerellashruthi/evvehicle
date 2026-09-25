import { useState, useCallback } from 'react';

export type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number }
  | { status: 'denied' }
  | { status: 'error'; message: string };

/**
 * Calculates the Haversine great-circle distance between two coordinates (km).
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Hook that wraps the browser Geolocation API.
 * Returns the current geo state and a `locate` trigger function.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        status: 'error',
        message:
          'Your browser does not support geolocation. Please try a modern browser.',
      });
      return;
    }

    setState({ status: 'loading' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: 'success',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ status: 'denied' });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setState({
            status: 'error',
            message:
              'Your location is currently unavailable. Please try again.',
          });
        } else {
          setState({
            status: 'error',
            message:
              'Location request timed out. Please check your device settings and try again.',
          });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, locate, reset };
}
