import type {
  BookingWithPayment,
  BookingStatus,
  NoShowPolicy,
  GracePeriodConfig,
} from '@/types';

export const DEFAULT_GRACE_PERIOD_MINUTES = 10;
export const DEFAULT_NO_SHOW_POLICY: NoShowPolicy = 'NONE';

export interface NoShowAuditRecord {
  id: string;
  bookingId: string;
  stationId: string;
  stationName: string;
  chargerNumber?: string;
  userId: string;
  userName: string;
  slotTime: string;
  slotStartTimestamp: number;
  gracePeriodMinutes: number;
  expiredAt: string;
  policyApplied: NoShowPolicy;
  penaltyInr: number;
}

/**
 * Valid state transitions for the booking state machine:
 * RESERVED -> GRACE_PERIOD | CANCELLED
 * GRACE_PERIOD -> CHARGING | NO_SHOW
 * CHARGING -> COMPLETED
 * 
 * Invalid transitions such as NO_SHOW -> CHARGING, CANCELLED -> CHARGING, COMPLETED -> CHARGING are blocked.
 */
export function isValidStateTransition(current: BookingStatus, next: BookingStatus): boolean {
  // Normalize confirmed -> RESERVED
  const normCurrent = current === 'confirmed' ? 'RESERVED' : current === 'completed' ? 'COMPLETED' : current === 'cancelled' ? 'CANCELLED' : current;
  const normNext = next === 'confirmed' ? 'RESERVED' : next === 'completed' ? 'COMPLETED' : next === 'cancelled' ? 'CANCELLED' : next;

  if (normCurrent === normNext) return true;

  switch (normCurrent) {
    case 'RESERVED':
      return normNext === 'GRACE_PERIOD' || normNext === 'CANCELLED' || normNext === 'CHARGING';
    case 'GRACE_PERIOD':
      return normNext === 'CHARGING' || normNext === 'NO_SHOW' || normNext === 'CANCELLED';
    case 'CHARGING':
      return normNext === 'COMPLETED';
    case 'NO_SHOW':
    case 'CANCELLED':
    case 'COMPLETED':
      // Terminal states — cannot transition to CHARGING or others
      return false;
    default:
      return true;
  }
}

/**
 * Format milliseconds into MM:SS format (e.g. "09:59")
 */
export function formatGraceCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Compute start and end timestamps from date & time string
 */
export function parseSlotTimestamps(dateStr: string, timeStr: string, gracePeriodMinutes: number = DEFAULT_GRACE_PERIOD_MINUTES): {
  slotStartTimestamp: number;
  slotEndTimestamp: number;
  gracePeriodEndTimestamp: number;
  startTimeLabel: string;
  endTimeLabel: string;
} {
  const now = new Date();
  let startHour = 18;
  let startMinute = 0;

  // Try parsing timeStr like "06:00 PM" or "6:00 PM - 6:45 PM" or "10:30 AM"
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const meridiem = timeMatch[3]?.toUpperCase();

    if (meridiem === 'PM' && h < 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    startHour = h;
    startMinute = m;
  }

  const slotStart = new Date(dateStr);
  if (isNaN(slotStart.getTime())) {
    slotStart.setTime(now.getTime());
  }
  slotStart.setHours(startHour, startMinute, 0, 0);

  // If slot start is in the past by more than 24 hours, default to today
  if (slotStart.getTime() < now.getTime() - 86400000) {
    slotStart.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const slotStartTimestamp = slotStart.getTime();
  const slotEndTimestamp = slotStartTimestamp + 45 * 60 * 1000; // 45 min default duration
  const gracePeriodEndTimestamp = slotStartTimestamp + gracePeriodMinutes * 60 * 1000;

  const startTimeLabel = slotStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const endD = new Date(slotEndTimestamp);
  const endTimeLabel = endD.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return {
    slotStartTimestamp,
    slotEndTimestamp,
    gracePeriodEndTimestamp,
    startTimeLabel,
    endTimeLabel,
  };
}

/**
 * Calculate active state and time remaining for a booking
 */
export function calculateBookingTimeState(
  booking: BookingWithPayment,
  currentGracePeriodMinutes: number = DEFAULT_GRACE_PERIOD_MINUTES
): {
  normalizedStatus: BookingStatus;
  isGraceActive: boolean;
  isUpcoming: boolean;
  isNoShow: boolean;
  isCharging: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  remainingMs: number;
  countdownFormatted: string;
  hasGraceExpired: boolean;
} {
  const now = Date.now();
  const startTs = booking.slotStartTimestamp || (new Date(booking.createdAt).getTime());
  const graceMinutes = booking.gracePeriodMinutes || currentGracePeriodMinutes;
  const graceEndTs = booking.gracePeriodEndTimestamp || (startTs + graceMinutes * 60 * 1000);

  let normalizedStatus: BookingStatus = booking.status;
  if (booking.status === 'confirmed') normalizedStatus = 'RESERVED';
  if (booking.status === 'completed') normalizedStatus = 'COMPLETED';
  if (booking.status === 'cancelled') normalizedStatus = 'CANCELLED';

  const remainingMs = Math.max(0, graceEndTs - now);
  const hasGraceExpired = now >= graceEndTs;
  const isGraceActive = normalizedStatus === 'GRACE_PERIOD' && !hasGraceExpired;

  return {
    normalizedStatus,
    isGraceActive,
    isUpcoming: normalizedStatus === 'RESERVED',
    isNoShow: normalizedStatus === 'NO_SHOW',
    isCharging: normalizedStatus === 'CHARGING',
    isCompleted: normalizedStatus === 'COMPLETED',
    isCancelled: normalizedStatus === 'CANCELLED',
    remainingMs,
    countdownFormatted: formatGraceCountdown(remainingMs),
    hasGraceExpired,
  };
}

export interface RefundCalculationResult {
  originalAmount: number;
  noShowCharge: number;
  refundAmount: number;
  chargePercentage: number;
  policy: string;
}

/**
 * Reusable No-Show Refund Calculation
 * Default: 10% no-show charge (e.g., ₹300 payment -> ₹30 charge -> ₹270 refund).
 * Never allows refund < 0.
 */
export function calculateNoShowRefund(
  originalAmount: number,
  noShowChargePercentage: number = 10
): RefundCalculationResult {
  const charge = Math.round((originalAmount * noShowChargePercentage) / 100);
  const refund = Math.max(0, originalAmount - charge);
  return {
    originalAmount,
    noShowCharge: charge,
    refundAmount: refund,
    chargePercentage: noShowChargePercentage,
    policy: 'FULL_REFUND_MINUS_NO_SHOW_CHARGE',
  };
}

/**
 * Reusable User Cancellation Refund Calculation
 */
export function calculateCancellationRefund(
  originalAmount: number,
  cancellationChargePercentage: number = 0
): RefundCalculationResult {
  const charge = Math.round((originalAmount * cancellationChargePercentage) / 100);
  const refund = Math.max(0, originalAmount - charge);
  return {
    originalAmount,
    noShowCharge: charge,
    refundAmount: refund,
    chargePercentage: cancellationChargePercentage,
    policy: 'CANCELLATION_FULL_REFUND',
  };
}

