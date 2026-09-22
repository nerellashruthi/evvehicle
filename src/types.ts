export type ChargerType = 'Fast' | 'Normal' | 'Ultra-Fast';
export type AvailabilityStatus = 'Available' | 'Occupied' | 'Limited';

export interface ChargerGroup {
  type: ChargerType;
  totalPorts: number;
  availablePorts: number;
  speedKW: number;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  chargers: ChargerGroup[];
  status: AvailabilityStatus;
  rating: number;
  open24Hours: boolean;
  amenities: string[];
}

export interface Reservation {
  id: string;
  stationId: string;
  stationName: string;
  chargerType: ChargerType;
  date: string;
  time: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface User {
  name: string;
  email: string;
  vehicleModel: string;
  vehicleRange: number;
  batteryPercent: number;
}

export interface TripStop {
  type: 'start' | 'drive' | 'charge' | 'destination';
  label: string;
  distanceFromPrev: number;
  stationName?: string;
  chargerType?: ChargerType;
  chargeDuration?: string;
  batteryAtStop?: number;
  isCharging?: boolean;
}

export interface TripPlan {
  totalDistance: number;
  estimatedTime: string;
  chargingStops: number;
  stops: TripStop[];
  batteryPercent: number;
  vehicleRange: number;
}

export type PageName =
  | 'home'
  | 'stations'
  | 'reserve'
  | 'trip-planner'
  | 'how-it-works'
  | 'dashboard'
  | 'login'
  | 'station-details';
