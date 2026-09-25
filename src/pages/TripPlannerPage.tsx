import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, MapPin, BatteryCharging, Zap, Clock, Route,
  ArrowLeft, ArrowRight, Car, Loader, Info,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui';
import { generateTripPlan } from '@/utils/tripPlanner';
import { setRecentTrip } from '@/utils/storage';
import type { TripPlan } from '@/types';

export function TripPlannerPage() {
  const { navigate } = useApp();
  const [from, setFrom] = useState('Hyderabad');
  const [to, setTo] = useState('Vijayawada');
  const [battery, setBattery] = useState(64);
  const [range, setRange] = useState(320);
  const [vehicleModel, setVehicleModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [error, setError] = useState('');

  const handlePlan = () => {
    if (!from.trim() || !to.trim()) {
      setError('Please enter both starting location and destination.');
      return;
    }
    if (battery < 5) {
      setError('Battery too low for trip planning. Please charge first.');
      return;
    }
    setError('');
    setLoading(true);
    setPlan(null);

    setTimeout(() => {
      const tripDistance = Math.round(280 + Math.random() * 200);
      const result = generateTripPlan(tripDistance, battery, range, from, to);
      setPlan(result);
      setRecentTrip({ from, to, distance: tripDistance, date: new Date().toISOString() });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          label="Module 4 — Plan"
          title="Smart Trip Planner"
          subtitle="Plan your entire trip around your battery level and charging needs. Get intelligent charging stop recommendations."
        />

        <div className="grid lg:grid-cols-5 gap-6 pb-20">
          {/* Inputs */}
          <div className="lg:col-span-2">
            <div className="glass p-6 lg:sticky lg:top-24">
              <h3 className="font-display font-semibold text-white text-lg mb-6">Trip Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">Starting Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-acid" />
                    <input
                      type="text"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">Destination</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-acid" />
                    <input
                      type="text"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="e.g. Vijayawada"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-ink-300">Current Battery</label>
                    <span className="text-sm font-semibold text-acid">{battery}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BatteryCharging className="w-5 h-5 text-acid shrink-0" />
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={battery}
                      onChange={(e) => setBattery(Number(e.target.value))}
                      className="flex-1 accent-acid"
                    />
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                    <div className="h-full bg-acid rounded-full transition-all" style={{ width: `${battery}%` }} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">Vehicle Range (km)</label>
                  <div className="relative">
                    <Route className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-acid" />
                    <input
                      type="number"
                      value={range}
                      onChange={(e) => setRange(Number(e.target.value))}
                      placeholder="e.g. 320"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">Vehicle Model (optional)</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-acid" />
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Tata Nexon EV"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-sm text-danger-400">
                    {error}
                  </div>
                )}

                <button onClick={handlePlan} className="btn-primary w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Generating Route...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Generate Smart Route
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-ink-800/50 border border-white/5">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-acid shrink-0 mt-0.5" />
                  <p className="text-xs text-ink-400">
                    Route information is estimated based on your battery and vehicle range. Actual results may vary.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass p-12 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-acid/10 border-2 border-acid/20 flex items-center justify-center mx-auto mb-4">
                    <Loader className="w-8 h-8 text-acid animate-spin" />
                  </div>
                  <p className="text-ink-300">Calculating optimal route and charging stops...</p>
                </motion.div>
              )}

              {!loading && !plan && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass p-12 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-ink-800 border border-white/5 flex items-center justify-center mx-auto mb-4">
                    <Route className="w-8 h-8 text-ink-500" />
                  </div>
                  <p className="text-ink-300 mb-2">No trip planned yet.</p>
                  <p className="text-sm text-ink-400">Enter your trip details and click "Generate Smart Route" to see your journey plan.</p>
                </motion.div>
              )}

              {!loading && plan && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Route Summary */}
                  <div className="glass p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display font-medium text-white text-xl">Your Trip</h3>
                      <span className="text-xs text-ink-400">{from} → {to}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: Route, label: 'Distance', value: `${plan.totalDistance} km` },
                        { icon: Clock, label: 'Est. Time', value: plan.estimatedTime },
                        { icon: Zap, label: 'Charging Stops', value: `${plan.chargingStops}` },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center p-4 rounded-xl bg-ink-800/50 border border-white/5">
                          <stat.icon className="w-6 h-6 text-acid mx-auto mb-2" />
                          <p className="font-display font-medium text-white text-xl">{stat.value}</p>
                          <p className="text-xs text-ink-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Journey Timeline */}
                  <div className="glass p-6">
                    <h3 className="font-display font-semibold text-white text-lg mb-6">Journey Timeline</h3>
                    <div className="space-y-1">
                      {plan.stops.map((stop, i) => (
                        <div key={i}>
                          <TimelineStop stop={stop} isLast={i === plan.stops.length - 1} />
                          {i < plan.stops.length - 1 && (
                            <div className="flex justify-center py-1">
                              <div className="w-0.5 h-6 bg-acid/20 rounded-full" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="glass p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-acid/10 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-acid" />
                      </div>
                      <p className="text-sm text-ink-300">
                        Charging stops are recommended because your estimated battery level may become low before the next suitable charging point. Charging to 80% optimizes for speed and battery health.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => navigate('reserve')} className="btn-secondary flex-1">
                      Reserve a Charging Slot
                    </button>
                    <button onClick={() => navigate('dashboard')} className="btn-primary flex-1">
                      View Dashboard
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineStop({ stop, isLast }: { stop: TripPlan['stops'][number]; isLast: boolean }) {
  const config = {
    start: { icon: MapPin, color: 'text-acid', bg: 'bg-acid/15 border-acid/30' },
    drive: { icon: Navigation, color: 'text-ink-300', bg: 'bg-ink-800/50 border-white/5' },
    charge: { icon: Zap, color: 'text-acid', bg: 'bg-acid/10 border-acid/20' },
    destination: { icon: MapPin, color: 'text-acid', bg: 'bg-acid/15 border-acid/30' },
  };
  const c = config[stop.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${c.bg}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stop.isCharging ? 'bg-acid/15' : 'bg-ink-800'}`}>
        <c.icon className={`w-5 h-5 ${c.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-100">{stop.label}</p>
        {stop.stationName && (
          <p className="text-xs text-ink-400 mt-0.5">{stop.stationName}</p>
        )}
        {stop.chargerType && (
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="text-ink-400">Charger: <span className="text-acid">{stop.chargerType}</span></span>
            {stop.chargeDuration && (
              <span className="text-ink-400">Duration: <span className="text-acid">{stop.chargeDuration}</span></span>
            )}
          </div>
        )}
        {stop.distanceFromPrev > 0 && stop.type === 'drive' && (
          <p className="text-xs text-ink-400 mt-0.5">{stop.distanceFromPrev} km segment</p>
        )}
        {stop.batteryAtStop !== undefined && (
          <div className="flex items-center gap-1.5 mt-2">
            <BatteryCharging className="w-3.5 h-3.5 text-acid" />
            <div className="flex-1 h-1.5 rounded-full bg-ink-700 overflow-hidden max-w-[100px]">
              <div
                className={`h-full rounded-full ${stop.batteryAtStop < 20 ? 'bg-danger-400' : 'bg-acid'}`}
                style={{ width: `${stop.batteryAtStop}%` }}
              />
            </div>
            <span className="text-xs text-ink-400 font-medium">{stop.batteryAtStop}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
