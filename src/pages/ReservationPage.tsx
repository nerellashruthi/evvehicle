import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck, CheckCircle2, Calendar, Clock, Zap, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui';
import { stations as stationData, timeSlots } from '@/data/stations';
import { generateReservationId } from '@/utils/tripPlanner';
import type { ChargerType, Reservation } from '@/types';

export function ReservationPage() {
  const { selectedStation, selectStation, navigate, addReservation, user } = useApp();
  const [step, setStep] = useState(1);
  const [chargerType, setChargerType] = useState<ChargerType>('Fast');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      const reservation: Reservation = {
        id: generateReservationId(),
        stationId: station.id,
        stationName: station.name,
        chargerType,
        date,
        time: timeSlot,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      addReservation(reservation);
      setConfirmed(reservation);
      setLoading(false);
    }, 1200);
  };

  const reset = () => {
    setConfirmed(null);
    setStep(1);
    setChargerType('Fast');
    setDate('');
    setTimeSlot('');
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-electric-500/15 border-2 border-electric-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-electric-400" />
          </motion.div>

          <h2 className="font-display font-bold text-2xl text-white mb-2">Reservation Confirmed</h2>
          <p className="text-ink-400 text-sm mb-6">Your charging slot has been booked successfully.</p>

          <div className="space-y-3 text-left p-5 rounded-xl bg-ink-800/50 border border-white/5 mb-6">
            {[
              { label: 'Station', value: confirmed.stationName },
              { label: 'Charger Type', value: confirmed.chargerType },
              { label: 'Date', value: dateOptions.find((d) => d.value === confirmed.date)?.label || confirmed.date },
              { label: 'Time', value: confirmed.time },
              { label: 'Reservation ID', value: confirmed.id },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-ink-400">{item.label}</span>
                <span className="text-ink-100 font-medium">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('dashboard')} className="btn-primary flex-1">
              View Dashboard
            </button>
            <button onClick={reset} className="btn-secondary flex-1">
              New Reservation
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > i + 1 ? 'bg-electric-500 text-ink-950' :
                  step === i + 1 ? 'bg-electric-500/20 text-electric-400 border-2 border-electric-500/40' :
                  'bg-ink-800 text-ink-500 border border-white/5'
                }`}>
                  {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step >= i + 1 ? 'text-ink-200' : 'text-ink-500'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-5 transition-colors ${step > i + 1 ? 'bg-electric-500/40' : 'bg-white/5'}`} />
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
                        ? 'bg-electric-500/10 border-electric-500/30'
                        : 'bg-ink-800/50 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-ink-100 text-sm">{s.name}</p>
                      <span className={`text-xs font-medium ${s.status === 'Available' ? 'text-electric-400' : s.status === 'Limited' ? 'text-amber-400' : 'text-danger-400'}`}>
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
                        ? 'bg-electric-500/10 border-electric-500/30'
                        : c.availablePorts === 0
                        ? 'bg-ink-800/30 border-white/5 opacity-50 cursor-not-allowed'
                        : 'bg-ink-800/50 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-electric-500/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-electric-400" />
                      </div>
                      <div>
                        <p className="font-medium text-ink-100 text-sm">{c.type} Charger</p>
                        <p className="text-xs text-ink-400">{c.speedKW} kW · {c.availablePorts} of {c.totalPorts} available</p>
                      </div>
                    </div>
                    {chargerType === c.type && <CheckCircle2 className="w-5 h-5 text-electric-400" />}
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
                        ? 'bg-electric-500/10 border-electric-500/30 text-electric-400'
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
                {timeSlots.map((slot, i) => {
                  const isBooked = i === 5 || i === 11;
                  return (
                    <button
                      key={slot}
                      onClick={() => !isBooked && setTimeSlot(slot)}
                      disabled={isBooked}
                      className={`px-3 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                        timeSlot === slot
                          ? 'bg-electric-500 text-ink-950'
                          : isBooked
                          ? 'bg-ink-700/50 text-ink-500 line-through cursor-not-allowed'
                          : 'bg-ink-800/50 border border-white/10 text-ink-200 hover:border-electric-500/30'
                      }`}
                    >
                      {slot}
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

          {/* Step 5: Confirm */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Confirm Reservation</h3>
              <div className="space-y-3 p-5 rounded-xl bg-ink-800/50 border border-white/5 mb-6">
                {[
                  { icon: CalendarCheck, label: 'Station', value: station.name },
                  { icon: Zap, label: 'Charger Type', value: chargerType },
                  { icon: Calendar, label: 'Date', value: dateOptions.find((d) => d.value === date)?.label || date },
                  { icon: Clock, label: 'Time', value: timeSlot },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-ink-400">
                      <item.icon className="w-4 h-4 text-electric-400" />
                      {item.label}
                    </div>
                    <span className="text-ink-100 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(4)} className="btn-secondary">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleConfirm} className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Reservation
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
