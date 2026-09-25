import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, CheckCircle2, XCircle, Clock, Zap, CalendarCheck, MapPin,
  CreditCard, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Smartphone,
  Building2, Wallet, AlertTriangle, Banknote
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui';
import { METHOD_LABELS } from '@/utils/payment';
import {
  buildGoogleMapsDirectionsUrl,
  getStationCoordinates,
  getGrantedUserLocation,
  openGoogleMaps,
} from '@/utils/navigation';
import type { BookingWithPayment, PaymentMethod } from '@/types';
import { calculateBookingTimeState } from '@/services/gracePeriodService';
import { RaiseTicketModal } from '@/components/support/RaiseTicketModal';

type Tab = 'all' | 'upcoming' | 'grace' | 'charging' | 'completed' | 'noshow' | 'cancelled';

// ─── Method icon map ────────────────────────────────────────────────────────
const METHOD_ICON: Record<PaymentMethod, React.FC<{ className?: string }>> = {
  upi:            Smartphone,
  card:           CreditCard,
  netbanking:     Building2,
  wallet:         Wallet,
  PAY_AT_COUNTER: Banknote,
  counter:        Banknote,
  ONLINE:         CreditCard,
  PAY_ONLINE:     CreditCard,
  PAY_AT_STATION: Banknote,
};

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  RESERVED:     { label: 'Reserved',              color: 'text-acid',        bg: 'bg-acid/10',          border: 'border-acid/25',         dot: 'bg-acid' },
  confirmed:    { label: 'Reserved',              color: 'text-acid',        bg: 'bg-acid/10',          border: 'border-acid/25',         dot: 'bg-acid' },
  GRACE_PERIOD: { label: 'Grace Period Active',   color: 'text-amber-400',   bg: 'bg-amber-500/10',     border: 'border-amber-500/25',    dot: 'bg-amber-400' },
  CHARGING:     { label: 'Charging in Progress',  color: 'text-sky-300',     bg: 'bg-sky-500/10',       border: 'border-sky-400/25',      dot: 'bg-sky-400' },
  COMPLETED:    { label: 'Charging Completed',    color: 'text-emerald-400', bg: 'bg-emerald-500/10',   border: 'border-emerald-500/25',  dot: 'bg-emerald-400' },
  completed:    { label: 'Charging Completed',    color: 'text-emerald-400', bg: 'bg-emerald-500/10',   border: 'border-emerald-500/25',  dot: 'bg-emerald-400' },
  NO_SHOW:      { label: 'Booking Expired',       color: 'text-rose-400',    bg: 'bg-rose-500/10',      border: 'border-rose-500/25',     dot: 'bg-rose-400' },
  CANCELLED:    { label: 'Booking Cancelled',     color: 'text-ink-400',     bg: 'bg-ink-800/80',       border: 'border-white/10',        dot: 'bg-ink-500' },
  cancelled:    { label: 'Booking Cancelled',     color: 'text-ink-400',     bg: 'bg-ink-800/80',       border: 'border-white/10',        dot: 'bg-ink-500' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  success:         { label: 'PAID',            color: 'text-emerald-400' },
  PAID:            { label: 'PAID',            color: 'text-emerald-400' },
  failed:          { label: 'Failed',          color: 'text-danger-400' },
  pending:         { label: 'Pending',         color: 'text-amber-400' },
  PENDING:         { label: 'Pending',         color: 'text-amber-400' },
  PAYMENT_PENDING: { label: 'Pending',         color: 'text-amber-400' },
  NOT_PAID:        { label: 'Not Paid',        color: 'text-ink-400' },
  processing:      { label: 'Processing',      color: 'text-sky-300' },
  cancelled:       { label: 'Cancelled',       color: 'text-danger-400' },
  refunded:        { label: 'Refunded',        color: 'text-sky-300' },
};

