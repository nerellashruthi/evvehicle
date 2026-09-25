import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck, CheckCircle2, Calendar, Clock, Zap, ArrowLeft, ArrowRight, CreditCard,
  Navigation,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui';
import { stations as stationData, timeSlots } from '@/data/stations';
import type { ChargerType, BookingWithPayment } from '@/types';
import { generateReservationId } from '@/utils/tripPlanner';
import { parseSlotTimestamps } from '@/services/gracePeriodService';
import { calculateBreakdown } from '@/utils/payment';
import {
  buildGoogleMapsDirectionsUrl,
  getStationCoordinates,
  getGrantedUserLocation,
  openGoogleMaps,
} from '@/utils/navigation';

export function ReservationPage() {
  const {
    selectedStation,
    selectStation,
    navigate,
    setPendingBookingDetails,
    bookings,
    addBooking,
    addReservation,
    graceConfig,
    addNotification,
    userLocation,
    user,
  } = useApp();
  const [step, setStep] = useState(1);
  const [chargerType, setChargerType] = useState<ChargerType>('Fast');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'ONLINE' | 'PAY_AT_STATION'>('ONLINE');
  const [confirmedStationBooking, setConfirmedStationBooking] = useState<BookingWithPayment | null>(null);
  const [navigating, setNavigating] = useState(false);

  const station = selectedStation || stationData[0];

  const today = new Date();
  const dateOptions = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      value: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });

  const breakdown = calculateBreakdown(chargerType);

  const handleProceedBooking = () => {
    if (paymentChoice === 'ONLINE') {
      setPendingBookingDetails({
        stationId:       station.id,
        stationName:     station.name,
        stationLocation: station.location,
        lat:             station.lat,
        lng:             station.lng,
        chargerType,
        date,
        time:            timeSlot,
        dateLabel:       dateOptions.find((d) => d.value === date)?.label || date,
        paymentChoice:   'ONLINE',
      });
      navigate('payment');
    } else {
      // Pay at Station flow
      const bookingId = generateReservationId();
      const dateLbl = dateOptions.find((d) => d.value === date)?.label || date;
      const { slotStartTimestamp, slotEndTimestamp, gracePeriodEndTimestamp, startTimeLabel, endTimeLabel } =
        parseSlotTimestamps(date, timeSlot, graceConfig.gracePeriodMinutes);
      const isImmediate = Date.now() >= slotStartTimestamp && Date.now() < gracePeriodEndTimestamp;

      const newBooking: BookingWithPayment = {
        id: bookingId,
        stationId: station.id,
        stationName: station.name,
        stationLocation: station.location,
        lat: station.lat,
        lng: station.lng,
        chargerType,
        chargerNumber: 'DC Fast Charger 2',
        date,
        time: timeSlot,
        startTime: startTimeLabel,
        endTime: endTimeLabel,
        slotStartTimestamp,
        slotEndTimestamp,
        gracePeriodMinutes: graceConfig.gracePeriodMinutes,
        gracePeriodEndTimestamp,
        status: isImmediate ? 'GRACE_PERIOD' : 'RESERVED',
        createdAt: new Date().toISOString(),
        payment: {
          transactionId: `STN-${bookingId.slice(-6)}`,
          method: 'PAY_AT_STATION',
          methodDetail: 'Pay at Station on Arrival',
          amount: breakdown.total,
          status: 'PENDING',
          paidAt: '',
          refundStatus: 'NOT_APPLICABLE',
        },
        breakdown,
        originalPaymentAmount: breakdown.total,
        noShowCharge: 0,
        refundAmount: 0,
        refundStatus: 'NOT_APPLICABLE',
        userName: user?.name || 'EV Driver',
        userEmail: user?.email || 'user@example.com',
      };

      addBooking(newBooking);
      addReservation({
        id: bookingId,
        stationId: station.id,
        stationName: station.name,
        lat: station.lat,
        lng: station.lng,
        chargerType,
        date,
        time: timeSlot,
        status: newBooking.status,
        createdAt: newBooking.createdAt,
        startTime: startTimeLabel,
        endTime: endTimeLabel,
        slotStartTimestamp,
        slotEndTimestamp,
        gracePeriodMinutes: graceConfig.gracePeriodMinutes,
        gracePeriodEndTimestamp,
        chargerNumber: 'DC Fast Charger 2',
      });

      addNotification({
        id: `NTF-STN-BOOK-${bookingId}-${Date.now()}`,
        title: 'Pay-at-Station Booking Confirmed',
        message: `Your slot at ${station.name} is reserved. Please pay ₹${breakdown.total} at the station upon arrival.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        actionLabel: 'View Booking',
        actionData: { bookingId },
      });

      setConfirmedStationBooking(newBooking);
    }
  };

  const handleNavigateStation = async () => {
    if (!confirmedStationBooking) return;
    setNavigating(true);
    try {
      const coords = getStationCoordinates({
        stationId: confirmedStationBooking.stationId,
        stationName: confirmedStationBooking.stationName,
        lat: confirmedStationBooking.lat,
        lng: confirmedStationBooking.lng,
      });
      if (coords) {
        const origin = (await getGrantedUserLocation()) ?? userLocation ?? undefined;
        const url = buildGoogleMapsDirectionsUrl(coords, origin);
        openGoogleMaps(url);
      }
    } finally {
      setNavigating(false);
    }
  };

  const steps = ['Station', 'Charger', 'Date', 'Time', 'Confirm'];

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          label="Module 3 — Reserve"
          title="Slot Reservation"
          subtitle="Select a station and reserve a charging slot in just a few steps."
        />

        {/* Progress steps */}
        <div className="flex items-center justify-between mb-8 glass p-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  step > i + 1 ? 'bg-acid text-ink-950' :
                  step === i + 1 ? 'bg-acid/20 text-acid border-2 border-acid/40' :
                  'bg-ink-800 text-ink-500 border border-white/5'
                }`}>
                  {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step >= i + 1 ? 'text-ink-200' : 'text-ink-500'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-5 transition-colors ${step > i + 1 ? 'bg-acid/40' : 'bg-white/5'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Station */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Select a Station</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {stationData.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { selectStation(s); }}
                    className={`p-4 rounded-xl text-left transition-all border ${
                      selectedStation?.id === s.id
                        ? 'bg-acid/10 border-acid/30'
                        : 'bg-ink-800/50 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-ink-100 text-sm">{s.name}</p>
                      <span className={`text-xs font-medium ${s.status === 'Available' ? 'text-acid' : s.status === 'Limited' ? 'text-amber-400' : 'text-danger-400'}`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-400">{s.location} · {s.distanceKm} km</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setStep(2)} className="btn-primary" disabled={!selectedStation && !station}>
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Charger Type */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Select Charger Type</h3>
              <div className="space-y-3">
                {station.chargers.map((c) => (
                  <button
                    key={c.type}
                    onClick={() => setChargerType(c.type)}
                    disabled={c.availablePorts === 0}
                    className={`w-full p-4 rounded-xl text-left transition-all border flex items-center justify-between ${
                      chargerType === c.type
                        ? 'bg-acid/10 border-acid/30'
                        : c.availablePorts === 0
                        ? 'bg-ink-800/30 border-white/5 opacity-50 cursor-not-allowed'
                        : 'bg-ink-800/50 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-acid/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-acid" />
                      </div>
                      <div>
                        <p className="font-medium text-ink-100 text-sm">{c.type} Charger</p>
                        <p className="text-xs text-ink-400">{c.speedKW} kW · {c.availablePorts} of {c.totalPorts} available</p>
                      </div>
                    </div>
                    {chargerType === c.type && <CheckCircle2 className="w-5 h-5 text-acid" />}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Select Date */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Select a Date</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dateOptions.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDate(d.value)}
                    className={`p-4 rounded-xl text-center transition-all border ${
                      date === d.value
                        ? 'bg-acid/10 border-acid/30 text-acid'
                        : 'bg-ink-800/50 border-white/5 text-ink-200 hover:border-white/15'
                    }`}
                  >
                    <Calendar className="w-5 h-5 mx-auto mb-2" />
                    <p className="text-sm font-medium">{d.label}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(2)} className="btn-secondary">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep(4)} className="btn-primary" disabled={!date}>
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Select Time */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Select a Time Slot</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {timeSlots.map((slot) => {
                  const isBooked = bookings.some(
                    (b) =>
                      b.stationId === station.id &&
                      b.date === date &&
                      (b.time.includes(slot) || slot.includes(b.time) || b.startTime === slot) &&
                      ['RESERVED', 'GRACE_PERIOD', 'CHARGING', 'confirmed'].includes(b.status)
                  );
                  return (
                    <button
                      key={slot}
                      onClick={() => !isBooked && setTimeSlot(slot)}
                      disabled={isBooked}
                      className={`px-3 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                        timeSlot === slot
                          ? 'bg-acid text-ink-950 font-bold'
                          : isBooked
                          ? 'bg-ink-800/40 text-ink-500 border border-white/5 cursor-not-allowed opacity-60'
                          : 'bg-ink-800/50 border border-white/10 text-ink-200 hover:border-acid/30 cursor-pointer'
                      }`}
                    >
                      <span>{slot}</span>
                      {isBooked && (
                        <span className="block text-[9px] uppercase font-bold text-rose-400/80 tracking-wide mt-0.5">
                          Reserved
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(3)} className="btn-secondary">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep(5)} className="btn-primary" disabled={!timeSlot}>
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Choose Payment Method & Confirm */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-6"
            >
              {confirmedStationBooking ? (
                /* ── Pay at Station Confirmed Screen ── */
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="font-display font-bold text-white text-xl">Booking confirmed!</h3>
                    <p className="text-ink-300 text-sm mt-1">Please pay at the station after you arrive.</p>
                  </div>

                  <div className="space-y-3 p-5 rounded-xl bg-ink-800/60 border border-white/10 mb-6">
                    {[
                      { label: 'Booking ID',      value: confirmedStationBooking.id, mono: true },
                      { label: 'Station',         value: confirmedStationBooking.stationName, highlight: true },
                      { label: 'Charger',         value: `${confirmedStationBooking.chargerNumber || 'Charger 2'} (${confirmedStationBooking.chargerType})` },
                      { label: 'Date',            value: dateOptions.find((d) => d.value === date)?.label || confirmedStationBooking.date },
                      { label: 'Start Time',      value: confirmedStationBooking.startTime || confirmedStationBooking.time },
                      { label: 'End Time',        value: confirmedStationBooking.endTime || 'Est. 45 min' },
                      { label: 'Amount',          value: `₹${confirmedStationBooking.payment.amount}` },
                      { label: 'Payment Method',  value: 'Pay at Station' },
                      { label: 'Payment Status',  value: 'Pending', badge: true },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm gap-2">
                        <span className="text-ink-400 shrink-0">{item.label}</span>
                        {item.badge ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30">
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
                  </div>

                  {/* Navigation CTA */}
                  <div className="space-y-3">
                    <button
                      id="navigate-to-station-btn"
                      onClick={handleNavigateStation}
                      disabled={navigating}
                      className="w-full py-3.5 px-6 rounded-xl bg-acid text-ink-950 font-display font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-acid/20 hover:bg-acid-400 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
                    >
                      {navigating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                          <span>Preparing Navigation...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-5 h-5 text-ink-950 fill-current" />
                          <span>Navigate to Station</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => navigate('my-bookings')}
                      className="w-full py-3 px-6 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 font-medium text-sm border border-white/10 transition-colors"
                    >
                      View in My Bookings
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Review & Payment Method Choice ── */
                <div>
                  <h3 className="font-display font-semibold text-white text-lg mb-1">Review Booking Details</h3>
                  <p className="text-xs text-ink-400 mb-4">Confirm your slot and select your preferred payment mode.</p>

                  <div className="space-y-2.5 p-4 rounded-xl bg-ink-800/40 border border-white/5 mb-6">
                    {[
                      { icon: CalendarCheck, label: 'Station',      value: station.name },
                      { icon: Zap,          label: 'Charger Type', value: chargerType },
                      { icon: Calendar,     label: 'Date',         value: dateOptions.find((d) => d.value === date)?.label || date },
                      { icon: Clock,        label: 'Time',         value: timeSlot },
                      { icon: CreditCard,   label: 'Amount',       value: `₹${breakdown.total}` },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-ink-400">
                          <item.icon className="w-3.5 h-3.5 text-acid" />
                          {item.label}
                        </div>
                        <span className="text-ink-100 font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Choose Payment Method */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-white mb-3">Choose Payment Method</label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {/* Option 1: Pay Online */}
                      <button
                        type="button"
                        onClick={() => setPaymentChoice('ONLINE')}
                        className={`p-4 rounded-xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                          paymentChoice === 'ONLINE'
                            ? 'bg-acid/10 border-acid/50 shadow-md shadow-acid/10 ring-1 ring-acid/40'
                            : 'bg-ink-800/50 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              paymentChoice === 'ONLINE' ? 'border-acid bg-acid' : 'border-ink-500 bg-transparent'
                            }`}>
                              {paymentChoice === 'ONLINE' && <div className="w-1.5 h-1.5 rounded-full bg-ink-950" />}
                            </div>
                            <span className="font-semibold text-white text-sm">Pay Online</span>
                          </div>
                          <span className="font-display font-bold text-acid text-base">₹{breakdown.total}</span>
                        </div>
                        <p className="text-xs text-ink-300 pl-6 leading-relaxed">
                          Pay now and reserve your charging slot. Secure online payment.
                        </p>
                      </button>

                      {/* Option 2: Pay at Station */}
                      <button
                        type="button"
                        onClick={() => setPaymentChoice('PAY_AT_STATION')}
                        className={`p-4 rounded-xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                          paymentChoice === 'PAY_AT_STATION'
                            ? 'bg-acid/10 border-acid/50 shadow-md shadow-acid/10 ring-1 ring-acid/40'
                            : 'bg-ink-800/50 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              paymentChoice === 'PAY_AT_STATION' ? 'border-acid bg-acid' : 'border-ink-500 bg-transparent'
                            }`}>
                              {paymentChoice === 'PAY_AT_STATION' && <div className="w-1.5 h-1.5 rounded-full bg-ink-950" />}
                            </div>
                            <span className="font-semibold text-white text-sm">Pay at Station</span>
                          </div>
                          <span className="font-display font-bold text-ink-200 text-base">₹{breakdown.total}</span>
                        </div>
                        <p className="text-xs text-ink-300 pl-6 leading-relaxed">
                          Reserve your slot and pay at the charging station after you arrive.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button onClick={() => setStep(4)} className="btn-secondary">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      onClick={handleProceedBooking}
                      className="btn-primary"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Booking
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
