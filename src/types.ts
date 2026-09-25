export type ChargerType = 'Fast' | 'Normal' | 'Ultra-Fast';
export type AvailabilityStatus = 'Available' | 'Occupied' | 'Limited';
export type PaymentMethod =
  | 'ONLINE'
  | 'PAY_ONLINE'
  | 'PAY_AT_STATION'
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'wallet'
  | 'PAY_AT_COUNTER'
  | 'counter';
export type PaymentStatus =
  | 'PAID'
  | 'PENDING'
  | 'NOT_PAID'
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'PAYMENT_PENDING';
export type BookingStatus =
  | 'RESERVED'
  | 'GRACE_PERIOD'
  | 'CHARGING'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'confirmed' // for backward compatibility
  | 'completed'
  | 'cancelled';

export type NoShowPolicy = 'NONE' | 'WARNING' | 'PENALTY';

export interface GracePeriodConfig {
  gracePeriodMinutes: number; // default 10
  noShowPolicy: NoShowPolicy; // default 'NONE'
  penaltyAmountInr?: number;
  noShowChargePercentage?: number; // default 10%
  refundPolicy?: 'FULL_REFUND_MINUS_NO_SHOW_CHARGE';
  lastUpdated?: string;
  updatedBy?: string;
}

export interface ChargerGroup {
  type: ChargerType;
  totalPorts: number;
  availablePorts: number;
  speedKW: number;
}

export type StationOperationalStatus = 'OPEN' | 'BUSY' | 'CLOSED' | 'MAINTENANCE';

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
  ownerId?: string;
  operatingHours?: string;
  contactNumber?: string;
  description?: string;
  operationalStatus?: StationOperationalStatus;
}

export type ChargerOperationalStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'GRACE_PERIOD'
  | 'CHARGING'
  | 'OFFLINE'
  | 'MAINTENANCE';

export interface IndividualCharger {
  id: string;
  stationId: string;
  stationName: string;
  connectorType: string;
  chargingSpeed: string;
  powerKw: number;
  status: ChargerOperationalStatus;
  currentBookingId?: string;
  currentUser?: string;
  lastMaintenanceDate?: string;
}

export type RefundStatus =
  | 'NOT_APPLICABLE'
  | 'REFUND_INITIATED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'REFUND_FAILED';

export interface RefundRecord {
  id: string;
  bookingId: string;
  stationId: string;
  stationName: string;
  userName: string;
  userEmail: string;
  originalAmount: number;
  noShowCharge: number;
  refundAmount: number;
  amount: number; // for backward compatibility
  reason: string;
  status: RefundStatus;
  createdAt: string;
  processedAt?: string;
  txnRef?: string;
}

export interface Reservation {
  id: string;
  stationId: string;
  stationName: string;
  chargerType: ChargerType;
  date: string;
  time: string;
  status: BookingStatus;
  createdAt: string;
  lat?: number;
  lng?: number;
  startTime?: string;
  endTime?: string;
  slotStartTimestamp?: number;
  slotEndTimestamp?: number;
  gracePeriodMinutes?: number;
  gracePeriodEndTimestamp?: number;
  chargerNumber?: string;
  chargingStartedAt?: string;
  noShowAt?: string;
  cancelledAt?: string;
  notificationHistory?: string[];
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export interface PaymentBreakdown {
  chargingCost: number;   // base charging cost in INR
  serviceFee: number;     // platform convenience fee
  gst: number;            // 18% GST on service fee
  total: number;          // grand total
  currency: string;       // 'INR'
  estimatedMinutes: number; // estimated charging duration
}

/** Stored after a successful payment. NEVER store raw card details here. */
export interface PaymentRecord {
  transactionId: string;
  method: PaymentMethod;
  methodDetail: string;   // last4 for card, UPI ID, bank name, wallet name — safe to store
  amount: number;
  status: PaymentStatus;
  paidAt: string;
  paidBy?: string;
  refundStatus?: 'not_applicable' | 'pending' | 'processed' | RefundStatus;
}

/** Full booking with payment attached */
export interface BookingWithPayment extends Reservation {
  stationLocation: string;
  lat?: number;
  lng?: number;
  payment: PaymentRecord;
  breakdown: PaymentBreakdown;
  originalPaymentAmount?: number;
  noShowCharge?: number;
  refundAmount?: number;
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundProcessedAt?: string;
}

export interface PendingBookingDetails {
  stationId?: string;
  stationName: string;
  stationLocation: string;
  lat?: number;
  lng?: number;
  chargerType: ChargerType;
  date: string;
  time: string;
  dateLabel: string;
}

export type UserRole = 'USER' | 'STATION_OWNER' | 'ADMIN' | 'STATION_OPERATOR' | 'SUPPORT_AGENT';

export interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  businessAddress?: string;
  gstId?: string;
  vehicleModel?: string;
  vehicleRange?: number;
  batteryPercent?: number;
  role?: UserRole;
}

export type TicketIssueCategory =
  | 'charging_station'
  | 'booking'
  | 'payment'
  | 'app'
  | 'account'
  | 'navigation'
  | 'other';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED';

export type SupportDepartment =
  | 'Station Operations'
  | 'Payment Support'
  | 'Technical Support'
  | 'Account Support'
  | 'Maps Support'
  | 'General Support';

export interface TicketMessage {
  id: string;
  sender: 'user' | 'support' | 'ai_system';
  senderName: string;
  message: string;
  timestamp: string;
  isInternalNote?: boolean;
}

export interface SupportTicket {
  id: string; // e.g. CNX-TKT-10452
  userId: string;
  userName: string;
  userEmail: string;
  category: TicketIssueCategory;
  subcategory: string;
  subject: string;
  description: string;
  stationId?: string;
  stationName?: string;
  stationLocation?: string;
  chargerNumber?: string;
  chargerType?: ChargerType;
  bookingId?: string;
  transactionId?: string;
  priority: TicketPriority;
  status: TicketStatus;
  department: SupportDepartment;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  slaHours: number;
  slaTargetTime: string;
  isSlaAtRisk?: boolean;
  isEscalated?: boolean;
  isSafetyConcern?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  messages: TicketMessage[];
  suggestedFirstAction?: string;
  aiClassificationExplanation?: string;
  resolutionRating?: number;
  resolutionFeedback?: string;
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
  | 'station-details'
  | 'payment'
  | 'my-bookings'
  | 'ai-agent'
  | 'support'
  | 'station-owner-dashboard'
  | 'station-owner-stations'
  | 'station-owner-chargers'
  | 'station-owner-bookings'
  | 'station-owner-payments'
  | 'station-owner-refunds'
  | 'station-owner-tickets'
  | 'station-owner-analytics'
  | 'station-owner-ai-insights'
  | 'station-owner-settings'
  | 'station-owner-register';

