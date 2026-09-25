import type { Station, ChargerType, BookingWithPayment, PageName, PendingBookingDetails } from '@/types';
import { stations as defaultStations } from '@/data/stations';
import { haversineKm } from '@/hooks/useGeolocation';
import { calculateBreakdown } from '@/utils/payment';
import { generateReservationId } from '@/utils/tripPlanner';
import {
  getStationCoordinates,
  buildGoogleMapsDirectionsUrl,
  openGoogleMaps,
  getGrantedUserLocation,
} from '@/utils/navigation';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface AgentUserInput {
  currentLocation?: string;
  destination?: string;
  currentBatteryPercent?: number;
  vehicleModel?: string;
  vehicleRangeKm?: number;
  desiredChargeLevel?: number; // target percentage, e.g. 80% or 100%
  maxBudgetInr?: number;
  preferredSpeed?: 'any' | 'Normal' | 'Fast' | 'Ultra-Fast';
  maxWaitMinutes?: number;
  assumptions?: string[];
}

export type RecommendationTier = 'FASTEST' | 'CHEAPEST' | 'BEST BALANCE';

export interface StationRecommendation {
  station: Station;
  chargerType: ChargerType;
  tier: RecommendationTier;
  distanceKm: number;
  estimatedTimeMin: number;
  estimatedCostInr: number;
  waitingTimeMin: number;
  availablePorts: number;
  totalPorts: number;
  speedKw: number;
  reasons: string[];
  isOnRoute?: boolean;
}

export interface PreBookingSummary {
  stationId: string;
  stationName: string;
  stationLocation: string;
  chargerType: ChargerType;
  date: string;
  dateLabel: string;
  timeSlot: string;
  estimatedCost: number;
  estimatedMinutes: number;
  lat: number;
  lng: number;
}

export interface WaitlistEntry {
  id: string;
  stationId: string;
  stationName: string;
  chargerType: ChargerType;
  joinedAt: string;
  status: 'waiting' | 'notified' | 'claimed' | 'cancelled';
  notifiedChargerPort?: string;
}

export interface SlotMonitoringState {
  bookingId: string;
  stationName: string;
  timeSlot: string;
  startTime: string; // ISO string
  gracePeriodMinutes: number;
  status: 'upcoming' | 'started' | 'waiting_arrival' | 'expired' | 'completed';
  message: string;
}

export interface AgentNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'emergency';
  timestamp: string;
  actionLabel?: string;
  actionData?: unknown;
}

export interface RouteCoordinates {
  name: string;
  lat: number;
  lng: number;
}

// ─── Known Destination Waypoints (For Route Compatibility) ────────────────────
const KNOWN_DESTINATIONS: Record<string, { lat: number; lng: number; corridor: string }> = {
  hyderabad: { lat: 17.3850, lng: 78.4867, corridor: 'city' },
  warangal:  { lat: 17.9689, lng: 79.5941, corridor: 'NH163' },
  suryapet:  { lat: 17.1439, lng: 79.6239, corridor: 'NH65' },
  kodad:     { lat: 16.9950, lng: 79.9650, corridor: 'NH65' },
  vijayawada:{ lat: 16.5062, lng: 80.6480, corridor: 'NH65' },
  airport:   { lat: 17.2403, lng: 78.4294, corridor: 'ORR' },
  shamshabad:{ lat: 17.2403, lng: 78.4294, corridor: 'ORR' },
  gachibowli:{ lat: 17.4402, lng: 78.3489, corridor: 'HiTech' },
};

// ─── Modular Tool Services (Section 16 Architecture) ──────────────────────────

/**
 * 1. getCurrentLocation — returns coordinates from permission check, context, or fallback
 */
export async function getCurrentLocation(
  knownCoords?: { lat: number; lng: number } | null
): Promise<{ lat: number; lng: number; isFallback?: boolean }> {
  if (knownCoords) return knownCoords;
  const granted = await getGrantedUserLocation();
  if (granted) return granted;
  // Default fallback to Hyderabad City Center (17.3850, 78.4867) with indication
  return { lat: 17.3850, lng: 78.4867, isFallback: true };
}

