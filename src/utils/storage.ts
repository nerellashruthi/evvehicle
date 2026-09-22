import type { Reservation, User } from '@/types';

const RESERVATIONS_KEY = 'chargenix_reservations';
const USER_KEY = 'chargenix_user';
const RECENT_STATION_KEY = 'chargenix_recent_station';
const RECENT_TRIP_KEY = 'chargenix_recent_trip';

export function getReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReservation(reservation: Reservation): void {
  const all = getReservations();
  all.unshift(reservation);
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(all.slice(0, 20)));
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function getRecentStationId(): string | null {
  return localStorage.getItem(RECENT_STATION_KEY);
}

export function setRecentStationId(id: string): void {
  localStorage.setItem(RECENT_STATION_KEY, id);
}

export interface RecentTrip {
  from: string;
  to: string;
  distance: number;
  date: string;
}

export function getRecentTrip(): RecentTrip | null {
  try {
    const raw = localStorage.getItem(RECENT_TRIP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setRecentTrip(trip: RecentTrip): void {
  localStorage.setItem(RECENT_TRIP_KEY, JSON.stringify(trip));
}
