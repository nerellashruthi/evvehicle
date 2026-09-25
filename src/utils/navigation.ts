import type { Station } from '../types';
import { stations as defaultStations } from '../data/stations';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface StationLocationRef {
  stationId?: string;
  stationName?: string;
  lat?: number | null;
  lng?: number | null;
}

/**
 * Validates whether latitude and longitude are valid numeric geographic coordinates.
 */
export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/**
 * Extracts or looks up valid coordinates for a given station.
 * 1. Checks direct lat/lng if provided and valid.
 * 2. Checks station by id from station list.
 * 3. Checks station by name from station list.
 * Returns null if coordinates cannot be resolved.
 */
export function getStationCoordinates(
  ref: StationLocationRef,
  stationList: Station[] = defaultStations
): Coordinates | null {
  if (isValidCoordinate(ref.lat, ref.lng)) {
    return { lat: ref.lat as number, lng: ref.lng as number };
  }

  if (ref.stationId) {
    const foundById = stationList.find((s) => s.id === ref.stationId);
    if (foundById && isValidCoordinate(foundById.lat, foundById.lng)) {
      return { lat: foundById.lat, lng: foundById.lng };
    }
  }

  if (ref.stationName) {
    const normalizedName = ref.stationName.trim().toLowerCase();
    const foundByName = stationList.find(
      (s) =>
        s.name.trim().toLowerCase() === normalizedName ||
        s.id.toLowerCase().replace(/-/g, ' ') === normalizedName.replace(/-/g, ' ')
    );
    if (foundByName && isValidCoordinate(foundByName.lat, foundByName.lng)) {
      return { lat: foundByName.lat, lng: foundByName.lng };
    }
  }

  return null;
}

/**
 * Generates the Google Maps Directions URL for driving mode.
 *
 * Format:
 * https://www.google.com/maps/dir/?api=1&destination=LATITUDE,LONGITUDE&travelmode=driving
 *
 * If origin is provided and valid:
 * https://www.google.com/maps/dir/?api=1&destination=LATITUDE,LONGITUDE&origin=LATITUDE,LONGITUDE&travelmode=driving
 */
export function buildGoogleMapsDirectionsUrl(
  destination: Coordinates,
  origin?: Coordinates | null
): string {
  if (!isValidCoordinate(destination.lat, destination.lng)) {
    throw new Error('Invalid destination coordinates provided for navigation.');
  }

  // Format destination coordinates: LATITUDE,LONGITUDE
  const destParam = `${encodeURIComponent(destination.lat.toString())},${encodeURIComponent(destination.lng.toString())}`;
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=driving`;

  if (origin && isValidCoordinate(origin.lat, origin.lng)) {
    const originParam = `${encodeURIComponent(origin.lat.toString())},${encodeURIComponent(origin.lng.toString())}`;
    url = `https://www.google.com/maps/dir/?api=1&destination=${destParam}&origin=${originParam}&travelmode=driving`;
  }

  return url;
}

/**
 * Safely inspects if geolocation permission has already been granted,
 * without prompting the user if it has not.
 */
export async function getGrantedUserLocation(): Promise<Coordinates | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  try {
    if ('permissions' in navigator && navigator.permissions.query) {
      const permission = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });

      // ONLY if permission has already been granted, fetch the current position.
      // Do NOT trigger any prompt if status is 'prompt' or 'denied'.
      if (permission.state === 'granted') {
        return new Promise<Coordinates | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 }
          );
        });
      }
      return null;
    }
  } catch {
    // If permissions query is not supported or errors, gracefully return null
    return null;
  }

  return null;
}

/**
 * Opens the Google Maps directions URL according to device platform:
 * - Desktop: Opens in a new browser tab.
 * - Mobile: Launches URL so device can open the Google Maps app if installed,
 *   or fallback to the mobile browser.
 */
export function openGoogleMaps(url: string): void {
  if (typeof window === 'undefined') return;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    // Mobile: open directions URL allowing the native Google Maps app intent/Universal Link
    const newWindow = window.open(url, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = url;
    }
  } else {
    // Desktop: open Google Maps in a new browser tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