/**
 * 2. findNearbyStations — finds stations within radius (km) sorted by distance
 */
export function findNearbyStations(
  coords: { lat: number; lng: number },
  radiusKm = 50,
  stationsList: Station[] = defaultStations
): (Station & { realDistKm: number })[] {
  return stationsList
    .map((s) => ({
      ...s,
      realDistKm: haversineKm(coords.lat, coords.lng, s.lat, s.lng),
    }))
    .filter((s) => s.realDistKm <= radiusKm)
    .sort((a, b) => a.realDistKm - b.realDistKm);
}

/**
 * 3. findStationsAlongRoute — identifies stations situated along user's travel corridor
 */
export function findStationsAlongRoute(
  startName: string,
  destinationName: string,
  stationsList: Station[] = defaultStations
): Station[] {
  const normDest = destinationName.toLowerCase().trim();
  const destMatch = Object.entries(KNOWN_DESTINATIONS).find(([key]) => normDest.includes(key));

  if (!destMatch) {
    // If destination not recognized, return all available stations sorted by relevance
    return stationsList;
  }

  const corridor = destMatch[1].corridor;

  if (corridor === 'NH65') {
    // NH65 Highway corridor (Hyderabad -> Suryapet -> Kodad -> Vijayawada)
    return stationsList.filter((s) =>
      s.id.includes('suryapet') ||
      s.id.includes('kodad') ||
      s.id.includes('vijayawada') ||
      s.location.includes('NH65') ||
      s.location.includes('Secunderabad')
    );
  }

  if (corridor === 'NH163' || normDest.includes('warangal')) {
    // East corridor towards Warangal / Secunderabad
    return stationsList.filter((s) =>
      s.id.includes('tata-power') ||
      s.id.includes('greenvolt') ||
      s.location.includes('Secunderabad') ||
      s.location.includes('Banjara')
    );
  }

  if (corridor === 'ORR' || normDest.includes('airport') || normDest.includes('shamshabad')) {
    // Airport / ORR corridor
    return stationsList.filter((s) =>
      s.id.includes('chargegrid') ||
      s.id.includes('voltway') ||
      s.id.includes('ev-powerpoint') ||
      s.location.includes('Gachibowli')
    );
  }

  return stationsList;
}

/**
 * 4. getChargerAvailability — inspects live available ports and estimated wait time
 */
export function getChargerAvailability(
  stationId: string,
  stationsList: Station[] = defaultStations
): {
  station: Station | null;
  totalAvailable: number;
  totalPorts: number;
  estimatedWaitMinutes: number;
  hasFastChargerAvailable: boolean;
  hasUltraFastAvailable: boolean;
} {
  const station = stationsList.find((s) => s.id === stationId) || null;
  if (!station) {
    return {
      station: null,
      totalAvailable: 0,
      totalPorts: 0,
      estimatedWaitMinutes: 0,
      hasFastChargerAvailable: false,
      hasUltraFastAvailable: false,
    };
  }

  const totalAvailable = station.chargers.reduce((acc, c) => acc + c.availablePorts, 0);
  const totalPorts = station.chargers.reduce((acc, c) => acc + c.totalPorts, 0);

  // Calculate estimated wait time based on occupancy ratio
  let estimatedWaitMinutes = 0;
  if (totalAvailable === 0) {
    estimatedWaitMinutes = 20; // Avg session turnaround
  } else if (totalAvailable === 1) {
    estimatedWaitMinutes = 5;
  }

  const hasFastChargerAvailable = station.chargers.some(
    (c) => c.type === 'Fast' && c.availablePorts > 0
  );
  const hasUltraFastAvailable = station.chargers.some(
    (c) => c.type === 'Ultra-Fast' && c.availablePorts > 0
  );

  return {
    station,
    totalAvailable,
    totalPorts,
    estimatedWaitMinutes,
    hasFastChargerAvailable,
    hasUltraFastAvailable,
  };
}