const REFUND_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  NOT_APPLICABLE:   { label: 'Not Applicable',   color: 'text-ink-400',    bg: 'bg-ink-800/50',     border: 'border-white/5' },
  not_applicable:   { label: 'Not Applicable',   color: 'text-ink-400',    bg: 'bg-ink-800/50',     border: 'border-white/5' },
  REFUND_INITIATED: { label: 'Refund Initiated', color: 'text-amber-400',  bg: 'bg-amber-500/10',   border: 'border-amber-500/25' },
  REFUND_PROCESSING:{ label: 'Refund Processing',color: 'text-sky-300',    bg: 'bg-sky-500/10',     border: 'border-sky-400/25' },
  pending:          { label: 'Refund Processing',color: 'text-sky-300',    bg: 'bg-sky-500/10',     border: 'border-sky-400/25' },
  REFUNDED:         { label: 'Refunded',         color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  processed:        { label: 'Refunded',         color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  REFUND_FAILED:    { label: 'Refund Failed',    color: 'text-danger-400',  bg: 'bg-danger-500/10',  border: 'border-danger-500/25' },
};

function BookingCard({
  booking,
  onCancel,
  onReportIssue,
}: {
  booking: BookingWithPayment;
  onCancel: () => void;
  onReportIssue: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [navError, setNavError] = useState<string | null>(null);

  const {
    navigate,
    selectStation,
    liveStations,
    userLocation,
    setUserLocation,
    startChargingSession,
    completeChargingSession,
    graceConfig,
    simulateSlotStartNow,
    simulateGraceExpiryNow,
  } = useApp();

  const timeState = calculateBookingTimeState(booking, graceConfig.gracePeriodMinutes);
  const statusCfg = STATUS_CONFIG[timeState.normalizedStatus] || STATUS_CONFIG.RESERVED;
  const payStatusCfg = PAYMENT_STATUS_CONFIG[booking.payment.status];
  const refundCfg = booking.payment.refundStatus ? REFUND_CONFIG[booking.payment.refundStatus] : null;
  const MethodIcon = METHOD_ICON[booking.payment.method] || CreditCard;

  const isReserved = timeState.normalizedStatus === 'RESERVED';
  const isGrace = timeState.normalizedStatus === 'GRACE_PERIOD';
  const isCharging = timeState.normalizedStatus === 'CHARGING';
  const isNoShow = timeState.normalizedStatus === 'NO_SHOW';
  const isCompleted = timeState.normalizedStatus === 'COMPLETED';
  const isCancelled = timeState.normalizedStatus === 'CANCELLED';

  const isPayAtStation =
    booking.payment.method === 'PAY_AT_STATION' ||
    booking.payment.method === 'PAY_AT_COUNTER' ||
    booking.payment.method === 'counter';

  const origAmount = booking.originalPaymentAmount || booking.payment.amount || 300;
  const chargePct = graceConfig.noShowChargePercentage ?? 10;
  const chargeAmt = booking.noShowCharge ?? Math.round((origAmount * chargePct) / 100);
  const refundAmt = booking.refundAmount ?? Math.max(0, origAmount - chargeAmt);

  const handleNavigate = async () => {
    setNavError(null);
    const coords = getStationCoordinates(
      {
        lat: booking.lat,
        lng: booking.lng,
        stationId: booking.stationId,
        stationName: booking.stationName,
      },
      liveStations
    );

    if (!coords) {
      setNavError('Station coordinates are missing.');
      return;
    }

    if (userLocation) {
      try {
        const url = buildGoogleMapsDirectionsUrl(coords, userLocation);
        openGoogleMaps(url);
        return;
      } catch {
        setNavError('Unable to generate map link.');
        return;
      }
    }

    setNavigating(true);
    try {
      const origin = await getGrantedUserLocation();
      if (origin) setUserLocation(origin);
      const url = buildGoogleMapsDirectionsUrl(coords, origin);
      openGoogleMaps(url);
    } catch {
      try {
        const url = buildGoogleMapsDirectionsUrl(coords, null);
        openGoogleMaps(url);
      } catch {
        setNavError('Unable to generate map link.');
      }
    } finally {
      setNavigating(false);
    }
  };

  const handleCancel = () => {
    setCancelling(true);
    setTimeout(() => {
      onCancel();
      setCancelling(false);
    }, 400);
  };

  const handleBookAgain = () => {
    const station = liveStations.find((s) => s.id === booking.stationId);
    if (station) selectStation(station);
    navigate('reserve');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`glass p-5 hover:border-white/15 transition-all duration-300 ${
        isGrace
          ? 'border-amber-400/40 ring-1 ring-amber-400/20 bg-amber-500/[0.03]'
          : isCharging
          ? 'border-sky-400/40 bg-sky-500/[0.03]'
          : isNoShow
          ? 'border-rose-500/30 bg-rose-500/[0.02]'
          : ''
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-white text-base">{booking.stationName}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${isGrace || isCharging ? 'animate-ping' : ''}`} />
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-ink-400">
            <MapPin className="w-3 h-3 text-acid" />
            <span>{booking.stationLocation}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-bold text-acid text-lg">₹{booking.payment.amount}</p>
          <p className={`text-xs font-medium ${payStatusCfg.color}`}>{payStatusCfg.label}</p>
        </div>
      </div>

      {/* Details row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 text-xs text-ink-300">
        <div className="flex items-center gap-1"><CalendarCheck className="w-3.5 h-3.5 text-acid" />{booking.date}</div>
        <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-acid" />{booking.startTime ? `${booking.startTime} – ${booking.endTime || ''}` : booking.time}</div>
        <div className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-acid" />{booking.chargerNumber ? `${booking.chargerNumber} (${booking.chargerType})` : booking.chargerType}</div>
        <div className="flex items-center gap-1"><MethodIcon className="w-3.5 h-3.5 text-acid" />{METHOD_LABELS[booking.payment.method]}</div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DYNAMIC GRACE PERIOD / CHARGING / NO-SHOW BANNER
      ───────────────────────────────────────────────────────────── */}
      {isGrace && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wide">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Grace Period Active</span>
              </div>
              <p className="text-xs text-ink-200">
                Please arrive and start charging within your grace period to keep your slot.
              </p>
            </div>
            <div className="text-right bg-ink-950/70 px-3 py-1.5 rounded-xl border border-amber-400/30 shrink-0">
              <p className="text-[10px] text-ink-400 uppercase font-semibold">Time Remaining</p>
              <p className="font-mono font-bold text-base text-amber-400 tracking-wider">
                {timeState.countdownFormatted}
              </p>
            </div>
          </div>
        </div>
      )}

      {isReserved && (
        <div className="p-3 rounded-xl bg-acid/5 border border-acid/20 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-200">
            <CalendarCheck className="w-4 h-4 text-acid shrink-0" />
            <span>
              Your charging slot starts at <strong className="text-white">{booking.startTime || booking.time}</strong>.
            </span>
          </div>
          <span className="text-[11px] font-mono text-acid bg-acid/10 px-2 py-0.5 rounded-md border border-acid/20">
            {booking.gracePeriodMinutes || graceConfig.gracePeriodMinutes}m Grace
          </span>
        </div>
      )}

      {isCharging && (
        <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-400/30 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-white">Charging in Progress</p>
                <p className="text-[11px] text-sky-300">Port is currently occupied and drawing power.</p>
              </div>
            </div>
            <button
              onClick={() => completeChargingSession(booking.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-ink-950 transition-all cursor-pointer shadow-sm shadow-sky-400/20"
            >
              Complete Session
            </button>
          </div>
        </div>
      )}

      {isNoShow && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 mb-4 space-y-3">
          <div className="flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Booking Expired (No-Show)</p>
              <p className="text-ink-300 mt-0.5">
                {isPayAtStation
                  ? 'Your booking expired because you did not arrive within the grace period. No payment was collected, so no refund is required.'
                  : `The slot was released because charging was not started within the ${booking.gracePeriodMinutes || graceConfig.gracePeriodMinutes}-minute grace period.`}
              </p>
            </div>
          </div>

          {/* Refund Breakdown for Online Payments */}
          {!isPayAtStation && (
            <div className="p-3 rounded-lg bg-ink-950/70 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                <span className="font-semibold uppercase tracking-wider text-ink-300 text-[11px]">Refund Summary</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-400/25">
                  {booking.refundStatus === 'REFUNDED' ? 'Refunded' : 'Refund Processing'}
                </span>
              </div>
              <div className="flex justify-between text-ink-400">
                <span>Original Payment</span>
                <span className="text-ink-200 font-mono font-medium">₹{origAmount}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>No-Show Charge ({chargePct}%)</span>
                <span className="font-mono font-medium">- ₹{chargeAmt}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/10 font-semibold">
                <span className="text-white">Refund Amount</span>
                <span className="text-acid font-mono text-sm">₹{refundAmt}</span>
              </div>
              <p className="text-[10px] text-ink-400 pt-0.5 italic">
                Reason: Booking not used within grace period. Refund is simulated for MVP.
              </p>
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 mb-4 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Charging Completed. Thank you for using ChargeNix!</span>
        </div>
      )}

      {isCancelled && (
        <div className="p-3.5 rounded-xl bg-ink-800/60 border border-white/5 mb-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <XCircle className="w-4 h-4 text-ink-500 shrink-0" />
            <span>
              {isPayAtStation
                ? 'Booking Cancelled. No payment was collected, so no refund is required.'
                : 'Booking Cancelled. The charging slot has been released back to available.'}
            </span>
          </div>

          {!isPayAtStation && (
            <div className="p-3 rounded-lg bg-ink-950/70 border border-white/10 space-y-1.5 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                <span className="font-semibold uppercase tracking-wider text-ink-300 text-[11px]">Refund Summary</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
                  Refunded
                </span>
              </div>
              <div className="flex justify-between text-ink-400">
                <span>Original Payment</span>
                <span className="text-ink-200 font-mono font-medium">₹{origAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Cancellation Charge</span>
                <span className="font-mono font-medium">₹0</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/10 font-semibold">
                <span className="text-white">Refund Amount</span>
                <span className="text-acid font-mono text-sm">₹{origAmount}</span>
              </div>
              <p className="text-[10px] text-ink-400 pt-0.5 italic">
                Reason: User cancelled booking prior to charging session.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Booking ID and Details toggle */}
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-ink-500">
          Booking ID: <span className="text-ink-300 font-mono">{booking.id}</span>
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-ink-400 hover:text-ink-200 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Less' : 'Receipt Details'}
        </button>
      </div>

      {/* Expandable receipt */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-white/5 space-y-2 text-xs mb-3">
              <div className="flex items-center gap-1.5 text-ink-400 mb-2">
                <Receipt className="w-3.5 h-3.5 text-acid" />
                <span className="font-semibold uppercase tracking-wider">Payment Details</span>
              </div>
              {[
                { label: 'Transaction ID', value: booking.payment.transactionId },
                { label: 'Payment Via',    value: booking.payment.methodDetail },
                { label: 'Charging Cost',  value: `₹${booking.breakdown.chargingCost}` },
                { label: 'Service Fee',    value: `₹${booking.breakdown.serviceFee}` },
                { label: 'GST',            value: `₹${booking.breakdown.gst}` },
                { label: 'Total Paid',     value: `₹${booking.breakdown.total}` },
                { label: 'Est. Duration',  value: `~${booking.breakdown.estimatedMinutes} min` },
                { label: 'Grace Period',   value: `${booking.gracePeriodMinutes || graceConfig.gracePeriodMinutes} mins` },
                { label: 'Paid At',        value: new Date(booking.payment.paidAt).toLocaleString('en-IN') },
              ].map((r) => (
                <div key={r.label} className="flex justify-between gap-2">
                  <span className="text-ink-500">{r.label}</span>
                  <span className="text-ink-200 font-medium text-right font-mono">{r.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refund badge */}
      {refundCfg && (
        <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${refundCfg.bg} ${refundCfg.border} text-xs ${refundCfg.color} mb-3`}>
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          {refundCfg.label} — Refunds are typically processed within 5–7 business days.
        </div>
      )}

      {/* Error notice if coordinates cannot be resolved */}
      {navError && (
        <div className="p-2.5 rounded-lg bg-danger-500/10 border border-danger-500/30 text-xs text-danger-400 flex items-center gap-2 mb-3">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{navError}</span>
        </div>
      )}

      {/* Actions toolbar */}
      <div className="flex gap-2 flex-wrap items-center justify-between pt-1">
        <div className="flex gap-2 flex-wrap">
          {/* Navigate to Station for active bookings */}
          {(isReserved || isGrace || isCharging) && (
            <button
              onClick={handleNavigate}
              disabled={navigating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-acid text-ink-950 hover:bg-acid-400 transition-all shadow-sm shadow-acid/20 disabled:opacity-75 cursor-pointer"
            >
              {navigating ? (
                <>
                  <div className="w-3 h-3 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 fill-current" />
                  <span>Navigate to Station</span>
                </>
              )}
            </button>
          )}

          {/* Start Charging button for Grace Period */}
          {isGrace && (
            <button
              onClick={() => startChargingSession(booking.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-ink-950 transition-all shadow-sm shadow-amber-400/20 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Start Charging</span>
            </button>
          )}

          {/* Cancel Booking for Reserved bookings */}
          {isReserved && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-danger-500/10 text-danger-400 border border-danger-500/25 hover:bg-danger-500/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {cancelling ? (
                <>
                  <div className="w-3 h-3 border-2 border-danger-400 border-t-transparent rounded-full animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Booking</span>
                </>
              )}
            </button>
          )}

          {/* Book Again / Find Another Charger for No-Show, Completed, or Cancelled */}
          {(isNoShow || isCompleted || isCancelled) && (
            <button
              onClick={handleBookAgain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-acid/10 text-acid border border-acid/20 hover:bg-acid/20 transition-all cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>{isNoShow ? 'Find Another Charger' : 'Book Again'}</span>
            </button>
          )}

          {/* Report an Issue trigger */}
          <button
            onClick={onReportIssue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-ink-300 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Report Issue</span>
          </button>
        </div>

        {/* Development test simulation helpers */}
        <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          {isReserved && (
            <button
              onClick={() => simulateSlotStartNow(booking.id)}
              className="text-[10px] text-ink-400 hover:text-amber-400 underline"
              title="Developer simulation: fast-forward to start grace period countdown"
            >
              Simulate Start
            </button>
          )}
          {isGrace && (
            <button
              onClick={() => simulateGraceExpiryNow(booking.id)}
              className="text-[10px] text-ink-400 hover:text-rose-400 underline"
              title="Developer simulation: expire grace period immediately into no-show"
            >
              Simulate Expire
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ tab, onBook }: { tab: Tab; onBook: () => void }) {
  const messages: Record<Tab, { title: string; sub: string }> = {
    all:       { title: 'No bookings found',       sub: 'Reserve a charging slot to get started.' },
    upcoming:  { title: 'No upcoming reservations', sub: 'Reserve a charging slot to see it here.' },
    grace:     { title: 'No active grace periods', sub: 'Slots currently within their grace arrival window will appear here.' },
    charging:  { title: 'No active charging sessions', sub: 'Slots currently delivering power will appear here.' },
    completed: { title: 'No completed sessions',   sub: 'Finished charging sessions will appear here.' },
    noshow:    { title: 'No no-show records',      sub: 'Expired reservations where user did not arrive will be listed here.' },
    cancelled: { title: 'No cancelled bookings',   sub: 'Cancelled reservations will appear here.' },
  };
  const { title, sub } = messages[tab] || messages.all;
  return (
    <div className="glass p-10 text-center">
      <Receipt className="w-10 h-10 text-ink-500 mx-auto mb-4" />
      <p className="text-ink-300 font-medium mb-1">{title}</p>
      <p className="text-sm text-ink-500 mb-5">{sub}</p>
      {(tab === 'upcoming' || tab === 'all') && (
        <button onClick={onBook} className="btn-primary">
          <CalendarCheck className="w-4 h-4" /> Reserve a Slot
        </button>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export function MyBookingsPage() {
  const { bookings, cancelPaidBooking, navigate, graceConfig } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [reportingBooking, setReportingBooking] = useState<BookingWithPayment | null>(null);

  // Group bookings using normalized time state
  const categorized = bookings.map((b) => ({
    booking: b,
    state: calculateBookingTimeState(b, graceConfig.gracePeriodMinutes),
  }));

  const upcomingList  = categorized.filter((c) => c.state.normalizedStatus === 'RESERVED').map((c) => c.booking);
  const graceList     = categorized.filter((c) => c.state.normalizedStatus === 'GRACE_PERIOD').map((c) => c.booking);
  const chargingList  = categorized.filter((c) => c.state.normalizedStatus === 'CHARGING').map((c) => c.booking);
  const completedList = categorized.filter((c) => c.state.normalizedStatus === 'COMPLETED').map((c) => c.booking);
  const noShowList    = categorized.filter((c) => c.state.normalizedStatus === 'NO_SHOW').map((c) => c.booking);
  const cancelledList = categorized.filter((c) => c.state.normalizedStatus === 'CANCELLED').map((c) => c.booking);

  const lists: Record<Tab, BookingWithPayment[]> = {
    all:       bookings,
    upcoming:  upcomingList,
    grace:     graceList,
    charging:  chargingList,
    completed: completedList,
    noshow:    noShowList,
    cancelled: cancelledList,
  };

  const tabs: { id: Tab; label: string; count: number; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all',       label: 'All',         count: bookings.length,     icon: Receipt       },
    { id: 'upcoming',  label: 'Upcoming',    count: upcomingList.length,  icon: CalendarCheck },
    { id: 'grace',     label: 'Grace Period', count: graceList.length,    icon: Clock         },
    { id: 'charging',  label: 'Charging',    count: chargingList.length, icon: Zap           },
    { id: 'completed', label: 'Completed',   count: completedList.length,icon: CheckCircle2  },
    { id: 'noshow',    label: 'No-Show',     count: noShowList.length,   icon: AlertTriangle },
    { id: 'cancelled', label: 'Cancelled',   count: cancelledList.length,icon: XCircle       },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          label="My Bookings"
          title="Booking & Session Tracker"
          subtitle="Real-time grace period countdowns, charging sessions, and reservation management."
        />

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Upcoming',     value: upcomingList.length,  color: 'text-acid' },
            { label: 'Grace Period', value: graceList.length,     color: 'text-amber-400' },
            { label: 'Charging Now', value: chargingList.length,  color: 'text-sky-400' },
            { label: 'No-Shows',     value: noShowList.length,    color: 'text-rose-400' },
          ].map((s) => (
            <div key={s.label} className="glass p-3.5 text-center rounded-2xl border border-white/5">
              <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-ink-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="glass p-1.5 flex gap-1 mb-6 overflow-x-auto scrollbar-none rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-acid text-ink-950 shadow-sm shadow-acid/20'
                  : 'text-ink-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.id ? 'bg-ink-950/20 text-ink-950' : 'bg-ink-800 text-ink-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Booking list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 pb-20"
          >
            {lists[activeTab].length === 0 ? (
              <EmptyState tab={activeTab} onBook={() => navigate('reserve')} />
            ) : (
              <AnimatePresence>
                {lists[activeTab].map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={() => cancelPaidBooking(booking.id)}
                    onReportIssue={() => setReportingBooking(booking)}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Raise Ticket Modal prefilled with booking */}
      {reportingBooking && (
        <RaiseTicketModal
          isOpen={true}
          onClose={() => setReportingBooking(null)}
          prefillBookingId={reportingBooking.id}
          prefillStationId={reportingBooking.stationId}
        />
      )}
    </div>
  );
}
