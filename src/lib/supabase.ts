import { createClient } from '@supabase/supabase-js';
import type { Reservation } from '@/types';

// Read backend environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
);

// Initialize real Supabase client or null-safe fallback
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Checks the active status of the backend connection.
 */
export async function checkBackendConnection(): Promise<{
  connected: boolean;
  type: 'supabase' | 'local';
  message: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: true,
      type: 'local',
      message: 'Running with local persistent storage. Configure VITE_SUPABASE_URL for cloud sync.',
    };
  }

  try {
    const { error } = await supabase.from('stations').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return {
        connected: false,
        type: 'supabase',
        message: `Backend reachable but query error: ${error.message}`,
      };
    }
    return {
      connected: true,
      type: 'supabase',
      message: 'Connected to Supabase cloud backend.',
    };
  } catch (err: unknown) {
    return {
      connected: false,
      type: 'supabase',
      message: err instanceof Error ? err.message : 'Failed to reach Supabase backend.',
    };
  }
}

/**
 * Saves a reservation to Supabase cloud if connected, otherwise handled locally.
 */
export async function syncReservationToBackend(reservation: Reservation): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) {
    return false;
  }

  try {
    const { error } = await supabase.from('reservations').insert([
      {
        id: reservation.id,
        station_id: reservation.stationId,
        station_name: reservation.stationName,
        charger_type: reservation.chargerType,
        date: reservation.date,
        time: reservation.time,
        status: reservation.status,
        created_at: reservation.createdAt,
      },
    ]);
    return !error;
  } catch {
    return false;
  }
}