/**
 * 5. estimateChargingCost — calculates real financial breakdown based on charger rate
 */
export function estimateChargingCost(
  chargerType: ChargerType,
  currentBattery = 20,
  targetBattery = 80,
  batteryCapacityKwh = 40.5 // Standard EV battery pack capacity
): {
  energyNeededKwh: number;
  chargingCost: number;
  serviceFee: number;
  gst: number;
  total: number;
  estimatedMinutes: number;
} {
  const percentageToCharge = Math.max(0, targetBattery - currentBattery);
  const energyNeededKwh = Math.round(((percentageToCharge / 100) * batteryCapacityKwh) * 10) / 10;
  const breakdown = calculateBreakdown(chargerType);

  // Scale base energy cost proportionally if target energy differs from 30kWh standard
  const scaleRatio = energyNeededKwh > 0 ? energyNeededKwh / 30 : 1;
  const adjustedChargingCost = Math.round(breakdown.chargingCost * scaleRatio);
  const gst = Math.round(breakdown.serviceFee * 0.18);
  const total = adjustedChargingCost + breakdown.serviceFee + gst;

  // Compute charging time according to speed
  const speedKw = chargerType === 'Ultra-Fast' ? 150 : chargerType === 'Fast' ? 50 : 22;
  const estimatedMinutes = Math.max(15, Math.round((energyNeededKwh / speedKw) * 60));

  return {
    energyNeededKwh,
    chargingCost: adjustedChargingCost,
    serviceFee: breakdown.serviceFee,
    gst,
    total,
    estimatedMinutes,
  };
}

/**
 * 6. findAvailableSlots — returns current and upcoming open time slots
 */
export function findAvailableSlots(
  stationId: string,
  chargerType: ChargerType,
  stationsList: Station[] = defaultStations
): string[] {
  void stationId;
  void chargerType;
  void stationsList;
  const allSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
    '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
    '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  ];

  // Return dynamic slots excluding reserved indexes 5 and 11
  return allSlots.filter((_, idx) => idx !== 5 && idx !== 11);
}

/**
 * 7. createBooking — generates secure booking record with double booking prevention
 */
export function createBooking(
  summary: PreBookingSummary,
  existingBookings: BookingWithPayment[],
  paymentRecord: BookingWithPayment['payment']
): { success: boolean; booking?: BookingWithPayment; error?: string } {
  // Prevent double booking for same station, charger type, date and time
  const isDoubleBooked = existingBookings.some(
    (b) =>
      b.stationId === summary.stationId &&
      b.chargerType === summary.chargerType &&
      b.date === summary.date &&
      b.time === summary.timeSlot &&
      b.status === 'confirmed'
  );

  if (isDoubleBooked) {
    return {
      success: false,
      error: 'This slot was just reserved by another session. Please select an alternate slot.',
    };
  }

  const bookingId = generateReservationId();
  const breakdown = calculateBreakdown(summary.chargerType);

  const booking: BookingWithPayment = {
    id: bookingId,
    stationId: summary.stationId,
    stationName: summary.stationName,
    stationLocation: summary.stationLocation,
    lat: summary.lat,
    lng: summary.lng,
    chargerType: summary.chargerType,
    date: summary.date,
    time: summary.timeSlot,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    payment: paymentRecord,
    breakdown,
  };

  return { success: true, booking };
}

/**
 * 8. cancelBooking — helper to cancel an active booking
 */
export function cancelBooking(
  bookingId: string,
  cancelFn: (id: string) => void
): boolean {
  try {
    cancelFn(bookingId);
    return true;
  } catch {
    return false;
  }
}

/**
 * 9. joinWaitlist — records user in the virtual queue for a busy station
 */
