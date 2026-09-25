import type { Reservation, User, BookingWithPayment } from '@/types';

const RESERVATIONS_KEY = 'chargenix_reservations';
const USER_KEY = 'chargenix_user';
const RECENT_STATION_KEY = 'chargenix_recent_station';
const RECENT_TRIP_KEY = 'chargenix_recent_trip';
const BOOKINGS_KEY = 'chargenix_bookings'; // paid bookings with payment info

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

import type { GracePeriodConfig, BookingStatus } from '@/types';
import type { NoShowAuditRecord } from '@/services/gracePeriodService';
import { DEFAULT_GRACE_PERIOD_MINUTES, DEFAULT_NO_SHOW_POLICY } from '@/services/gracePeriodService';

const GRACE_CONFIG_KEY = 'chargenix_grace_config';
const NOSHOW_AUDIT_KEY = 'chargenix_noshow_audits';

export function getGracePeriodConfig(): GracePeriodConfig {
  try {
    const raw = localStorage.getItem(GRACE_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    gracePeriodMinutes: DEFAULT_GRACE_PERIOD_MINUTES,
    noShowPolicy: DEFAULT_NO_SHOW_POLICY,
    lastUpdated: new Date().toISOString(),
  };
}

export function saveGracePeriodConfig(config: GracePeriodConfig): void {
  localStorage.setItem(GRACE_CONFIG_KEY, JSON.stringify(config));
}

export function getNoShowAuditRecords(): NoShowAuditRecord[] {
  try {
    const raw = localStorage.getItem(NOSHOW_AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNoShowAuditRecord(record: NoShowAuditRecord): void {
  const all = getNoShowAuditRecords();
  localStorage.setItem(NOSHOW_AUDIT_KEY, JSON.stringify([record, ...all.filter((r) => r.id !== record.id)].slice(0, 100)));
}

// ── Paid Bookings (with payment info) ───────────────────────────────────────
// NOTE: Only safe, non-sensitive data is stored.
// Raw card numbers and CVVs are NEVER written to localStorage.

const INITIAL_DEMO_BOOKINGS: BookingWithPayment[] = [
  {
    id: 'CNX1024',
    stationId: 'abc-ev-hub',
    stationName: 'ABC EV Charging Hub',
    stationLocation: 'Hitec City, Hyderabad',
    lat: 17.4483,
    lng: 78.3915,
    chargerType: 'Ultra-Fast',
    chargerNumber: 'CNX-02',
    date: new Date().toISOString().split('T')[0],
    time: '06:00 PM – 06:45 PM',
    startTime: '6:00 PM',
    endTime: '6:45 PM',
    slotStartTimestamp: Date.now() - 10 * 60 * 1000,
    slotEndTimestamp: Date.now() + 35 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now(),
    chargingStartedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'CHARGING',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userName: 'Rohit Sharma',
    userEmail: 'rohit.sharma@example.com',
    payment: {
      transactionId: 'CNX-CTR-1024',
      method: 'PAY_AT_COUNTER',
      methodDetail: 'Cash / Station Counter Terminal',
      amount: 300,
      status: 'pending',
      paidAt: '',
    },
    breakdown: {
      chargingCost: 260,
      serviceFee: 33.9,
      gst: 6.1,
      total: 300,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: ['notifiedGraceStarted', 'notifiedChargingStarted'],
  },
  {
    id: 'CNX1028',
    stationId: 'abc-ev-hub',
    stationName: 'ABC EV Charging Hub',
    stationLocation: 'Hitec City, Hyderabad',
    lat: 17.4483,
    lng: 78.3915,
    chargerType: 'Fast',
    chargerNumber: 'CNX-11',
    date: new Date().toISOString().split('T')[0],
    time: '06:00 PM – 06:45 PM',
    startTime: '6:00 PM',
    endTime: '6:45 PM',
    slotStartTimestamp: Date.now() - 2 * 60 * 1000,
    slotEndTimestamp: Date.now() + 43 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() + 8 * 60 * 1000,
    status: 'GRACE_PERIOD',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    userName: 'Karthik S',
    userEmail: 'karthik.s@example.com',
    payment: {
      transactionId: 'CNX-CTR-1028',
      method: 'PAY_AT_COUNTER',
      methodDetail: 'Pay at Station Reception',
      amount: 450,
      status: 'pending',
      paidAt: '',
    },
    breakdown: {
      chargingCost: 400,
      serviceFee: 42.37,
      gst: 7.63,
      total: 450,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: ['notifiedGraceStarted'],
  },
  {
    id: 'CNX1031',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    stationLocation: 'MGIT Campus, Gandipet, Hyderabad, Telangana',
    lat: 17.3888,
    lng: 78.3172,
    chargerType: 'Fast',
    chargerNumber: 'MGIT-C2',
    date: new Date().toISOString().split('T')[0],
    time: '07:00 PM – 07:45 PM',
    startTime: '7:00 PM',
    endTime: '7:45 PM',
    slotStartTimestamp: Date.now() + 50 * 60 * 1000,
    slotEndTimestamp: Date.now() + 95 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() + 60 * 60 * 1000,
    status: 'RESERVED',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    userName: 'Ananya Mehta',
    userEmail: 'ananya.m@example.com',
    payment: {
      transactionId: 'CNX-CTR-1031',
      method: 'PAY_AT_COUNTER',
      methodDetail: 'Pay at Attendant Kiosk',
      amount: 450,
      status: 'pending',
      paidAt: '',
    },
    breakdown: {
      chargingCost: 400,
      serviceFee: 42.37,
      gst: 7.63,
      total: 450,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: [],
  },
  // ── CANONICAL MGIT DEMO BOOKINGS ────────────────────────────────────────────
  // CN1024 – Arjun, Charger 3 (AC 22kW), RESERVED, PAID
  {
    id: 'CN1024',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    stationLocation: 'MGIT Campus, Gandipet, Hyderabad, Telangana',
    lat: 17.3888,
    lng: 78.3172,
    chargerType: 'Normal',
    chargerNumber: 'Charger 3',
    date: new Date().toISOString().split('T')[0],
    time: '10:30 AM – 11:15 AM',
    startTime: '10:30 AM',
    endTime: '11:15 AM',
    slotStartTimestamp: Date.now() + 30 * 60 * 1000,
    slotEndTimestamp: Date.now() + 75 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() + 40 * 60 * 1000,
    status: 'RESERVED',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    userName: 'Arjun',
    userEmail: 'arjun@example.com',
    userId: 'usr-arjun',
    payment: {
      transactionId: 'TXN-UPI-CN1024',
      method: 'upi',
      methodDetail: 'arjun@okhdfc',
      amount: 320,
      status: 'success',
      paidAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    breakdown: {
      chargingCost: 284,
      serviceFee: 30.51,
      gst: 5.49,
      total: 320,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: [],
  },
  // CN1025 – Priya, Charger 2 (DC Fast 60kW), CHARGING, PAID
  {
    id: 'CN1025',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    stationLocation: 'MGIT Campus, Gandipet, Hyderabad, Telangana',
    lat: 17.3888,
    lng: 78.3172,
    chargerType: 'Fast',
    chargerNumber: 'Charger 2',
    date: new Date().toISOString().split('T')[0],
    time: '9:45 AM – 10:30 AM',
    startTime: '9:45 AM',
    endTime: '10:30 AM',
    slotStartTimestamp: Date.now() - 18 * 60 * 1000,
    slotEndTimestamp: Date.now() + 27 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() - 8 * 60 * 1000,
    chargingStartedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    status: 'CHARGING',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userName: 'Priya',
    userEmail: 'priya@example.com',
    userId: 'usr-priya',
    payment: {
      transactionId: 'TXN-CARD-CN1025',
      method: 'card',
      methodDetail: 'Visa •••• 5678',
      amount: 480,
      status: 'success',
      paidAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    breakdown: {
      chargingCost: 428,
      serviceFee: 43.22,
      gst: 7.78,
      total: 480,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: ['notifiedGraceStarted', 'notifiedChargingStarted'],
  },
  // CN1026 – Rahul, Charger 1 (DC Fast 60kW), RESERVED, PAY AT STATION
  {
    id: 'CN1026',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    stationLocation: 'MGIT Campus, Gandipet, Hyderabad, Telangana',
    lat: 17.3888,
    lng: 78.3172,
    chargerType: 'Fast',
    chargerNumber: 'Charger 1',
    date: new Date().toISOString().split('T')[0],
    time: '11:30 AM – 12:15 PM',
    startTime: '11:30 AM',
    endTime: '12:15 PM',
    slotStartTimestamp: Date.now() + 90 * 60 * 1000,
    slotEndTimestamp: Date.now() + 135 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() + 100 * 60 * 1000,
    status: 'RESERVED',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    userName: 'Rahul',
    userEmail: 'rahul@example.com',
    userId: 'usr-rahul',
    payment: {
      transactionId: 'CNX-PAS-CN1026',
      method: 'PAY_AT_STATION',
      methodDetail: 'Pay at Charging Station',
      amount: 420,
      status: 'PENDING',
      paidAt: '',
    },
    breakdown: {
      chargingCost: 374,
      serviceFee: 38.14,
      gst: 7.86,
      total: 420,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: [],
  },
  // CN1019 – Kiran, NO_SHOW demo (Charger 1), REFUNDED
  {
    id: 'CN1019',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    stationLocation: 'MGIT Campus, Gandipet, Hyderabad, Telangana',
    lat: 17.3888,
    lng: 78.3172,
    chargerType: 'Fast',
    chargerNumber: 'Charger 1',
    date: new Date().toISOString().split('T')[0],
    time: '8:00 AM – 8:45 AM',
    startTime: '8:00 AM',
    endTime: '8:45 AM',
    slotStartTimestamp: Date.now() - 3 * 3600 * 1000,
    slotEndTimestamp: Date.now() - 3 * 3600 * 1000 + 45 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() - 3 * 3600 * 1000 + 10 * 60 * 1000,
    noShowAt: new Date(Date.now() - 3 * 3600 * 1000 + 10 * 60 * 1000).toISOString(),
    status: 'NO_SHOW',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    userName: 'Kiran',
    userEmail: 'kiran@example.com',
    userId: 'usr-kiran',
    originalPaymentAmount: 300,
    noShowCharge: 30,
    refundAmount: 270,
    refundStatus: 'REFUNDED',
    refundReason: 'Booking not started within grace period (10% no-show charge deducted)',
    refundProcessedAt: new Date(Date.now() - 3 * 3600 * 1000 + 11 * 60 * 1000).toISOString(),
    payment: {
      transactionId: 'TXN-UPI-CN1019',
      method: 'upi',
      methodDetail: 'kiran@ybl',
      amount: 300,
      status: 'refunded',
      paidAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      refundStatus: 'REFUNDED',
    },
    breakdown: {
      chargingCost: 265,
      serviceFee: 29.66,
      gst: 5.34,
      total: 300,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: ['notifiedGraceStarted', 'notified5MinWarning', 'notifiedNoShow'],
  },
  // CN1015 – Past cancellation (for refund demo)
  {
    id: 'CN1015',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    stationLocation: 'MGIT Campus, Gandipet, Hyderabad, Telangana',
    lat: 17.3888,
    lng: 78.3172,
    chargerType: 'Normal',
    chargerNumber: 'Charger 3',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '2:00 PM – 2:45 PM',
    startTime: '2:00 PM',
    endTime: '2:45 PM',
    slotStartTimestamp: Date.now() - 86400000 - 2 * 3600 * 1000,
    slotEndTimestamp: Date.now() - 86400000 - 2 * 3600 * 1000 + 45 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() - 86400000 - 2 * 3600 * 1000 + 10 * 60 * 1000,
    cancelledAt: new Date(Date.now() - 86400000 - 3 * 3600 * 1000).toISOString(),
    status: 'CANCELLED',
    createdAt: new Date(Date.now() - 86400000 - 4 * 3600 * 1000).toISOString(),
    userName: 'Suresh',
    userEmail: 'suresh@example.com',
    userId: 'usr-suresh',
    originalPaymentAmount: 500,
    noShowCharge: 50,
    refundAmount: 450,
    refundStatus: 'REFUND_PROCESSING',
    refundReason: 'User cancelled booking prior to slot (10% cancellation fee applied)',
    payment: {
      transactionId: 'TXN-CARD-CN1015',
      method: 'card',
      methodDetail: 'Mastercard •••• 3344',
      amount: 500,
      status: 'refunded',
      paidAt: new Date(Date.now() - 86400000 - 4 * 3600 * 1000).toISOString(),
      refundStatus: 'REFUND_PROCESSING',
    },
    breakdown: {
      chargingCost: 447,
      serviceFee: 45.25,
      gst: 7.75,
      total: 500,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: [],
  },
  {
    id: 'CNX-BK-9801',
    stationId: 'st-01',
    stationName: 'Madhapur Tech Park Superchargers',
    stationLocation: 'Hitec City, Hyderabad',
    lat: 17.4483,
    lng: 78.3915,
    chargerType: 'Fast',
    chargerNumber: 'DC Fast Charger 2',
    date: new Date().toISOString().split('T')[0],
    time: 'Live Active Slot',
    startTime: new Date(Date.now() - 2 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    endTime: new Date(Date.now() + 43 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    slotStartTimestamp: Date.now() - 2 * 60 * 1000,
    slotEndTimestamp: Date.now() + 43 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() + 8 * 60 * 1000,
    status: 'GRACE_PERIOD',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    userName: 'EV Traveler',
    userEmail: 'traveler@chargenix.io',
    payment: {
      transactionId: 'TXN-UPI-77491',
      method: 'upi',
      methodDetail: 'driver@okaxis',
      amount: 420,
      status: 'success',
      paidAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    breakdown: {
      chargingCost: 380,
      serviceFee: 33.9,
      gst: 6.1,
      total: 420,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: ['notifiedGraceStarted'],
  },
  {
    id: 'CNX-BK-9802',
    stationId: 'st-02',
    stationName: 'Gachibowli Green Energy Station',
    stationLocation: 'Financial District, Hyderabad',
    lat: 17.4401,
    lng: 78.3489,
    chargerType: 'Ultra-Fast',
    chargerNumber: 'Ultra-Fast Charger 1',
    date: new Date().toISOString().split('T')[0],
    time: '06:00 PM – 06:45 PM',
    startTime: '6:00 PM',
    endTime: '6:45 PM',
    slotStartTimestamp: Date.now() + 60 * 60 * 1000,
    slotEndTimestamp: Date.now() + 105 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() + 70 * 60 * 1000,
    status: 'RESERVED',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    payment: {
      transactionId: 'TXN-CARD-11942',
      method: 'card',
      methodDetail: 'Visa •••• 4242',
      amount: 580,
      status: 'success',
      paidAt: new Date(Date.now() - 3600000).toISOString(),
    },
    breakdown: {
      chargingCost: 520,
      serviceFee: 50.85,
      gst: 9.15,
      total: 580,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: [],
  },
  {
    id: 'CNX-BK-9755',
    stationId: 'st-03',
    stationName: 'Begumpet Rapid Charging',
    stationLocation: 'Airport Road, Begumpet, Hyderabad',
    lat: 17.4435,
    lng: 78.4682,
    chargerType: 'Fast',
    chargerNumber: 'Fast Charger 1',
    date: new Date().toISOString().split('T')[0],
    time: '04:15 PM – 05:00 PM',
    startTime: '4:15 PM',
    endTime: '5:00 PM',
    slotStartTimestamp: Date.now() - 20 * 60 * 1000,
    slotEndTimestamp: Date.now() + 25 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() - 10 * 60 * 1000,
    chargingStartedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'CHARGING',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    payment: {
      transactionId: 'TXN-UPI-48192',
      method: 'upi',
      methodDetail: 'user@paytm',
      amount: 350,
      status: 'success',
      paidAt: new Date(Date.now() - 7200000).toISOString(),
    },
    breakdown: {
      chargingCost: 310,
      serviceFee: 33.9,
      gst: 6.1,
      total: 350,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: ['notifiedGraceStarted', 'notifiedChargingStarted'],
  },
  {
    id: 'CNX-BK-9640',
    stationId: 'st-05',
    stationName: 'Banjara Hills EV Plaza',
    stationLocation: 'Road No. 12, Banjara Hills, Hyderabad',
    lat: 17.4156,
    lng: 78.4352,
    chargerType: 'Fast',
    chargerNumber: 'Charger 3',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '11:00 AM – 11:45 AM',
    startTime: '11:00 AM',
    endTime: '11:45 AM',
    slotStartTimestamp: Date.now() - 86400000,
    slotEndTimestamp: Date.now() - 86400000 + 45 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() - 86400000 + 10 * 60 * 1000,
    noShowAt: new Date(Date.now() - 86400000 + 10 * 60 * 1000).toISOString(),
    status: 'NO_SHOW',
    createdAt: new Date(Date.now() - 90000000).toISOString(),
    payment: {
      transactionId: 'TXN-UPI-33190',
      method: 'upi',
      methodDetail: 'user@okhdfc',
      amount: 390,
      status: 'success',
      paidAt: new Date(Date.now() - 90000000).toISOString(),
    },
    breakdown: {
      chargingCost: 350,
      serviceFee: 33.9,
      gst: 6.1,
      total: 390,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: ['notifiedGraceStarted', 'notified5MinWarning', 'notifiedNoShow'],
  },
  {
    id: 'CNX-BK-9510',
    stationId: 'st-04',
    stationName: 'Highway Oasis Charging Hub',
    stationLocation: 'NH 65, Suryapet',
    lat: 17.1439,
    lng: 79.6239,
    chargerType: 'Ultra-Fast',
    chargerNumber: 'Gun A',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    time: '02:00 PM – 02:45 PM',
    startTime: '2:00 PM',
    endTime: '2:45 PM',
    slotStartTimestamp: Date.now() - 86400000 * 2,
    slotEndTimestamp: Date.now() - 86400000 * 2 + 45 * 60 * 1000,
    gracePeriodMinutes: 10,
    gracePeriodEndTimestamp: Date.now() - 86400000 * 2 + 10 * 60 * 1000,
    chargingStartedAt: new Date(Date.now() - 86400000 * 2 + 5 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000 * 2 - 3600000).toISOString(),
    payment: {
      transactionId: 'TXN-CARD-99214',
      method: 'card',
      methodDetail: 'Mastercard •••• 8821',
      amount: 620,
      status: 'success',
      paidAt: new Date(Date.now() - 86400000 * 2 - 3600000).toISOString(),
    },
    breakdown: {
      chargingCost: 560,
      serviceFee: 50.85,
      gst: 9.15,
      total: 620,
      currency: 'INR',
      estimatedMinutes: 45,
    },
    notificationHistory: ['notifiedGraceStarted', 'notifiedChargingStarted'],
  },
];

export function getBookings(): BookingWithPayment[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(INITIAL_DEMO_BOOKINGS));
      return INITIAL_DEMO_BOOKINGS;
    }
    const parsed = JSON.parse(raw) as BookingWithPayment[];
    return parsed.length > 0 ? parsed : INITIAL_DEMO_BOOKINGS;
  } catch {
    return INITIAL_DEMO_BOOKINGS;
  }
}

export function saveBooking(booking: BookingWithPayment): void {
  const all = getBookings();
  // Remove duplicates (same booking ID) then prepend
  const updated = [booking, ...all.filter((b) => b.id !== booking.id)].slice(0, 50);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
}

export function updateBooking(booking: BookingWithPayment): void {
  const all = getBookings();
  const updated = all.map((b) => (b.id === booking.id ? booking : b));
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  extra?: Partial<BookingWithPayment>
): BookingWithPayment | null {
  const all = getBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;

  const current = all[idx];
  const updatedItem: BookingWithPayment = {
    ...current,
    status,
    ...extra,
  };
  all[idx] = updatedItem;
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
  return updatedItem;
}

export function cancelBooking(bookingId: string): BookingWithPayment | null {
  const all = getBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;

  const current = all[idx];
  const isPayAtStation =
    current.payment.method === 'PAY_AT_STATION' ||
    current.payment.method === 'PAY_AT_COUNTER' ||
    current.payment.method === 'counter';

  const updated = [...all];
  if (isPayAtStation) {
    updated[idx] = {
      ...current,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      refundStatus: 'NOT_APPLICABLE',
      payment: {
        ...current.payment,
        status: 'NOT_PAID',
        refundStatus: 'not_applicable',
      },
    };
  } else {
    // Online payment: full refund (or configured policy)
    const originalAmount = current.payment.amount || 300;
    const refundAmount = originalAmount;
    const now = new Date().toISOString();
    updated[idx] = {
      ...current,
      status: 'CANCELLED',
      cancelledAt: now,
      originalPaymentAmount: originalAmount,
      noShowCharge: 0,
      refundAmount: refundAmount,
      refundStatus: 'REFUNDED',
      refundReason: 'User cancelled booking prior to charging session',
      refundProcessedAt: now,
      payment: {
        ...current.payment,
        status: 'refunded',
        refundStatus: 'REFUNDED',
      },
    };

    // Save to refund records so Station Owner and EV user can track
    saveRefundRecord({
      id: `RFND-${Date.now()}-${current.id.slice(-4)}`,
      bookingId: current.id,
      stationId: current.stationId,
      stationName: current.stationName,
      userName: current.userName || 'EV Driver',
      userEmail: current.userEmail || 'user@example.com',
      originalAmount: originalAmount,
      noShowCharge: 0,
      refundAmount: refundAmount,
      amount: refundAmount,
      reason: 'User cancelled booking prior to charging session',
      status: 'REFUNDED',
      createdAt: now,
      processedAt: now,
      txnRef: `TXN-RFND-${Date.now().toString().slice(-6)}`,
    });
  }

  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  return updated[idx];
}

// ── Support Tickets & Issues ───────────────────────────────────────────────
import type { SupportTicket, TicketMessage } from '@/types';

const TICKETS_KEY = 'chargenix_tickets';

const INITIAL_DEMO_TICKETS: SupportTicket[] = [
  {
    id: 'CNX-TKT-10452',
    userId: 'usr-default',
    userName: 'EV Traveler',
    userEmail: 'traveler@chargenix.io',
    category: 'charging_station',
    subcategory: 'Charger not working',
    subject: 'Charger 2 at Madhapur Hub fails to initiate charging session',
    description: "I booked charger 2, but when I arrived the charger wasn't working. It gave an RFID handshake timeout error.",
    stationId: 'st-01',
    stationName: 'Madhapur Tech Park Superchargers',
    stationLocation: 'Hitec City, Hyderabad',
    chargerNumber: 'Charger 2',
    chargerType: 'Fast',
    bookingId: 'CNX-20481',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    department: 'Station Operations',
    assignedTo: 'Rajesh K. (Field Tech)',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    slaHours: 4,
    slaTargetTime: new Date(Date.now() + 3600000 * 1).toISOString(),
    isSlaAtRisk: false,
    isEscalated: false,
    suggestedFirstAction: 'Inspect Charger 2 DC isolation contactors and reboot station gateway firmware.',
    aiClassificationExplanation: 'Classified as High Priority Charging Station issue. Automated routing to Station Operations due to live hardware handshake disruption.',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        senderName: 'EV Traveler',
        message: "I booked charger 2, but when I arrived the charger wasn't working. It gave an RFID handshake timeout error.",
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'msg-2',
        sender: 'support',
        senderName: 'Station Operations',
        message: 'Hello! We acknowledge your report. Our field technician Rajesh K. has been dispatched to inspect the CCS2 cable and power inverter.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'msg-3',
        sender: 'support',
        senderName: 'Rajesh K. (Field Tech)',
        message: 'On-site now. Running telemetry diagnostics on port 2 relay.',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'CNX-TKT-10389',
    userId: 'usr-default',
    userName: 'EV Traveler',
    userEmail: 'traveler@chargenix.io',
    category: 'payment',
    subcategory: 'Payment deducted but charging did not start',
    subject: '₹220 deducted via UPI but session failed to initiate',
    description: 'Payment was debited from my bank account via UPI, but the dispenser timed out and did not start dispensing power.',
    stationId: 'st-02',
    stationName: 'Gachibowli Green Energy Station',
    stationLocation: 'Financial District, Hyderabad',
    chargerNumber: 'Charger 1',
    chargerType: 'Fast',
    transactionId: 'TXN-UPI-99214',
    priority: 'HIGH',
    status: 'RESOLVED',
    department: 'Payment Support',
    assignedTo: 'Priya Sharma (Finance Ops)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    slaHours: 4,
    slaTargetTime: new Date(Date.now() - 86400000 * 2 + 14400000).toISOString(),
    isSlaAtRisk: false,
    isEscalated: false,
    resolutionRating: 5,
    resolutionFeedback: 'Fast reversal of funds! Excellent support.',
    suggestedFirstAction: 'Reconcile gateway settlement log with bank RRN and reverse unsettled capture.',
    aiClassificationExplanation: 'Classified as Payment issue. Routed directly to Payment Support with transaction reference TXN-UPI-99214.',
    messages: [
      {
        id: 'msg-p1',
        sender: 'user',
        senderName: 'EV Traveler',
        message: 'Payment was debited from my bank account via UPI, but the dispenser timed out and did not start dispensing power.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'msg-p2',
        sender: 'support',
        senderName: 'Priya Sharma (Finance Ops)',
        message: 'We verified the failed capture on our gateway ledger. An automatic full refund of ₹220 has been processed back to your UPI VPA.',
        timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      },
    ],
  },
  {
    id: 'CNX-TKT-10214',
    userId: 'usr-default',
    userName: 'EV Traveler',
    userEmail: 'traveler@chargenix.io',
    category: 'charging_station',
    subcategory: 'Damaged connector/cable',
    subject: 'Safety concern: Exposed inner sleeve on CCS2 connector cable',
    description: 'The heavy black rubber insulation near the connector handle is deeply cracked with wire sheath visible. Potential shock risk!',
    stationId: 'st-04',
    stationName: 'Highway Oasis Charging Hub',
    stationLocation: 'NH 65, Suryapet',
    chargerNumber: 'Gun B',
    chargerType: 'Ultra-Fast',
    priority: 'CRITICAL',
    status: 'ESCALATED',
    department: 'Station Operations',
    assignedTo: 'Emergency Grid Response Team',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    slaHours: 1,
    slaTargetTime: new Date(Date.now() - 3600000).toISOString(),
    isSlaAtRisk: true,
    isEscalated: true,
    isSafetyConcern: true,
    suggestedFirstAction: 'Remotely trip port breaker, disable Gun B in app, and display out-of-order signage.',
    aiClassificationExplanation: 'CRITICAL SAFETY HAZARD detected from description ("shock risk", "exposed wire sheath"). Immediate escalation and automatic hardware shutdown protocol requested.',
    messages: [
      {
        id: 'msg-s1',
        sender: 'user',
        senderName: 'EV Traveler',
        message: 'The heavy black rubber insulation near the connector handle is deeply cracked with wire sheath visible. Potential shock risk!',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'msg-s2',
        sender: 'ai_system',
        senderName: 'ChargeNix Safety Bot',
        message: '⚠️ CRITICAL SAFETY NOTICE: Please step back from the damaged cable immediately and do not attempt to plug it into your vehicle. Gun B has been remotely locked out.',
        timestamp: new Date(Date.now() - 7100000).toISOString(),
      },
      {
        id: 'msg-s3',
        sender: 'support',
        senderName: 'Station Operations',
        message: 'Emergency service crew dispatched with replacement gun harness. Target arrival 25 mins.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
  // ── MGIT STATION CANONICAL SUPPORT TICKETS ──────────────────────────────────
  {
    id: 'TCK102',
    userId: 'usr-mgit-user',
    userName: 'Campus EV Driver',
    userEmail: 'campus.driver@mgit.ac.in',
    category: 'charging_station',
    subcategory: 'Charger not working',
    subject: 'Charger 4 is not starting — MGIT Hub',
    description: 'Charger 4 (AC 22kW) at ChargeNix MGIT EV Charging Hub is not starting. Display shows error code E-04. Tried twice with different vehicles.',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    stationLocation: 'MGIT Campus, Gandipet, Hyderabad, Telangana',
    chargerNumber: 'Charger 4',
    chargerType: 'Normal',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    department: 'Station Operations',
    assignedTo: 'ChargeNix Field Tech – Hyderabad South',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    slaHours: 4,
    slaTargetTime: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    isSlaAtRisk: true,
    isEscalated: false,
    suggestedFirstAction: 'Inspect MGIT-C4 EVSE relay and reset OCPP session. If relay failure confirmed, dispatch replacement unit.',
    aiClassificationExplanation: 'Classified as High Priority Station Hardware issue. Charger 4 is currently OFFLINE. Field technician dispatched.',
    messages: [
      {
        id: 'tck102-msg1',
        sender: 'user',
        senderName: 'Campus EV Driver',
        message: 'Charger 4 shows error code E-04 and is not starting. Tried multiple vehicles.',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
      {
        id: 'tck102-msg2',
        sender: 'support',
        senderName: 'ChargeNix Operations',
        message: 'Acknowledged. Charger 4 has been placed in OFFLINE mode. Field technician is en route to inspect the EVSE relay and AC contactors.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'TCK103',
    userId: 'usr-mgit-visitor',
    userName: 'MGIT Visitor',
    userEmail: 'visitor@gmail.com',
    category: 'charging_station',
    subcategory: 'Availability information incorrect',
    subject: 'Charger availability was incorrect — showed Available but was Occupied',
    description: 'The ChargeNix app showed Charger 1 as Available but when I arrived, it was occupied by another vehicle. Very misleading.',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    stationLocation: 'MGIT Campus, Gandipet, Hyderabad, Telangana',
    chargerNumber: 'Charger 1',
    chargerType: 'Fast',
    priority: 'MEDIUM',
    status: 'OPEN',
    department: 'Station Operations',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    slaHours: 8,
    slaTargetTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    isSlaAtRisk: false,
    isEscalated: false,
    suggestedFirstAction: 'Investigate OCPP heartbeat sync delay for MGIT-C1 and verify availability reporting latency.',
    aiClassificationExplanation: 'Classified as Medium Priority Station Information mismatch. Likely OCPP status sync delay between charger and cloud.',
    messages: [
      {
        id: 'tck103-msg1',
        sender: 'user',
        senderName: 'MGIT Visitor',
        message: 'Charger 1 showed Available in app but was occupied on arrival. Wasted a trip.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'TCK104',
    userId: 'usr-rahul',
    userName: 'Rahul',
    userEmail: 'rahul@example.com',
    category: 'payment',
    subcategory: 'Payment completed but charging did not start',
    subject: 'Payment completed but charging did not start — Charger 2',
    description: 'I completed payment of ₹480 via card for Charger 2, but the charging session did not initiate. The charger screen showed “Session Error” after payment confirmation.',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    stationLocation: 'MGIT Campus, Gandipet, Hyderabad, Telangana',
    chargerNumber: 'Charger 2',
    chargerType: 'Fast',
    transactionId: 'TXN-CARD-CN1025',
    bookingId: 'CN1025',
    priority: 'HIGH',
    status: 'ASSIGNED',
    department: 'Payment Support',
    assignedTo: 'Priya Sharma (Finance Ops)',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    slaHours: 4,
    slaTargetTime: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    isSlaAtRisk: false,
    isEscalated: false,
    suggestedFirstAction: 'Verify gateway settlement record against TXN-CARD-CN1025 and confirm OCPP start-session command was dispatched.',
    aiClassificationExplanation: 'Classified as High Priority Payment/Charging issue. Payment gateway confirms capture but OCPP session start failed.',
    messages: [
      {
        id: 'tck104-msg1',
        sender: 'user',
        senderName: 'Rahul',
        message: 'Paid ₹480 via card but charger 2 showed Session Error and did not start. Please refund or fix.',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      },
      {
        id: 'tck104-msg2',
        sender: 'support',
        senderName: 'Priya Sharma (Finance Ops)',
        message: 'We have confirmed the payment capture. Investigating OCPP session start log for Charger 2. Will update shortly.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
  },
];

export function getTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (!raw) {
      localStorage.setItem(TICKETS_KEY, JSON.stringify(INITIAL_DEMO_TICKETS));
      return INITIAL_DEMO_TICKETS;
    }
    return JSON.parse(raw) as SupportTicket[];
  } catch {
    return INITIAL_DEMO_TICKETS;
  }
}

export function saveTicket(ticket: SupportTicket): void {
  const all = getTickets();
  const updated = [ticket, ...all.filter((t) => t.id !== ticket.id)].slice(0, 100);
  localStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
}

export function updateTicket(ticketId: string, updates: Partial<SupportTicket>): SupportTicket | null {
  const all = getTickets();
  const idx = all.findIndex((t) => t.id === ticketId);
  if (idx === -1) return null;

  const updated: SupportTicket = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updated;
  localStorage.setItem(TICKETS_KEY, JSON.stringify(all));
  return updated;
}

export function addTicketMessage(
  ticketId: string,
  message: Omit<TicketMessage, 'id' | 'timestamp'>
): SupportTicket | null {
  const all = getTickets();
  const idx = all.findIndex((t) => t.id === ticketId);
  if (idx === -1) return null;

  const newMsg: TicketMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    ...message,
    timestamp: new Date().toISOString(),
  };

  const updated: SupportTicket = {
    ...all[idx],
    updatedAt: new Date().toISOString(),
    messages: [...all[idx].messages, newMsg],
  };

  all[idx] = updated;
  localStorage.setItem(TICKETS_KEY, JSON.stringify(all));
  return updated;
}

// ── Station Owner Management, Chargers & Refunds ───────────────────────────
import type {
  Station,
  IndividualCharger,
  ChargerOperationalStatus,
  RefundRecord,
} from '@/types';
import { stations as defaultStations } from '@/data/stations';

export const DEMO_STATION_OWNER: User = {
  id: 'owner-mgit-ravi',
  name: 'Ravi Kumar',
  email: 'owner@chargenix.demo',
  phone: '+91 98490 77001',
  businessName: 'ChargeNix Charging Services',
  businessAddress: 'MGIT Campus, Gandipet, Hyderabad, Telangana 500075',
  gstId: '36AABCR5512F1Z8',
  role: 'STATION_OWNER',
};

const STATIONS_KEY = 'chargenix_custom_stations';
const CHARGERS_KEY = 'chargenix_individual_chargers';
const REFUNDS_KEY = 'chargenix_refunds';

export function getCustomStations(): Station[] {
  try {
    const raw = localStorage.getItem(STATIONS_KEY);
    if (!raw) {
      localStorage.setItem(STATIONS_KEY, JSON.stringify(defaultStations));
      return defaultStations;
    }
    const parsed = JSON.parse(raw) as Station[];
    return parsed.length > 0 ? parsed : defaultStations;
  } catch {
    return defaultStations;
  }
}

export function saveCustomStation(station: Station): void {
  const all = getCustomStations();
  const exists = all.findIndex((s) => s.id === station.id);
  let updated: Station[];
  if (exists >= 0) {
    updated = all.map((s) => (s.id === station.id ? station : s));
  } else {
    updated = [station, ...all];
  }
  localStorage.setItem(STATIONS_KEY, JSON.stringify(updated));
}

export function getOwnerStations(ownerId: string): Station[] {
  const all = getCustomStations();
  return all.filter((s) => s.ownerId === ownerId);
}

// Initial Individual Chargers matching exact prompt specifications:
// ABC EV Charging Hub: 18 Chargers (11 Available, 5 Charging, 2 Offline)
const INITIAL_DEMO_CHARGERS: IndividualCharger[] = [
  // ABC EV Charging Hub (18 chargers)
  { id: 'CNX-01', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 150, status: 'AVAILABLE' },
  { id: 'CNX-02', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 150, status: 'CHARGING', currentBookingId: 'CNX1024', currentUser: 'Rohit Sharma' },
  { id: 'CNX-03', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 150, status: 'AVAILABLE' },
  { id: 'CNX-04', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 150, status: 'OFFLINE', lastMaintenanceDate: '2026-09-20' },
  { id: 'CNX-05', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 150, status: 'CHARGING', currentBookingId: 'CNX1025', currentUser: 'Sneha Rao' },
  { id: 'CNX-06', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 150, status: 'AVAILABLE' },
  { id: 'CNX-07', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'CHARGING', currentBookingId: 'CNX1026', currentUser: 'Amit Verma' },
  { id: 'CNX-08', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'AVAILABLE' },
  { id: 'CNX-09', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'AVAILABLE' },
  { id: 'CNX-10', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'CHARGING', currentBookingId: 'CNX1027', currentUser: 'Priya Nair' },
  { id: 'CNX-11', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'AVAILABLE', currentBookingId: 'CNX1028', currentUser: 'Karthik S' },
  { id: 'CNX-12', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'AVAILABLE' },
  { id: 'CNX-13', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'OFFLINE', lastMaintenanceDate: '2026-09-18' },
  { id: 'CNX-14', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'AVAILABLE' },
  { id: 'CNX-15', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'Type 2 (AC)', chargingSpeed: 'AC Fast', powerKw: 22, status: 'CHARGING', currentBookingId: 'CNX1029', currentUser: 'Venkat Reddy' },
  { id: 'CNX-16', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'Type 2 (AC)', chargingSpeed: 'AC Fast', powerKw: 22, status: 'AVAILABLE' },
  { id: 'CNX-17', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'Type 2 (AC)', chargingSpeed: 'AC Fast', powerKw: 22, status: 'AVAILABLE' },
  { id: 'CNX-18', stationId: 'abc-ev-hub', stationName: 'ABC EV Charging Hub', connectorType: 'Type 2 (AC)', chargingSpeed: 'AC Fast', powerKw: 22, status: 'AVAILABLE' },

  // ChargeNix MGIT EV Charging Hub - 4 chargers (canonical demo station)
  // Charger 1: DC Fast 60kW - AVAILABLE
  { id: 'MGIT-C1', stationId: 'mgit-ev-station', stationName: 'ChargeNix MGIT EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'AVAILABLE' },
  // Charger 2: DC Fast 60kW - CHARGING (Priya, Booking #CN1025)
  { id: 'MGIT-C2', stationId: 'mgit-ev-station', stationName: 'ChargeNix MGIT EV Charging Hub', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 60, status: 'CHARGING', currentBookingId: 'CN1025', currentUser: 'Priya' },
  // Charger 3: AC 22kW - RESERVED (Arjun, Booking #CN1024)
  { id: 'MGIT-C3', stationId: 'mgit-ev-station', stationName: 'ChargeNix MGIT EV Charging Hub', connectorType: 'Type 2 (AC)', chargingSpeed: 'AC Charger', powerKw: 22, status: 'RESERVED', currentBookingId: 'CN1024', currentUser: 'Arjun' },
  // Charger 4: AC 22kW - OFFLINE (Maintenance required)
  { id: 'MGIT-C4', stationId: 'mgit-ev-station', stationName: 'ChargeNix MGIT EV Charging Hub', connectorType: 'Type 2 (AC)', chargingSpeed: 'AC Charger', powerKw: 22, status: 'OFFLINE', lastMaintenanceDate: '2026-09-25' },

  // Madhapur Tech Park Superchargers (8 chargers)
  { id: 'MTP-01', stationId: 'st-01', stationName: 'Madhapur Tech Park Superchargers', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 120, status: 'CHARGING', currentBookingId: 'CNX-BK-9801', currentUser: 'EV Traveler' },
  { id: 'MTP-02', stationId: 'st-01', stationName: 'Madhapur Tech Park Superchargers', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 120, status: 'GRACE_PERIOD', currentBookingId: 'CNX-BK-9801', currentUser: 'EV Traveler' },
  { id: 'MTP-03', stationId: 'st-01', stationName: 'Madhapur Tech Park Superchargers', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 120, status: 'AVAILABLE' },
  { id: 'MTP-04', stationId: 'st-01', stationName: 'Madhapur Tech Park Superchargers', connectorType: 'CCS2 (DC)', chargingSpeed: 'Ultra-Fast', powerKw: 120, status: 'AVAILABLE' },
  { id: 'MTP-05', stationId: 'st-01', stationName: 'Madhapur Tech Park Superchargers', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 50, status: 'CHARGING', currentBookingId: 'CNX-BK-9804', currentUser: 'Suresh Raina' },
  { id: 'MTP-06', stationId: 'st-01', stationName: 'Madhapur Tech Park Superchargers', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 50, status: 'AVAILABLE' },
  { id: 'MTP-07', stationId: 'st-01', stationName: 'Madhapur Tech Park Superchargers', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 50, status: 'AVAILABLE' },
  { id: 'MTP-08', stationId: 'st-01', stationName: 'Madhapur Tech Park Superchargers', connectorType: 'CCS2 (DC)', chargingSpeed: 'DC Fast', powerKw: 50, status: 'RESERVED', currentBookingId: 'CNX-BK-9805', currentUser: 'Rajesh G' },
];

export function getIndividualChargers(): IndividualCharger[] {
  try {
    const raw = localStorage.getItem(CHARGERS_KEY);
    if (!raw) {
      localStorage.setItem(CHARGERS_KEY, JSON.stringify(INITIAL_DEMO_CHARGERS));
      return INITIAL_DEMO_CHARGERS;
    }
    const parsed = JSON.parse(raw) as IndividualCharger[];
    return parsed.length > 0 ? parsed : INITIAL_DEMO_CHARGERS;
  } catch {
    return INITIAL_DEMO_CHARGERS;
  }
}

export function updateChargerStatus(
  chargerId: string,
  newStatus: ChargerOperationalStatus
): { success: boolean; message: string; charger?: IndividualCharger } {
  const all = getIndividualChargers();
  const idx = all.findIndex((c) => c.id === chargerId);
  if (idx === -1) return { success: false, message: 'Charger not found.' };

  const current = all[idx];

  // RULE: Do not allow an owner to manually mark a charger as AVAILABLE while it has an active charging session
  if (current.status === 'CHARGING' && newStatus === 'AVAILABLE') {
    return {
      success: false,
      message: 'Cannot manually mark charger as AVAILABLE while an active charging session is underway.',
    };
  }

  const updated: IndividualCharger = {
    ...current,
    status: newStatus,
    ...(newStatus === 'AVAILABLE' ? { currentBookingId: undefined, currentUser: undefined } : {}),
  };

  all[idx] = updated;
  localStorage.setItem(CHARGERS_KEY, JSON.stringify(all));
  return { success: true, message: `Charger status updated to ${newStatus}.`, charger: updated };
}

// ── Refund Records ──────────────────────────────────────────────────────────
const INITIAL_DEMO_REFUNDS: RefundRecord[] = [
  {
    id: 'RFND-901',
    bookingId: 'CNX-BK-9120',
    stationId: 'abc-ev-hub',
    stationName: 'ABC EV Charging Hub',
    userName: 'Arun Verma',
    userEmail: 'arun.verma@example.com',
    originalAmount: 420,
    noShowCharge: 42,
    refundAmount: 378,
    amount: 378,
    reason: 'Grace period expired (10% no-show charge deducted)',
    status: 'REFUNDED',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 1.8).toISOString(),
    txnRef: 'TXN-RFND-98124',
  },
  {
    id: 'RFND-902',
    bookingId: 'CNX-BK-9188',
    stationId: 'abc-ev-hub',
    stationName: 'ABC EV Charging Hub',
    userName: 'Kavita Reddy',
    userEmail: 'kavita.r@example.com',
    originalAmount: 350,
    noShowCharge: 0,
    refundAmount: 350,
    amount: 350,
    reason: 'Emergency user cancellation prior to slot start',
    status: 'REFUND_PROCESSING',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    txnRef: 'TXN-RFND-98441',
  },
  {
    id: 'RFND-903',
    bookingId: 'CNX-BK-9244',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    userName: 'Vikram Joshi',
    userEmail: 'vikram.j@example.com',
    originalAmount: 300,
    noShowCharge: 30,
    refundAmount: 270,
    amount: 270,
    reason: 'Booking not used within grace period (10% charge deducted)',
    status: 'REFUND_INITIATED',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  // ── MGIT Canonical Refunds ──
  {
    id: 'RFND-CN1019',
    bookingId: 'CN1019',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    userName: 'Kiran',
    userEmail: 'kiran@example.com',
    originalAmount: 300,
    noShowCharge: 30,
    refundAmount: 270,
    amount: 270,
    reason: 'Booking not started within grace period (10% no-show charge deducted)',
    status: 'REFUNDED',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000 + 10 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 3 * 3600 * 1000 + 11 * 60 * 1000).toISOString(),
    txnRef: 'TXN-RFND-CN1019',
  },
  {
    id: 'RFND-CN1015',
    bookingId: 'CN1015',
    stationId: 'mgit-ev-station',
    stationName: 'ChargeNix MGIT EV Charging Hub',
    userName: 'Suresh',
    userEmail: 'suresh@example.com',
    originalAmount: 500,
    noShowCharge: 50,
    refundAmount: 450,
    amount: 450,
    reason: 'User cancelled booking prior to slot (10% cancellation fee applied)',
    status: 'REFUND_PROCESSING',
    createdAt: new Date(Date.now() - 86400000 - 3 * 3600 * 1000).toISOString(),
    txnRef: 'TXN-RFND-CN1015',
  },
  {
    id: 'RFND-904',
    bookingId: 'CNX-BK-8902',
    stationId: 'abc-ev-hub',
    stationName: 'ABC EV Charging Hub',
    userName: 'Deepak Kumar',
    userEmail: 'deepak.k@example.com',
    originalAmount: 300,
    noShowCharge: 30,
    refundAmount: 270,
    amount: 270,
    reason: 'Duplicate payment dispute (declined by gateway)',
    status: 'REFUND_FAILED',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 3.5).toISOString(),
  },
];

export function getRefunds(): RefundRecord[] {
  try {
    const raw = localStorage.getItem(REFUNDS_KEY);
    if (!raw) {
      localStorage.setItem(REFUNDS_KEY, JSON.stringify(INITIAL_DEMO_REFUNDS));
      return INITIAL_DEMO_REFUNDS;
    }
    const parsed = JSON.parse(raw) as RefundRecord[];
    return parsed.length > 0 ? parsed : INITIAL_DEMO_REFUNDS;
  } catch {
    return INITIAL_DEMO_REFUNDS;
  }
}

export function saveRefundRecord(record: RefundRecord): void {
  const all = getRefunds();
  const existingIdx = all.findIndex((r) => r.id === record.id);
  if (existingIdx >= 0) {
    all[existingIdx] = record;
  } else {
    all.unshift(record);
  }
  localStorage.setItem(REFUNDS_KEY, JSON.stringify(all));
}

export function getStationRefunds(stationIds: string[]): RefundRecord[] {
  const all = getRefunds();
  return all.filter((r) => stationIds.includes(r.stationId));
}

// ── Pay at Station Helper ──────────────────────────────────────────────────
export function markStationPaymentPaid(
  bookingId: string,
  paidBy: string
): BookingWithPayment | null {
  const all = getBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;

  const b = all[idx];
  const now = new Date().toISOString();
  const updated: BookingWithPayment = {
    ...b,
    payment: {
      ...b.payment,
      status: 'PAID',
      paidAt: now,
      paidBy,
    },
  };

  all[idx] = updated;
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
  return updated;
}

// Backward compatibility alias
export const markCounterPaymentPaid = markStationPaymentPaid;



