import type { TripPlan, TripStop, ChargerType } from '@/types';
import { stations } from '@/data/stations';

export function generateTripPlan(
  tripDistanceKm: number,
  batteryPercent: number,
  vehicleRange: number,
  startLocation: string,
  destination: string,
  estimatedDrivingMinutes?: number
): TripPlan {
  const availableRange = (vehicleRange * batteryPercent) / 100;
  const stops: TripStop[] = [];
  let remainingDistance = tripDistanceKm;
  let currentBattery = batteryPercent;
  let currentRange = availableRange;

  stops.push({
    type: 'start',
    label: startLocation || 'Starting Location',
    distanceFromPrev: 0,
    batteryAtStop: Math.round(currentBattery),
  });

  let chargingStops = 0;

  // Real-world corridor station matchers
  const isVijayawadaCorridor =
    destination.toLowerCase().includes('vijayawada') ||
    destination.toLowerCase().includes('guntur') ||
    destination.toLowerCase().includes('amaravati');

  const corridorStations = isVijayawadaCorridor
    ? stations.filter((s) => s.id.includes('suryapet') || s.id.includes('kodad') || s.id.includes('vijayawada'))
    : stations;

  // Target charging when battery reaches ~15-20% reserve
  let driveSegment = Math.min(currentRange * 0.82, remainingDistance);

  while (remainingDistance > 0.5) {
    if (driveSegment >= remainingDistance) {
      const segmentDistance = Math.round(remainingDistance);
      currentBattery -= (remainingDistance / vehicleRange) * 100;
      currentRange -= remainingDistance;
      remainingDistance = 0;

      stops.push({
        type: 'drive',
        label: `Drive ${segmentDistance} km`,
        distanceFromPrev: segmentDistance,
      });
      break;
    }

    const segmentDistance = Math.round(driveSegment);
    stops.push({
      type: 'drive',
      label: `Drive ${segmentDistance} km`,
      distanceFromPrev: segmentDistance,
    });

    currentBattery -= (driveSegment / vehicleRange) * 100;
    currentRange -= driveSegment;
    remainingDistance -= driveSegment;

    // Pick appropriate corridor station
    const station = corridorStations[chargingStops % corridorStations.length] || stations[0];
    const chargerType: ChargerType = currentBattery < 15 ? 'Ultra-Fast' : 'Fast';
    const chargeDuration =
      chargerType === 'Ultra-Fast' ? '25 min' : '35 min';

    chargingStops++;

    stops.push({
      type: 'charge',
      label: `Charging Stop ${chargingStops}`,
      distanceFromPrev: 0,
      stationName: station.name,
      chargerType,
      chargeDuration,
      batteryAtStop: Math.max(8, Math.round(currentBattery)),
      isCharging: true,
    });

    // Charged to optimal 80% for speed and battery longevity
    currentBattery = 80;
    currentRange = (vehicleRange * 80) / 100;
    driveSegment = Math.min(currentRange * 0.82, remainingDistance);
  }

  stops.push({
    type: 'destination',
    label: destination || 'Destination',
    distanceFromPrev: 0,
    batteryAtStop: Math.max(5, Math.round(currentBattery)),
  });

  const totalDriveTime = estimatedDrivingMinutes ?? Math.round((tripDistanceKm / 65) * 60);
  const totalChargeTime = chargingStops * 30;
  const totalMinutes = Math.round(totalDriveTime + totalChargeTime);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const estimatedTime = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;

  return {
    totalDistance: Math.round(tripDistanceKm),
    estimatedTime,
    chargingStops,
    stops,
    batteryPercent,
    vehicleRange,
  };
}

export function getEstimatedChargingTime(speedKW: number, batteryPercent: number): string {
  const time = Math.round(((100 - batteryPercent) / (speedKW / 50)) * 10);
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