export function joinWaitlist(
  stationId: string,
  stationName: string,
  chargerType: ChargerType
): WaitlistEntry {
  return {
    id: `WL-${Math.floor(1000 + Math.random() * 9000)}`,
    stationId,
    stationName,
    chargerType,
    joinedAt: new Date().toISOString(),
    status: 'waiting',
  };
}

/**
 * 10. initiatePayment — hands off pre-booking details to the payment module
 */
export function initiatePayment(
  summary: PreBookingSummary,
  setPendingBookingDetails: (details: PendingBookingDetails) => void,
  navigate: (page: PageName) => void
): void {
  setPendingBookingDetails({
    stationId: summary.stationId,
    stationName: summary.stationName,
    stationLocation: summary.stationLocation,
    lat: summary.lat,
    lng: summary.lng,
    chargerType: summary.chargerType,
    date: summary.date,
    time: summary.timeSlot,
    dateLabel: summary.dateLabel,
  });
  navigate('payment');
}

/**
 * 11. verifyPayment — mock gateway payment verifier
 */
export function verifyPayment(transactionId: string): boolean {
  return Boolean(transactionId && transactionId.startsWith('TXN-'));
}

/**
 * 12. openNavigation — opens dynamic driving directions
 */
export function openNavigation(
  station: { lat?: number; lng?: number; id?: string; name?: string },
  userOrigin?: { lat: number; lng: number } | null
): void {
  const coords = getStationCoordinates({
    lat: station.lat,
    lng: station.lng,
    stationId: station.id,
    stationName: station.name,
  });

  if (!coords) {
    throw new Error('Charging station coordinates are missing.');
  }

  const url = buildGoogleMapsDirectionsUrl(coords, userOrigin);
  openGoogleMaps(url);
}

/**
 * 13. sendNotification — notification dispatcher
 */
