import type { TripPlan, TripStop, ChargerType } from '@/types';
import { stations } from '@/data/stations';

export function generateTripPlan(
  tripDistanceKm: number,
  batteryPercent: number,
  vehicleRange: number,
  startLocation: string,
  destination: string,
): TripPlan {
  const availableRange = (vehicleRange * batteryPercent) / 100;
  const stops: TripStop[] = [];
  let remainingDistance = tripDistanceKm;
  let currentBattery = batteryPercent;
  let currentRange = availableRange;
  let prevLabel = startLocation || 'Start';

  stops.push({
    type: 'start',
    label: startLocation || 'Starting Location',
    distanceFromPrev: 0,
    batteryAtStop: currentBattery,
  });

  let chargingStops = 0;
  let driveSegment = Math.min(currentRange * 0.85, remainingDistance);

  while (remainingDistance > 0.5) {
    if (driveSegment >= remainingDistance) {
      stops.push({
        type: 'drive',
        label: `Drive ${Math.round(remainingDistance)} km`,
        distanceFromPrev: Math.round(remainingDistance),
      });
      currentBattery -= (remainingDistance / vehicleRange) * 100;
      currentRange -= remainingDistance;
      remainingDistance = 0;
      break;
    }

    stops.push({
      type: 'drive',
      label: `Drive ${Math.round(driveSegment)} km`,
      distanceFromPrev: Math.round(driveSegment),
    });

    currentBattery -= (driveSegment / vehicleRange) * 100;
    currentRange -= driveSegment;
    remainingDistance -= driveSegment;

    const station = stations[chargingStops % stations.length];
    const chargerType: ChargerType =
      currentBattery < 15 ? 'Ultra-Fast' : 'Fast';
    const chargeDuration =
      chargerType === 'Ultra-Fast' ? '20 min' : chargerType === 'Fast' ? '35 min' : '50 min';

    chargingStops++;

    stops.push({
      type: 'charge',
      label: `Charging Stop ${chargingStops}`,
      distanceFromPrev: 0,
      stationName: station.name,
      chargerType,
      chargeDuration,
      batteryAtStop: Math.max(5, Math.round(currentBattery)),
      isCharging: true,
    });

    currentBattery = 80;
    currentRange = (vehicleRange * 80) / 100;
    driveSegment = Math.min(currentRange * 0.85, remainingDistance);
  }

  stops.push({
    type: 'destination',
    label: destination || 'Destination',
    distanceFromPrev: 0,
    batteryAtStop: Math.max(5, Math.round(currentBattery)),
  });

  const totalDriveTime = (tripDistanceKm / 60) * 60;
  const totalChargeTime = chargingStops * 35;
  const totalMinutes = Math.round(totalDriveTime + totalChargeTime);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const estimatedTime = `${hours} hr ${mins} min`;

  return {
    totalDistance: tripDistanceKm,
    estimatedTime,
    chargingStops,
    stops,
    batteryPercent,
    vehicleRange,
  };
}

export function getEstimatedChargingTime(speedKW: number, batteryPercent: number): string {
  const time = Math.round((100 - batteryPercent) / (speedKW / 50) * 10);
  return `${Math.max(15, time)} min`;
}

export function generateReservationId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'CGX-';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
