/**
 * PaymentPage — ChargeNix secure payment flow.
 *
 * SECURITY NOTES:
 * ─────────────────────────────────────────────────────────────────────────────
 * • Card numbers and CVVs are held ONLY in local React state during the session.
 * • They are NEVER written to localStorage, sessionStorage, or any external store.
 * • Only safe identifiers (last-4 digits, UPI ID, bank name) are persisted after payment.
 * • simulatePaymentGateway() is designed to be replaced with Razorpay/Stripe SDK call.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, CreditCard, Building2, Wallet, Shield, CheckCircle2,
  AlertCircle, ArrowLeft, Clock, Zap, CalendarCheck, MapPin,
  Receipt, RefreshCw, Copy, Check,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { generateReservationId } from '@/utils/tripPlanner';
import { syncReservationToBackend } from '@/lib/supabase';
import { stations as stationData } from '@/data/stations';
import {
  buildGoogleMapsDirectionsUrl,
  getStationCoordinates,
  getGrantedUserLocation,
  openGoogleMaps,
} from '@/utils/navigation';
import {
  calculateBreakdown,
  validateUpiId,
  validateCard,
  simulatePaymentGateway,
  buildPaymentRecord,
  METHOD_LABELS,
} from '@/utils/payment';
import type { PaymentMethod, BookingWithPayment } from '@/types';
import {
  parseSlotTimestamps,
  formatGraceCountdown,
  calculateBookingTimeState,
} from '@/services/gracePeriodService';

// ─── Types ──────────────────────────────────────────────────────────────────
type FlowState = 'select-method' | 'enter-details' | 'processing' | 'success' | 'failed';

interface CardFields { number: string; name: string; expiry: string; cvv: string }
interface CardErrors { number?: string; name?: string; expiry?: string; cvv?: string }

// ─── Payment method config ───────────────────────────────────────────────────
const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
  { id: 'upi',        label: 'UPI',                icon: Smartphone, desc: 'Pay via any UPI app instantly' },
  { id: 'card',       label: 'Credit / Debit Card', icon: CreditCard,  desc: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking',          icon: Building2,   desc: 'All major Indian banks' },
  { id: 'wallet',     label: 'Wallet',               icon: Wallet,      desc: 'Paytm, PhonePe, Amazon Pay' },
];

const BANK_OPTIONS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB', 'Bank of Baroda'];
const WALLET_OPTIONS = ['Paytm', 'PhonePe', 'Amazon Pay', 'MobiKwik', 'Freecharge'];

// ─── Subcomponents ───────────────────────────────────────────────────────────

function OrderSummary({ breakdown, stationName, stationLocation, chargerType, dateLabel, time }: {
  breakdown: ReturnType<typeof calculateBreakdown>;
  stationName: string;
  stationLocation: string;
  chargerType: string;
  dateLabel: string;
  time: string;
}) {
  return (
    <div className="glass p-5 space-y-4">
      <h3 className="font-display font-semibold text-white text-base">Order Summary</h3>

      {/* Booking details */}
      <div className="space-y-2 pb-3 border-b border-white/5">
        {[
          { icon: MapPin,         label: 'Station',  value: stationName },
          { icon: MapPin,         label: 'Location', value: stationLocation },
          { icon: Zap,            label: 'Charger',  value: chargerType },
          { icon: CalendarCheck,  label: 'Date',     value: dateLabel },
          { icon: Clock,          label: 'Time',     value: time },
          { icon: Clock,          label: 'Est. Duration', value: `~${breakdown.estimatedMinutes} min` },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs gap-2">
            <span className="text-ink-400 flex items-center gap-1 shrink-0">
              <item.icon className="w-3 h-3 text-acid" />
              {item.label}
            </span>
            <span className="text-ink-100 font-medium text-right truncate max-w-[160px]">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div className="space-y-2">
        {[
          { label: 'Charging cost (~30 kWh)', value: breakdown.chargingCost },
          { label: 'Platform convenience fee', value: breakdown.serviceFee },
          { label: `GST (18% on service fee)`, value: breakdown.gst },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-xs">
            <span className="text-ink-400">{row.label}</span>
            <span className="text-ink-200">₹{row.value}</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/10 flex justify-between items-center">
        <span className="text-sm font-semibold text-white">Total</span>
        <span className="font-display font-bold text-acid text-2xl">₹{breakdown.total}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <Shield className="w-3.5 h-3.5 text-acid shrink-0" />
        <span>256-bit SSL encrypted · PCI-DSS compliant</span>
      </div>
    </div>
  );
}



// ── Card Form ────────────────────────────────────────────────────────────────
function CardForm({ onPay, loading }: { onPay: (detail: string) => void; loading: boolean }) {
  const [fields, setFields] = useState<CardFields>({ number: '', name: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<CardErrors>({});
  const [showCvv, setShowCvv] = useState(false);

  const set = (k: keyof CardFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === 'number') v = v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (k === 'expiry') {
      v = v.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    if (k === 'cvv') v = v.replace(/\D/g, '').slice(0, 4);
    setFields((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const handlePay = () => {
    const errs = validateCard(fields);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    // Only pass last 4 digits — NEVER the full number
    const last4 = fields.number.replace(/\s/g, '').slice(-4);
    onPay(`Card ending ****${last4}`);
  };

  const inputClass = (k: keyof CardFields) =>
    `input-field ${errors[k] ? 'border-danger-500/60 focus:border-danger-500' : ''}`;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-ink-300 block mb-1.5">Card Number</label>
        <input
          id="card-number-input"
          type="text"
          inputMode="numeric"
          value={fields.number}
          onChange={set('number')}
          placeholder="1234 5678 9012 3456"
          autoComplete="cc-number"
          className={inputClass('number')}
        />
        {errors.number && <p className="mt-1 text-xs text-danger-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.number}</p>}
      </div>

      <div>
        <label className="text-xs font-medium text-ink-300 block mb-1.5">Cardholder Name</label>
        <input
          id="card-name-input"
          type="text"
          value={fields.name}
          onChange={set('name')}
          placeholder="Name as on card"
          autoComplete="cc-name"
          className={inputClass('name')}
        />
        {errors.name && <p className="mt-1 text-xs text-danger-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-ink-300 block mb-1.5">Expiry (MM/YY)</label>
          <input
            id="card-expiry-input"
            type="text"
            inputMode="numeric"
            value={fields.expiry}
            onChange={set('expiry')}
            placeholder="MM/YY"
            autoComplete="cc-exp"
            className={inputClass('expiry')}
          />
          {errors.expiry && <p className="mt-1 text-xs text-danger-400">{errors.expiry}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-ink-300 block mb-1.5">CVV</label>
          <div className="relative">
            <input
              id="card-cvv-input"
              type={showCvv ? 'text' : 'password'}
              inputMode="numeric"
              value={fields.cvv}
              onChange={set('cvv')}
              placeholder="•••"
              autoComplete="cc-csc"
              className={inputClass('cvv')}
            />
            <button
              type="button"
              onClick={() => setShowCvv(!showCvv)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200 text-xs"
            >
              {showCvv ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.cvv && <p className="mt-1 text-xs text-danger-400">{errors.cvv}</p>}
        </div>
      </div>

      <p className="text-xs text-ink-500 flex items-center gap-1">
        <Shield className="w-3 h-3 text-acid" />
        Card details are never stored. CVV is not saved anywhere.
      </p>

      <button
        id="card-pay-btn"
        onClick={handlePay}
        disabled={loading}
        className="btn-primary w-full mt-2"
      >
        {loading
          ? <><div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" /> Processing...</>
          : <><CreditCard className="w-4 h-4" /> Pay Securely</>}
      </button>
    </div>
  );
}

// ── Net Banking Form ─────────────────────────────────────────────────────────
function NetBankingForm({ onPay, loading }: { onPay: (detail: string) => void; loading: boolean }) {
  const [bank, setBank] = useState('');
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-ink-300 block mb-2">Select Your Bank</label>
        <div className="grid grid-cols-2 gap-2">
          {BANK_OPTIONS.map((b) => (
            <button
              key={b}
              onClick={() => setBank(b)}
              className={`p-3 rounded-xl text-sm text-left transition-all border ${
                bank === b ? 'bg-acid/10 border-acid/30 text-acid' : 'bg-ink-800/50 border-white/5 text-ink-200 hover:border-white/15'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <button
        id="netbanking-pay-btn"
        onClick={() => onPay(bank)}
        disabled={loading || !bank}
        className="btn-primary w-full"
      >
        {loading
          ? <><div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" /> Redirecting...</>
          : <><Building2 className="w-4 h-4" /> Continue to {bank || 'Bank'}</>}
      </button>
    </div>
  );
}

// ── Wallet Form ──────────────────────────────────────────────────────────────
function WalletForm({ onPay, loading }: { onPay: (detail: string) => void; loading: boolean }) {
  const [wallet, setWallet] = useState('');
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-ink-300 block mb-2">Select Wallet</label>
        <div className="grid grid-cols-2 gap-2">
          {WALLET_OPTIONS.map((w) => (
            <button
              key={w}
              onClick={() => setWallet(w)}
              className={`p-3 rounded-xl text-sm text-left transition-all border ${
                wallet === w ? 'bg-acid/10 border-acid/30 text-acid' : 'bg-ink-800/50 border-white/5 text-ink-200 hover:border-white/15'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <button
        id="wallet-pay-btn"
        onClick={() => onPay(wallet)}
        disabled={loading || !wallet}
        className="btn-primary w-full"
      >
        {loading
          ? <><div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" /> Processing...</>
          : <><Wallet className="w-4 h-4" /> Pay with {wallet || 'Wallet'}</>}
      </button>
    </div>
  );
}

// ─── Main PaymentPage ────────────────────────────────────────────────────────
export function PaymentPage() {
  const {
    navigate,
    pendingBookingDetails,
    addReservation,
    addBooking,
    cancelPaidBooking,
    startChargingSession,
    graceConfig,
    bookings,
    setPendingBookingDetails,
    liveStations,
    userLocation,
    setUserLocation,
    user,
    addNotification,
  } = useApp();

  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [flow, setFlow] = useState<FlowState>('select-method');
  const [loading, setLoading] = useState(false);
  const [failureMsg, setFailureMsg] = useState('');
  const [completedBooking, setCompletedBooking] = useState<BookingWithPayment | null>(null);
  const [txnCopied, setTxnCopied] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [navError, setNavError] = useState<string | null>(null);

  // Silently check if location permission has already been granted once booking succeeds
  useEffect(() => {
    if (flow === 'success' && !userLocation) {
      getGrantedUserLocation().then((coords) => {
        if (coords) {
          setUserLocation(coords);
        }
      });
    }
  }, [flow, userLocation, setUserLocation]);

  const {
    stationId: pendingStationId,
    stationName = '',
    stationLocation = '',
    lat: pendingLat,
    lng: pendingLng,
    chargerType = 'Fast',
    date = '',
    time = '',
    dateLabel = '',
  } = pendingBookingDetails || {};

  const breakdown = calculateBreakdown(chargerType);

  // ── Payment handler ──────────────────────────────────────────────────────
  const handlePay = useCallback(async (methodDetail: string) => {
    setLoading(true);
    setFlow('processing');

    try {
      const result = await simulatePaymentGateway(method, breakdown.total, methodDetail);

      if (result.success && result.transactionId) {
        const bookingId = generateReservationId();
        const paymentRecord = buildPaymentRecord(
          result.transactionId,
          'ONLINE',
          methodDetail || METHOD_LABELS[method],
          breakdown.total,
          'PAID',
        );

        // Match station by ID or name in station data to guarantee coordinate resolution
        const matchedStation =
          liveStations.find((s) => s.id === pendingStationId || s.name.toLowerCase() === stationName.toLowerCase()) ||
          stationData.find((s) => s.id === pendingStationId || s.name.toLowerCase() === stationName.toLowerCase());

        const resolvedLat = pendingLat ?? matchedStation?.lat;
        const resolvedLng = pendingLng ?? matchedStation?.lng;
        const stationId = pendingStationId || matchedStation?.id || stationName.toLowerCase().replace(/\s+/g, '-');

        const { slotStartTimestamp, slotEndTimestamp, gracePeriodEndTimestamp, startTimeLabel, endTimeLabel } =
          parseSlotTimestamps(date, time, graceConfig.gracePeriodMinutes);

        const isImmediate = Date.now() >= slotStartTimestamp && Date.now() < gracePeriodEndTimestamp;

        const booking: BookingWithPayment = {
          id:              bookingId,
          stationId,
          stationName,
          stationLocation,
          lat:             resolvedLat,
          lng:             resolvedLng,
          chargerType,
          chargerNumber:   'DC Fast Charger 2',
          date,
          time,
          startTime:       startTimeLabel,
          endTime:         endTimeLabel,
          slotStartTimestamp,
          slotEndTimestamp,
          gracePeriodMinutes: graceConfig.gracePeriodMinutes,
          gracePeriodEndTimestamp,
          status:          isImmediate ? 'GRACE_PERIOD' : 'RESERVED',
          createdAt:       new Date().toISOString(),
          payment:         paymentRecord,
          breakdown,
          originalPaymentAmount: breakdown.total,
          noShowCharge:    0,
          refundAmount:    0,
          refundStatus:    'NOT_APPLICABLE',
          userName:        user?.name || 'EV Driver',
          userEmail:       user?.email || 'user@example.com',
        };

        // Persist booking (NO card details stored)
        addBooking(booking);

        addNotification({
          id: `NTF-ONLINE-PAY-${bookingId}-${Date.now()}`,
          title: 'Online Payment Successful',
          message: `Your payment of ₹${breakdown.total} for ${stationName} has been processed. Your slot has been reserved.`,
          type: 'success',
          timestamp: new Date().toISOString(),
          actionLabel: 'View Booking',
          actionData: { bookingId },
        });
        // Also add to legacy reservations for Dashboard/DashboardPage backward compat
        addReservation({
          id:          bookingId,
          stationId:   booking.stationId,
          stationName,
          lat:         resolvedLat,
          lng:         resolvedLng,
          chargerType,
          date,
          time,
          status:      booking.status,
          createdAt:   booking.createdAt,
          startTime:   startTimeLabel,
          endTime:     endTimeLabel,
          slotStartTimestamp,
          slotEndTimestamp,
          gracePeriodMinutes: graceConfig.gracePeriodMinutes,
          gracePeriodEndTimestamp,
          chargerNumber: 'DC Fast Charger 2',
        });
        // Best-effort sync to Supabase if configured
        syncReservationToBackend({
          id:          bookingId,
          stationId:   booking.stationId,
          stationName,
          chargerType,
          date,
          time,
          status:      booking.status,
          createdAt:   booking.createdAt,
        });

        setCompletedBooking(booking);
        setFlow('success');
        // Clear the pending details from context
        setPendingBookingDetails(null);
      } else {
        setFailureMsg(result.failureReason ?? 'Payment could not be processed.');
        setFlow('failed');
      }
    } catch {
      setFailureMsg('A network error occurred. Please check your connection and try again.');
      setFlow('failed');
    } finally {
      setLoading(false);
    }
  }, [
    method,
    breakdown,
    pendingStationId,
    stationName,
    stationLocation,
    pendingLat,
    pendingLng,
    chargerType,
    date,
    time,
    liveStations,
    addBooking,
    addReservation,
    setPendingBookingDetails,
  ]);

  const copyTxnId = () => {
    if (!completedBooking) return;
    navigator.clipboard.writeText(completedBooking.payment.transactionId).then(() => {
      setTxnCopied(true);
      setTimeout(() => setTxnCopied(false), 2000);
    });
  };

  // ── Navigation handler ──────────────────────────────────────────────────
  const handleNavigate = useCallback(async () => {
    if (!completedBooking) return;
    setNavError(null);

    // 1. Resolve coordinates for the booked station
    const coords = getStationCoordinates(
      {
        lat: completedBooking.lat,
        lng: completedBooking.lng,
        stationId: completedBooking.stationId,
        stationName: completedBooking.stationName,
      },
      liveStations
    );

    if (!coords) {
      setNavError('Station coordinates are missing. Unable to generate navigation map link.');
      return;
    }

    // 2. If userLocation is already available, launch immediately (synchronous to prevent popup blockers)
    if (userLocation) {
      try {
        const url = buildGoogleMapsDirectionsUrl(coords, userLocation);
        openGoogleMaps(url);
        return;
      } catch (err) {
        setNavError(err instanceof Error ? err.message : 'Invalid station coordinates for navigation.');
        return;
      }
    }

    // 3. If not cached, inspect if location permission was already granted without prompting
    setNavigating(true);
    try {
      const origin = await getGrantedUserLocation();
      if (origin) {
        setUserLocation(origin);
      }
      const url = buildGoogleMapsDirectionsUrl(coords, origin);
      openGoogleMaps(url);
    } catch {
      // Fallback: open without origin
      try {
        const url = buildGoogleMapsDirectionsUrl(coords, null);
        openGoogleMaps(url);
      } catch (err) {
        setNavError(err instanceof Error ? err.message : 'Invalid station coordinates for navigation.');
      }
    } finally {
      setNavigating(false);
    }
  }, [completedBooking, liveStations, userLocation, setUserLocation]);

  // Guard: if user lands here without booking details and not on success screen, redirect back
  if (!pendingBookingDetails && flow !== 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-danger-400 mx-auto mb-4" />
          <h2 className="font-display font-medium text-xl text-white mb-2">No booking found</h2>
          <p className="text-ink-400 text-sm mb-6">Please go back and select a charging slot first.</p>
          <button onClick={() => navigate('reserve')} className="btn-primary w-full">
            <ArrowLeft className="w-4 h-4" /> Back to Reservation
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESSING screen
  // ─────────────────────────────────────────────────────────────────────────
  if (flow === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong p-10 max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-acid/10 border-2 border-acid/20 flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-2 border-acid border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="font-display font-medium text-xl text-white mb-2">Processing Payment</h2>
          <p className="text-ink-400 text-sm mb-4">Please do not close this window.</p>
          <div className="flex items-center justify-center gap-2 text-xs text-ink-500">
            <Shield className="w-3.5 h-3.5 text-acid" />
            Secured by 256-bit SSL encryption
          </div>
          <p className="text-xs text-acid font-medium mt-3">₹{breakdown.total} via {METHOD_LABELS[method]}</p>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS screen — receipt + navigation
  // ─────────────────────────────────────────────────────────────────────────
  if (flow === 'success' && completedBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="glass-strong p-8 max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, delay: 0.15 }}
              className="w-20 h-20 rounded-full bg-acid/15 border-2 border-acid/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-acid/10"
            >
              <CheckCircle2 className="w-10 h-10 text-acid" />
            </motion.div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-acid/10 border border-acid/30 text-acid text-sm font-semibold mb-2">
              <span>Booking Confirmed ✓</span>
            </div>
            <h2 className="font-display font-medium text-2xl text-white mb-1">Payment successful!</h2>
            <p className="text-ink-400 text-sm">Your charging slot has been reserved.</p>
          </div>

          {/* Grace Period & Slot Status Card */}
          {(() => {
            const currentBooking = bookings.find((b) => b.id === completedBooking.id) || completedBooking;
            const state = calculateBookingTimeState(currentBooking, graceConfig.gracePeriodMinutes);
            const isGrace = state.normalizedStatus === 'GRACE_PERIOD';
            const isCharging = state.normalizedStatus === 'CHARGING';
            const isReserved = state.normalizedStatus === 'RESERVED';

            return (
              <div className={`p-4 rounded-2xl mb-5 border ${
                isCharging
                  ? 'bg-sky-500/10 border-sky-400/30'
                  : isGrace
                  ? 'bg-amber-500/10 border-amber-400/40 ring-1 ring-amber-400/30'
                  : 'bg-acid/10 border-acid/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isCharging ? 'bg-sky-400 animate-ping' : isGrace ? 'bg-amber-400 animate-pulse' : 'bg-acid'
                    }`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      {isCharging ? 'Charging in Progress' : isGrace ? 'Grace Period Active' : 'Slot Reserved'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-ink-300">
                    Grace Policy: {currentBooking.gracePeriodMinutes || graceConfig.gracePeriodMinutes} mins
                  </span>
                </div>

                {isReserved && (
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">
                      Your charging slot starts at {currentBooking.startTime || currentBooking.time}.
                    </p>
                    <p className="text-xs text-ink-300">
                      When your slot starts, a {currentBooking.gracePeriodMinutes || graceConfig.gracePeriodMinutes}-minute grace period will begin.
                    </p>
                  </div>
                )}

                {isGrace && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-amber-300">Your charging slot has started.</p>
                    <p className="text-xs text-ink-200">Please arrive and start charging within your grace period.</p>
                    <div className="p-3 rounded-xl bg-ink-950/60 border border-amber-400/30 flex items-center justify-between">
                      <span className="text-xs text-ink-300 font-medium flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                        Grace Period Remaining:
                      </span>
                      <span className="font-mono font-bold text-lg text-amber-400 tracking-wider">
                        {state.countdownFormatted}
                      </span>
                    </div>
                  </div>
                )}

                {isCharging && (
                  <div>
                    <p className="text-sm font-semibold text-sky-300 mb-1 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-sky-400" /> Charging session started successfully.
                    </p>
                    <p className="text-xs text-ink-300">
                      Power is currently being delivered to your vehicle. Charger is marked Occupied.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Receipt card with core details */}
          <div className="space-y-3 p-5 rounded-xl bg-ink-800/50 border border-white/5 mb-5">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-acid" />
                <span className="text-xs font-semibold text-ink-300 uppercase tracking-wider">Booking Receipt</span>
              </div>
              <span className="text-xs font-semibold text-acid bg-acid/10 px-2.5 py-0.5 rounded-full border border-acid/20">
                Booking Confirmed ✓
              </span>
            </div>

            {[
              { label: 'Booking ID',      value: completedBooking.id, mono: true },
              { label: 'Station',         value: completedBooking.stationName, highlight: true },
              { label: 'Charger',         value: `${completedBooking.chargerNumber || 'Charger 2'} (${completedBooking.chargerType})` },
              { label: 'Date',            value: dateLabel || completedBooking.date },
              { label: 'Start Time',      value: completedBooking.startTime || completedBooking.time },
              { label: 'End Time',        value: completedBooking.endTime || 'Est. 45 min' },
              { label: 'Location',        value: completedBooking.stationLocation },
              { label: 'Amount Paid',     value: `₹${completedBooking.payment.amount}` },
              { label: 'Payment Method',  value: METHOD_LABELS[completedBooking.payment.method] || 'Pay Online' },
              { label: 'Payment Status',  value: 'PAID', badge: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm gap-2">
                <span className="text-ink-400 shrink-0">{item.label}</span>
                {item.badge ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                    {item.value}
                  </span>
                ) : (
                  <span className={`font-medium text-right ${
                    item.highlight ? 'text-white font-semibold' :
                    item.mono ? 'font-mono text-ink-200 text-xs' : 'text-ink-100'
                  }`}>
                    {item.value}
                  </span>
                )}
              </div>
            ))}

            {/* Transaction ID row with copy button */}
            <div className="flex items-center justify-between text-sm gap-2 pt-2 border-t border-white/5">
              <span className="text-ink-400 shrink-0">Transaction ID</span>
              <div className="flex items-center gap-1.5">
                <span className="text-ink-100 font-mono text-xs">{completedBooking.payment.transactionId}</span>
                <button onClick={copyTxnId} className="text-ink-400 hover:text-acid transition-colors" title="Copy transaction ID">
                  {txnCopied ? <Check className="w-3.5 h-3.5 text-acid" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons matching current booking state */}
          {(() => {
            const currentBooking = bookings.find((b) => b.id === completedBooking.id) || completedBooking;
            const state = calculateBookingTimeState(currentBooking, graceConfig.gracePeriodMinutes);
            const isGrace = state.normalizedStatus === 'GRACE_PERIOD';
            const isCharging = state.normalizedStatus === 'CHARGING';
            const isReserved = state.normalizedStatus === 'RESERVED';

            return (
              <div className="mb-5 space-y-2.5">
                <button
                  id="navigate-to-station-btn"
                  onClick={handleNavigate}
                  disabled={navigating}
                  className="w-full py-3.5 px-6 rounded-xl bg-acid text-ink-950 font-display font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-acid/20 hover:bg-acid-400 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-75 group"
                >
                  {navigating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                      <span>Preparing Navigation...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 text-ink-950 fill-current shrink-0 group-hover:scale-110 transition-transform" />
                      <span>Navigate to Station</span>
                    </>
                  )}
                </button>

                {isGrace && (
                  <button
                    onClick={() => startChargingSession(currentBooking.id)}
                    className="w-full py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-ink-950 font-display font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Start Charging Now</span>
                  </button>
                )}

                {isReserved && (
                  <button
                    onClick={() => cancelPaidBooking(currentBooking.id)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-danger-400 bg-danger-500/10 border border-danger-500/20 hover:bg-danger-500/20 transition-all cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                )}

                {/* Error notice if coordinates cannot be resolved */}
                {navError && (
                  <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-xs text-danger-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{navError}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Demo notice */}
          <p className="text-xs text-ink-500 text-center mb-5 italic">
            This is a simulated payment for demo purposes. No real money was charged.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('my-bookings')} className="btn-primary flex-1">
              <Receipt className="w-4 h-4" /> My Bookings
            </button>
            <button onClick={() => navigate('dashboard')} className="btn-secondary flex-1">
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FAILED screen
  // ─────────────────────────────────────────────────────────────────────────
  if (flow === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong p-8 max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-danger-500/15 border-2 border-danger-500/30 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-10 h-10 text-danger-400" />
          </div>
          <h2 className="font-display font-medium text-2xl text-white mb-2">Payment Failed</h2>
          <p className="text-ink-400 text-sm mb-2">{failureMsg}</p>
          <p className="text-xs text-ink-500 mb-6">No amount was charged to your account.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setFlow('enter-details'); setFailureMsg(''); }}
              className="btn-primary w-full"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button onClick={() => setFlow('select-method')} className="btn-secondary w-full">
              Change Payment Method
            </button>
            <button onClick={() => navigate('reserve')} className="btn-ghost w-full">
              <ArrowLeft className="w-4 h-4" /> Back to Reservation
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN payment UI (select-method + enter-details)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('reserve')}
            className="flex items-center gap-2 text-ink-400 hover:text-ink-200 text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Reservation
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-acid/10 border border-acid/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-acid" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-white text-2xl">Secure Payment</h1>
              <p className="text-xs text-ink-400 mt-0.5">Your payment information is protected</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left column: method picker + form */}
          <div className="lg:col-span-3 space-y-4">

            {/* Method selector */}
            <div className="glass p-5">
              <h3 className="font-display font-semibold text-white text-base mb-4">Choose Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    id={`method-${pm.id}`}
                    onClick={() => { setMethod(pm.id); setFlow('enter-details'); }}
                    className={`p-4 rounded-xl text-left transition-all border group ${
                      method === pm.id && flow === 'enter-details'
                        ? 'bg-acid/10 border-acid/30'
                        : 'bg-ink-800/50 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <pm.icon className={`w-6 h-6 mb-2 ${method === pm.id && flow === 'enter-details' ? 'text-acid' : 'text-ink-300 group-hover:text-ink-100'} transition-colors`} />
                    <p className={`text-sm font-medium ${method === pm.id && flow === 'enter-details' ? 'text-acid' : 'text-ink-100'}`}>{pm.label}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{pm.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment details form */}
            <AnimatePresence mode="wait">
              {flow === 'enter-details' && (
                <motion.div
                  key={method}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="glass p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    {PAYMENT_METHODS.find((p) => p.id === method)?.icon &&
                      (() => {
                        const Icon = PAYMENT_METHODS.find((p) => p.id === method)!.icon;
                        return <Icon className="w-5 h-5 text-acid" />;
                      })()
                    }
                    <h3 className="font-display font-semibold text-white text-base">
                      {METHOD_LABELS[method]}
                    </h3>
                  </div>

                  {method === 'upi' && (
                    <UpiFormWithAmount amount={breakdown.total} onPay={handlePay} loading={loading} />
                  )}
                  {method === 'card' && (
                    <CardForm onPay={handlePay} loading={loading} />
                  )}
                  {method === 'netbanking' && (
                    <NetBankingForm onPay={handlePay} loading={loading} />
                  )}
                  {method === 'wallet' && (
                    <WalletForm onPay={handlePay} loading={loading} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security badges */}
            <div className="glass p-4 flex flex-wrap items-center gap-4 text-xs text-ink-400">
              <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-acid" />SSL Encrypted</div>
              <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-acid" />PCI-DSS Compliant</div>
              <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-acid" />No Card Storage</div>
            </div>
          </div>

          {/* Right column: order summary */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <OrderSummary
                breakdown={breakdown}
                stationName={stationName}
                stationLocation={stationLocation}
                chargerType={chargerType}
                dateLabel={dateLabel}
                time={time}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// UPI form with amount baked in for the Pay button label
function UpiFormWithAmount({ amount, onPay, loading }: { amount: number; onPay: (detail: string) => void; loading: boolean }) {
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');

  const handlePay = () => {
    const err = validateUpiId(upiId);
    if (err) { setError(err); return; }
    onPay(upiId.trim());
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-ink-300 block mb-1.5">UPI ID</label>
        <input
          id="upi-id-input"
          type="text"
          value={upiId}
          onChange={(e) => { setUpiId(e.target.value); setError(''); }}
          placeholder="yourname@upi"
          className={`input-field ${error ? 'border-danger-500/60 focus:border-danger-500' : ''}`}
          autoComplete="off"
        />
        {error && (
          <p className="mt-1 text-xs text-danger-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
        <p className="mt-1.5 text-xs text-ink-500">Example: name@okicici · mobile@paytm · name@ybl</p>
      </div>
      <button
        id="upi-pay-btn"
        onClick={handlePay}
        disabled={loading || !upiId}
        className="btn-primary w-full"
      >
        {loading
          ? <><div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" /> Processing...</>
          : <><Smartphone className="w-4 h-4" /> Pay ₹{amount}</>}
      </button>
    </div>
  );
}