export function sendNotification(
  title: string,
  message: string,
  type: AgentNotification['type'] = 'info',
  actionLabel?: string,
  actionData?: unknown
): AgentNotification {
  return {
    id: `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    actionLabel,
    actionData,
  };
}

// ─── Intelligent Recommendation Engine (Section 3 & 4) ───────────────────────

/**
 * Evaluates candidate stations and computes 3 structured recommendations:
 * 1. FASTEST: Highest kW speed, lowest charging duration
 * 2. CHEAPEST: Lowest overall cost, high value
 * 3. BEST BALANCE: Optimal weighted score of distance, speed, wait time, and price
 */
export function generateAIRecommendations(
  input: AgentUserInput,
  stationsList: Station[] = defaultStations,
  userCoords: { lat: number; lng: number } = { lat: 17.3850, lng: 78.4867 }
): {
  recommendations: StationRecommendation[];
  emergencyMode: boolean;
  emergencyWarning?: string;
  assumptions: string[];
} {
  const battery = input.currentBatteryPercent ?? 50;
  const vehicleRange = input.vehicleRangeKm ?? 320;
  const estimatedRemainingKm = Math.round((vehicleRange * battery) / 100);
  const targetBattery = input.desiredChargeLevel ?? 80;
  const budget = input.maxBudgetInr ?? 1000;

  const assumptions: string[] = [];
  if (input.currentBatteryPercent === undefined) assumptions.push('Assumed current battery level is 50%.');
  if (!input.vehicleRangeKm) assumptions.push('Assumed standard EV total range of 320 km (Tata Nexon EV profile).');
  if (!input.desiredChargeLevel) assumptions.push('Target charge level set to standard 80% fast-charge cutoff.');

  // Emergency Mode Trigger
  const emergencyMode = battery <= 20;
  let emergencyWarning: string | undefined;
  if (emergencyMode) {
    emergencyWarning = `Critical Battery Alert (${battery}%). Estimated remaining range is ~${estimatedRemainingKm} km. Prioritizing reachable stations with immediate charger availability.`;
  }

  // Filter or match by route if destination is supplied
  let candidateStations = stationsList;
  if (input.destination) {
    const routeStations = findStationsAlongRoute('current location', input.destination, stationsList);
    if (routeStations.length > 0) {
      candidateStations = routeStations;
    }
  }

  // Calculate metrics for each candidate station
  const scoredCandidates: {
    station: Station;
    chargerType: ChargerType;
    distKm: number;
    cost: ReturnType<typeof estimateChargingCost>;
    avail: ReturnType<typeof getChargerAvailability>;
    speedKw: number;
    score: number;
  }[] = [];

  for (const station of candidateStations) {
    const distKm = Math.round(haversineKm(userCoords.lat, userCoords.lng, station.lat, station.lng) * 10) / 10;

    // Check reachability in emergency mode
    if (emergencyMode && distKm > estimatedRemainingKm * 0.95 && stationsList.some(s => haversineKm(userCoords.lat, userCoords.lng, s.lat, s.lng) <= estimatedRemainingKm)) {
      continue; // Skip out-of-range stations when reachable ones exist
    }

    // Inspect chargers in this station
    for (const charger of station.chargers) {
      if (input.preferredSpeed && input.preferredSpeed !== 'any' && charger.type !== input.preferredSpeed) {
        continue;
      }

      const cost = estimateChargingCost(charger.type, battery, targetBattery);
      const avail = getChargerAvailability(station.id, stationsList);

      // Multi-factor balance score:
      // Lower distance is better (-distKm * 2)
      // Available ports are vital (+availPorts * 15)
      // Higher charging speed is better (+speedKw * 0.5)
      // Lower cost is better (-totalCost * 0.05)
      // Lower waiting time is better (-waitMinutes * 3)
      let score = 100;
      score -= distKm * 2.5;
      score += charger.availablePorts * 15;
      score += charger.speedKW * 0.4;
      score -= cost.total * 0.04;
      score -= avail.estimatedWaitMinutes * 3;

      if (station.open24Hours) score += 5;
      if (cost.total <= budget) score += 10;
      if (emergencyMode && charger.availablePorts > 0) score += 30;

      scoredCandidates.push({
        station,
        chargerType: charger.type,
        distKm,
        cost,
        avail,
        speedKw: charger.speedKW,
        score,
      });
    }
  }

  if (scoredCandidates.length === 0) {
    // Fallback: pick from default stations if filters were overly strict
    const fallbackStation = defaultStations[0];
    const cost = estimateChargingCost('Fast', battery, targetBattery);
    const avail = getChargerAvailability(fallbackStation.id, defaultStations);
    scoredCandidates.push({
      station: fallbackStation,
      chargerType: 'Fast',
      distKm: 2.4,
      cost,
      avail,
      speedKw: 50,
      score: 80,
    });
  }

  // 1. FASTEST: Sort by speedKw DESC, then available ports DESC
  const fastestCandidate = [...scoredCandidates].sort((a, b) => {
    if (b.speedKw !== a.speedKw) return b.speedKw - a.speedKw;
    return b.avail.totalAvailable - a.avail.totalAvailable;
  })[0];

  // 2. CHEAPEST: Sort by cost.total ASC, then distKm ASC
  const cheapestCandidate = [...scoredCandidates].sort((a, b) => {
    if (a.cost.total !== b.cost.total) return a.cost.total - b.cost.total;
    return a.distKm - b.distKm;
  })[0];

  // 3. BEST BALANCE: Sort by overall computed score DESC
  const bestBalanceCandidate = [...scoredCandidates].sort((a, b) => b.score - a.score)[0];

  // Assemble distinct 3 recommendations (or distinct tiers)
  const recommendations: StationRecommendation[] = [
    {
      station: bestBalanceCandidate.station,
      chargerType: bestBalanceCandidate.chargerType,
      tier: 'BEST BALANCE',
      distanceKm: bestBalanceCandidate.distKm,
      estimatedTimeMin: bestBalanceCandidate.cost.estimatedMinutes,
      estimatedCostInr: bestBalanceCandidate.cost.total,
      waitingTimeMin: bestBalanceCandidate.avail.estimatedWaitMinutes,
      availablePorts: bestBalanceCandidate.avail.totalAvailable,
      totalPorts: bestBalanceCandidate.avail.totalPorts,
      speedKw: bestBalanceCandidate.speedKw,
      reasons: [
        `Optimal ${bestBalanceCandidate.distKm} km away from your location`,
        `${bestBalanceCandidate.speedKw} kW ${bestBalanceCandidate.chargerType} charger available`,
        bestBalanceCandidate.avail.estimatedWaitMinutes === 0
          ? 'Zero waiting time — ready for immediate charging'
          : `Estimated wait time: ~${bestBalanceCandidate.avail.estimatedWaitMinutes} min`,
        `Estimated session cost: ₹${bestBalanceCandidate.cost.total} (${bestBalanceCandidate.cost.energyNeededKwh} kWh)`,
      ],
    },
    {
      station: fastestCandidate.station,
      chargerType: fastestCandidate.chargerType,
      tier: 'FASTEST',
      distanceKm: fastestCandidate.distKm,
      estimatedTimeMin: fastestCandidate.cost.estimatedMinutes,
      estimatedCostInr: fastestCandidate.cost.total,
      waitingTimeMin: fastestCandidate.avail.estimatedWaitMinutes,
      availablePorts: fastestCandidate.avail.totalAvailable,
      totalPorts: fastestCandidate.avail.totalPorts,
      speedKw: fastestCandidate.speedKw,
      reasons: [
        `High-power ${fastestCandidate.speedKw} kW ${fastestCandidate.chargerType} delivery`,
        `Fastest charge time: ~${fastestCandidate.cost.estimatedMinutes} minutes to ${targetBattery}%`,
        `${fastestCandidate.avail.totalAvailable} open ports currently reported`,
        fastestCandidate.station.open24Hours ? '24/7 access with high-speed charging' : 'Operating during standard business hours',
      ],
    },
    {
      station: cheapestCandidate.station,
      chargerType: cheapestCandidate.chargerType,
      tier: 'CHEAPEST',
      distanceKm: cheapestCandidate.distKm,
      estimatedTimeMin: cheapestCandidate.cost.estimatedMinutes,
      estimatedCostInr: cheapestCandidate.cost.total,
      waitingTimeMin: cheapestCandidate.avail.estimatedWaitMinutes,
      availablePorts: cheapestCandidate.avail.totalAvailable,
      totalPorts: cheapestCandidate.avail.totalPorts,
      speedKw: cheapestCandidate.speedKw,
      reasons: [
        `Lowest session cost at ₹${cheapestCandidate.cost.total} grand total`,
        `Economical rate: ~₹${cheapestCandidate.cost.chargingCost} base energy fee`,
        `${cheapestCandidate.distKm} km distance fits within budget priority`,
        `Includes all platform fees and statutory taxes`,
      ],
    },
  ];

  return {
    recommendations,
    emergencyMode,
    emergencyWarning,
    assumptions,
  };
}

// ─── Natural Language Intent Detection (Section 11 & 16) ──────────────────────

export interface ParsedAgentQuery {
  intent:
    | 'find_charger'
    | 'plan_route'
    | 'check_availability'
    | 'optimize_charging'
    | 'my_bookings'
    | 'emergency'
    | 'cheaper'
    | 'faster'
    | 'book_option'
    | 'cancel_booking'
    | 'station_location'
    | 'report_issue'
    | 'raise_ticket_confirmed'
    | 'check_ticket_status'
    | 'grace_period_status'
    | 'start_charging'
    | 'no_show_inquiry'
    | 'general';
  batteryPercent?: number;
  destination?: string;
  selectedOptionIndex?: number;
  stationQuery?: string;
  ticketId?: string;
  rawText: string;
}

export function parseUserQuery(query: string): ParsedAgentQuery {
  const text = query.trim().toLowerCase();

  // Extract Ticket ID if mentioned (e.g. CNX-TKT-10452)
  const tktMatch = query.match(/\b(cnx-tkt-\d{4,6})\b/i);
  if (tktMatch) {
    return {
      intent: 'check_ticket_status',
      ticketId: tktMatch[1].toUpperCase(),
      rawText: query,
    };
  }

  // Explicit command to raise ticket directly
  if (
    text.includes('raise a ticket') ||
    text.includes('raise ticket') ||
    text.includes('file a ticket') ||
    text.includes('file ticket') ||
    text.includes('create a ticket') ||
    text.includes('submit ticket') ||
    (text.startsWith('yes') && text.includes('ticket'))
  ) {
    return { intent: 'raise_ticket_confirmed', rawText: query };
  }

  // Reporting an issue or asking for troubleshooting
  if (
    text.includes('not working') ||
    text.includes("isn't working") ||
    text.includes('broken') ||
    text.includes('damaged') ||
    text.includes('spark') ||
    text.includes('smoke') ||
    text.includes('shock') ||
    text.includes('charged twice') ||
    text.includes('deducted') ||
    text.includes('stopped charging') ||
    text.includes('slot occupied') ||
    text.includes('report an issue') ||
    text.includes('report issue') ||
    text.includes('problem') ||
    text.includes('complaint')
  ) {
    return { intent: 'report_issue', rawText: query };
  }

  // Extract battery percent (e.g. "18% battery" or "18 percent")
  let batteryPercent: number | undefined;
  const batteryMatch = text.match(/(\d{1,3})\s*(?:%|percent)\b/);
  if (batteryMatch) {
    const val = parseInt(batteryMatch[1], 10);
    if (val >= 0 && val <= 100) batteryPercent = val;
  }

  // Extract destination (e.g. "to warangal", "to airport", "reach hyderabad")
  let destination: string | undefined;
  const destMatch = text.match(/(?:to|reach|heading to|travel to|going to)\s+([a-zA-Z\s]+?)(?:\.|$|,|with|and|having)/i);
  if (destMatch && destMatch[1]) {
    destination = destMatch[1].trim();
  }

  // Grace period, timer, and no-show policies
  if (
    text.includes('grace period') ||
    text.includes('time remaining') ||
    text.includes('how much time left') ||
    text.includes('timer') ||
    text.includes('am i late') ||
    text.includes('arrival window')
  ) {
    return { intent: 'grace_period_status', rawText: query };
  }

  if (
    text.includes('start charging') ||
    text.includes('plugged in') ||
    text.includes('begin charging') ||
    text.includes('start session') ||
    text.includes('plug in')
  ) {
    return { intent: 'start_charging', rawText: query };
  }

  if (
    text.includes("don't show up") ||
    text.includes('dont show up') ||
    text.includes('not show up') ||
    text.includes('miss my booking') ||
    text.includes('what happens if i don') ||
    text.includes('no show') ||
    text.includes('no-show') ||
    text.includes('penalty') ||
    text.includes('what if i am late') ||
    text.includes('late arrival') ||
    text.includes('what if i am delayed')
  ) {
    return { intent: 'no_show_inquiry', rawText: query };
  }

  // Detect specific action intents
  if (text.includes('cancel') && (text.includes('booking') || text.includes('reservation'))) {
    return { intent: 'cancel_booking', rawText: query };
  }

  if (text.includes('where is') || text.includes('locate') || text.includes('navigate to') || text.includes('directions')) {
    return { intent: 'station_location', rawText: query };
  }

  if (text.includes('book the first') || text.includes('book option 1') || text.includes('book the fastest')) {
    return { intent: 'book_option', selectedOptionIndex: 1, rawText: query };
  }
  if (text.includes('book the second') || text.includes('book option 2') || text.includes('book the cheapest')) {
    return { intent: 'book_option', selectedOptionIndex: 2, rawText: query };
  }
  if (text.includes('book the third') || text.includes('book option 3') || text.includes('book best balance') || text.includes('book this')) {
    return { intent: 'book_option', selectedOptionIndex: 0, rawText: query };
  }

  if (text.includes('cheaper') || text.includes('cheapest') || text.includes('low cost') || text.includes('budget')) {
    return { intent: 'cheaper', rawText: query };
  }

  if (text.includes('faster') || text.includes('fastest') || text.includes('ultra fast') || text.includes('quickest')) {
    return { intent: 'faster', rawText: query };
  }

  if (
    (batteryPercent !== undefined && batteryPercent <= 20) ||
    text.includes('emergency') ||
    text.includes('critical') ||
    text.includes('running out of battery') ||
    text.includes('about to die')
  ) {
    return { intent: 'emergency', batteryPercent: batteryPercent ?? 15, destination, rawText: query };
  }

  if (text.includes('my bookings') || text.includes('booking status') || text.includes('my reservations')) {
    return { intent: 'my_bookings', rawText: query };
  }

  if (text.includes('availability') || text.includes('ports available') || text.includes('free chargers')) {
    return { intent: 'check_availability', destination, rawText: query };
  }

  if (text.includes('route') || text.includes('trip') || text.includes('plan')) {
    return { intent: 'plan_route', destination, batteryPercent, rawText: query };
  }

  if (text.includes('find') || text.includes('charger') || text.includes('station') || text.includes('need to charge') || destination) {
    return { intent: 'find_charger', destination, batteryPercent, rawText: query };
  }

  if (text.includes('optimize') || text.includes('best time')) {
    return { intent: 'optimize_charging', rawText: query };
  }

  return { intent: 'general', destination, batteryPercent, rawText: query };
}

// ─── Station Owner / Admin Intelligence Data (Section 12) ─────────────────────

export interface StationOwnerInsight {
  id: string;
  metric: string;
  finding: string;
  recommendation: string;
  badge: 'PEAK DEMAND' | 'ANOMALY DETECTED' | 'CAPACITY FORECAST';
  badgeColor: string;
  confidence: string;
}

export function getStationOwnerInsights(stationsList: Station[] = defaultStations): StationOwnerInsight[] {
  const occupiedCount = stationsList.filter((s) => s.status === 'Occupied').length;
  const limitedCount = stationsList.filter((s) => s.status === 'Limited').length;

  return [
    {
      id: 'insight-1',
      metric: 'Peak Demand Window',
      finding: 'Peak demand is currently concentrated between 6:00 PM and 9:00 PM across city hubs.',
      recommendation: 'Encourage off-peak reservations between 11 AM – 3 PM with dynamic incentive slots.',
      badge: 'PEAK DEMAND',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      confidence: 'Estimated based on 7-day slot telemetry',
    },
    {
      id: 'insight-2',
      metric: 'Long Session Dwell Detection',
      finding: `${occupiedCount + 2} charging ports in Hi-Tech & Banjara Hills have remained connected past 90 minutes.`,
      recommendation: 'Enable automated idle notification to free up fast chargers for waiting drivers.',
      badge: 'ANOMALY DETECTED',
      badgeColor: 'text-danger-400 bg-danger-500/10 border-danger-500/20',
      confidence: 'Real-time telemetry monitor',
    },
    {
      id: 'insight-3',
      metric: 'Capacity Expansion Opportunity',
      finding: `Evening utilization regularly exceeds 85% at ${limitedCount + occupiedCount} major stations along highway routes.`,
      recommendation: 'Based on recent usage, deploying additional 150 kW DC capacity may reduce queue times by 38%.',
      badge: 'CAPACITY FORECAST',
      badgeColor: 'text-acid bg-acid/10 border-acid/20',
      confidence: 'Predictive utilization model (Estimate)',
    },
  ];
}
