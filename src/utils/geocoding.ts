export interface GeoLocation {
  name: string;
  formattedName: string;
  lat: number;
  lng: number;
  state?: string;
}

export interface ValidationResult {
  valid: boolean;
  location?: GeoLocation;
  error?: string;
}

// Curated verified database of locations (especially Telangana, Andhra Pradesh & major Indian hubs)
// Provides instant offline validation, typo-tolerance, and zero latency
const KNOWN_LOCATIONS: Record<string, GeoLocation> = {
  // Andhra Pradesh
  vijayawada: { name: 'Vijayawada', formattedName: 'Vijayawada, NTR District, Andhra Pradesh', lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  vijaywada: { name: 'Vijayawada', formattedName: 'Vijayawada, NTR District, Andhra Pradesh', lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  bezawada: { name: 'Vijayawada', formattedName: 'Vijayawada, NTR District, Andhra Pradesh', lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  guntur: { name: 'Guntur', formattedName: 'Guntur, Andhra Pradesh', lat: 16.3067, lng: 80.4365, state: 'Andhra Pradesh' },
  visakhapatnam: { name: 'Visakhapatnam', formattedName: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  vizag: { name: 'Visakhapatnam', formattedName: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  tirupati: { name: 'Tirupati', formattedName: 'Tirupati, Andhra Pradesh', lat: 13.6288, lng: 79.4192, state: 'Andhra Pradesh' },
  kurnool: { name: 'Kurnool', formattedName: 'Kurnool, Andhra Pradesh', lat: 15.8281, lng: 78.0373, state: 'Andhra Pradesh' },
  rajahmundry: { name: 'Rajahmundry', formattedName: 'Rajahmundry, East Godavari, Andhra Pradesh', lat: 17.0005, lng: 81.8040, state: 'Andhra Pradesh' },
  kakinada: { name: 'Kakinada', formattedName: 'Kakinada, Andhra Pradesh', lat: 16.9891, lng: 82.2475, state: 'Andhra Pradesh' },
  nellore: { name: 'Nellore', formattedName: 'Nellore, Andhra Pradesh', lat: 14.4426, lng: 79.9865, state: 'Andhra Pradesh' },
  kadapa: { name: 'Kadapa', formattedName: 'Kadapa, YSR District, Andhra Pradesh', lat: 14.4673, lng: 78.8242, state: 'Andhra Pradesh' },
  anantapur: { name: 'Anantapur', formattedName: 'Anantapur, Andhra Pradesh', lat: 14.6819, lng: 77.6006, state: 'Andhra Pradesh' },
  amaravati: { name: 'Amaravati', formattedName: 'Amaravati Capital City, Andhra Pradesh', lat: 16.5131, lng: 80.5165, state: 'Andhra Pradesh' },
  eluru: { name: 'Eluru', formattedName: 'Eluru, Andhra Pradesh', lat: 16.7107, lng: 81.0952, state: 'Andhra Pradesh' },
  ongole: { name: 'Ongole', formattedName: 'Ongole, Prakasam, Andhra Pradesh', lat: 15.5057, lng: 80.0499, state: 'Andhra Pradesh' },
  machilipatnam: { name: 'Machilipatnam', formattedName: 'Machilipatnam, Krishna, Andhra Pradesh', lat: 16.1875, lng: 81.1389, state: 'Andhra Pradesh' },
  srikakulam: { name: 'Srikakulam', formattedName: 'Srikakulam, Andhra Pradesh', lat: 18.2969, lng: 83.8968, state: 'Andhra Pradesh' },
  vizianagaram: { name: 'Vizianagaram', formattedName: 'Vizianagaram, Andhra Pradesh', lat: 18.1133, lng: 83.3977, state: 'Andhra Pradesh' },
  chittoor: { name: 'Chittoor', formattedName: 'Chittoor, Andhra Pradesh', lat: 13.2172, lng: 79.1003, state: 'Andhra Pradesh' },
  bhimavaram: { name: 'Bhimavaram', formattedName: 'Bhimavaram, Andhra Pradesh', lat: 16.5449, lng: 81.5212, state: 'Andhra Pradesh' },

  // Telangana
  hyderabad: { name: 'Hyderabad', formattedName: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  hyd: { name: 'Hyderabad', formattedName: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  secunderabad: { name: 'Secunderabad', formattedName: 'Secunderabad, Hyderabad, Telangana', lat: 17.4399, lng: 78.4983, state: 'Telangana' },
  warangal: { name: 'Warangal', formattedName: 'Warangal, Telangana', lat: 17.9689, lng: 79.5941, state: 'Telangana' },
  hanmakonda: { name: 'Hanamkonda', formattedName: 'Hanamkonda, Warangal, Telangana', lat: 18.0138, lng: 79.5519, state: 'Telangana' },
  hanamkonda: { name: 'Hanamkonda', formattedName: 'Hanamkonda, Warangal, Telangana', lat: 18.0138, lng: 79.5519, state: 'Telangana' },
  nizamabad: { name: 'Nizamabad', formattedName: 'Nizamabad, Telangana', lat: 18.6725, lng: 78.0941, state: 'Telangana' },
  karimnagar: { name: 'Karimnagar', formattedName: 'Karimnagar, Telangana', lat: 18.4386, lng: 79.1288, state: 'Telangana' },
  khammam: { name: 'Khammam', formattedName: 'Khammam, Telangana', lat: 17.2473, lng: 80.1514, state: 'Telangana' },
  ramagundam: { name: 'Ramagundam', formattedName: 'Ramagundam, Peddapalli, Telangana', lat: 18.7557, lng: 79.5126, state: 'Telangana' },
  mahbubnagar: { name: 'Mahbubnagar', formattedName: 'Mahbubnagar, Telangana', lat: 16.7488, lng: 77.9864, state: 'Telangana' },
  nalgonda: { name: 'Nalgonda', formattedName: 'Nalgonda, Telangana', lat: 17.0575, lng: 79.2684, state: 'Telangana' },
  suryapet: { name: 'Suryapet', formattedName: 'Suryapet, NH65, Telangana', lat: 17.1439, lng: 79.6239, state: 'Telangana' },
  siddipet: { name: 'Siddipet', formattedName: 'Siddipet, Telangana', lat: 18.1018, lng: 78.8520, state: 'Telangana' },
  adilabad: { name: 'Adilabad', formattedName: 'Adilabad, Telangana', lat: 19.6641, lng: 78.5320, state: 'Telangana' },
  mancherial: { name: 'Mancherial', formattedName: 'Mancherial, Telangana', lat: 18.8679, lng: 79.4639, state: 'Telangana' },
  kodad: { name: 'Kodad', formattedName: 'Kodad, NH65, Telangana', lat: 16.9950, lng: 79.9650, state: 'Telangana' },

  // Key Metros & Southern Hubs
  bengaluru: { name: 'Bengaluru', formattedName: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  bangalore: { name: 'Bengaluru', formattedName: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  chennai: { name: 'Chennai', formattedName: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  mumbai: { name: 'Mumbai', formattedName: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  pune: { name: 'Pune', formattedName: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  delhi: { name: 'New Delhi', formattedName: 'New Delhi, Delhi NCR', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  kolkata: { name: 'Kolkata', formattedName: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  kochi: { name: 'Kochi', formattedName: 'Kochi, Kerala', lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  coimbatore: { name: 'Coimbatore', formattedName: 'Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  mysore: { name: 'Mysuru', formattedName: 'Mysuru, Karnataka', lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  mysuru: { name: 'Mysuru', formattedName: 'Mysuru, Karnataka', lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  goa: { name: 'Goa', formattedName: 'Panaji, Goa', lat: 15.4909, lng: 73.8278, state: 'Goa' },
  nagpur: { name: 'Nagpur', formattedName: 'Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
};

function normalizeKey(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Check if string looks like random keyboard mashing/gibberish (e.g. asdfghjk, qwer123, zzzz)
function isGibberish(str: string): boolean {
  const s = str.trim().toLowerCase();
  const key = normalizeKey(s);

  // Single char is never a valid city name
  if (s.length < 2) return true;

  // Very short inputs (< 3 chars) are only valid if they are an EXACT key in known locations
  if (key.length < 3 && !KNOWN_LOCATIONS[key]) return true;

  // Repeated sequence of consonants with no vowel (e.g. asdfghjk, dfghjk, qwrtyp, xyz)
  if (/^[bcdfghjklmnpqrstvwxyz]{3,}$/.test(key) && !KNOWN_LOCATIONS[key]) return true;

  // Keyboard rows like asdf, asdfgh, qwer
  if (/^(asdf|qwerty|zxcv|hjkl)/.test(key) && !KNOWN_LOCATIONS[key]) return true;

  // Obvious non-word punctuation or number-letter soup
  if (/[0-9]{3,}/.test(s) && !s.includes('sector') && !s.includes('phase')) return true;

  // Pure repeated characters (e.g. "aaaa", "zzzz")
  if (/^(..)\1+$/.test(key) && !KNOWN_LOCATIONS[key]) return true;

  return false;
}

/**
 * Validates and geocodes a location query.
 * First checks known real-world cities and hubs.
 * If not locally matched, queries OpenStreetMap Nominatim with a fast timeout.
 */
export async function validateLocation(
  query: string,
  fieldLabel = 'Destination'
): Promise<ValidationResult> {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      valid: false,
      error: `Please enter a ${fieldLabel.toLowerCase()}.`,
    };
  }

  if (trimmed.length < 2) {
    return {
      valid: false,
      error: `${fieldLabel} is too short. Please enter a valid city name.`,
    };
  }

  if (isGibberish(trimmed)) {
    return {
      valid: false,
      error: `${fieldLabel} not recognized. Please check the spelling or enter a valid city (e.g. Vijayawada).`,
    };
  }

  const key = normalizeKey(trimmed);

  // 1. Direct local lookup
  if (KNOWN_LOCATIONS[key]) {
    return {
      valid: true,
      location: KNOWN_LOCATIONS[key],
    };
  }

  // Check partial matches in known locations (e.g. "Vijayawada city" or "Greater Hyderabad").
  // IMPORTANT: only allow partial matching when:
  //   - the user typed at least 4 characters (prevents "ad" matching "adilabad"), AND
  //   - the match ratio is ≥ 0.6 (user input covers most of the known key, not the other way around).
  // We intentionally do NOT allow k.includes(key) without the ratio guard — that was the
  // primary source of phantom routes from short/invalid input.
  if (key.length >= 4) {
    for (const [k, loc] of Object.entries(KNOWN_LOCATIONS)) {
      const shorter = Math.min(key.length, k.length);
      const longer  = Math.max(key.length, k.length);
      const ratio   = shorter / longer;

      // User input contains the known key (e.g. "vijayawadacity" ⊇ "vijayawada")
      if (key.includes(k) && ratio >= 0.6) {
        return { valid: true, location: loc };
      }
      // Known key contains the user input (e.g. "vijayawad" ⊂ "vijayawada")
      if (k.includes(key) && ratio >= 0.6) {
        return { valid: true, location: loc };
      }
    }
  }

  // 2. Real-time geocoding via OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&limit=1`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ChargeNix-SmartTripPlanner/2.0',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        // Reject placeholder / degenerate coordinates
        const invalidCoord =
          isNaN(lat) ||
          isNaN(lng) ||
          (lat === 0 && lng === 0) ||
          Math.abs(lat) > 90 ||
          Math.abs(lng) > 180;

        if (!invalidCoord) {
          const loc: GeoLocation = {
            name: item.display_name
              ? item.display_name.split(',')[0].trim()
              : trimmed,
            formattedName: item.display_name || trimmed,
            lat,
            lng,
          };
          return {
            valid: true,
            location: loc,
          };
        }
      }
    }

    // Nominatim returned 0 results -> unrecognized / invalid
    return {
      valid: false,
      error: `Location not found. "${trimmed}" could not be recognised. Please enter a valid place (e.g. Vijayawada).`,
    };
  } catch {
    // Network error or timeout — NEVER fall back to fake coordinates.
    // An unverified location must always be rejected to prevent phantom routes.
    return {
      valid: false,
      error: `Location not found. Could not look up "${trimmed}" — please check your connection or enter a well-known city name.`,
    };
  }
}

/**
 * Calculates real great-circle distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes real driving route distance and time between two verified locations.
 * Queries OSRM for turn-by-turn road distance.
 * Falls back to Haversine with a highway curvature factor ONLY for coordinates
 * that were actually geocoded (i.e. not placeholder/fallback values).
 *
 * Throws if a route cannot be established so the caller can show an error
 * instead of displaying a phantom route.
 */
export async function calculateRouteDistance(
  start: GeoLocation,
  dest: GeoLocation
): Promise<{ distanceKm: number; drivingDurationMinutes: number }> {
  // Guard: reject obviously invalid / placeholder coordinates.
  // lat 0,0 or the old fallback centroid (17.0 / 79.5) must never produce a route.
  const isPlaceholder = (lat: number, lng: number) =>
    (lat === 0 && lng === 0) ||
    isNaN(lat) ||
    isNaN(lng) ||
    (lat === 17.0 && lng === 79.5);

  if (isPlaceholder(start.lat, start.lng) || isPlaceholder(dest.lat, dest.lng)) {
    throw new Error(
      'Location not found. One or both locations could not be verified. Please enter valid places.'
    );
  }

  // If start and destination resolve to the same point, return trivial values.
  const straightDist = calculateHaversineDistance(start.lat, start.lng, dest.lat, dest.lng);
  if (straightDist < 1) {
    return { distanceKm: 1, drivingDurationMinutes: 5 };
  }

  // 1. Try real road routing via OSRM.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const osrmUrl =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${start.lng},${start.lat};${dest.lng},${dest.lat}?overview=false`;

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const roadDistanceKm = Math.round(data.routes[0].distance / 1000);
        const durationMin = Math.round(data.routes[0].duration / 60);
        if (roadDistanceKm > 0) {
          return { distanceKm: roadDistanceKm, drivingDurationMinutes: durationMin };
        }
      }
      // OSRM returned an empty/zero route — treat as unroutable.
      throw new Error(
        'Location not found. No drivable route could be found between these locations.'
      );
    }

    // Non-OK HTTP status from OSRM
    throw new Error('Location not found. The routing service returned an error.');
  } catch (err) {
    // Re-throw our own structured errors unchanged.
    if (err instanceof Error && err.message.startsWith('Location not found')) {
      throw err;
    }
    // Network timeout or AbortError: fall back to Haversine for confirmed real geocoded coords.
    // Both coordinates passed the guard above so they are genuinely geocoded.
    const estimatedRoadKm = Math.round(straightDist * 1.22);
    const avgSpeedKmH = 65;
    const drivingDurationMinutes = Math.round((estimatedRoadKm / avgSpeedKmH) * 60);
    return {
      distanceKm: Math.max(10, estimatedRoadKm),
      drivingDurationMinutes,
    };
  }
}
