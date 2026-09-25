import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Zap, BatteryCharging, CheckCircle2,
  AlertTriangle, Clock, X, CornerDownLeft,
  Compass, CreditCard
} from 'lucide-react';
import type { ChargerType } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  generateAIRecommendations,
  parseUserQuery,
  type StationRecommendation,
  type PreBookingSummary,
  initiatePayment,
  joinWaitlist,
} from '@/services/aiAgentService';

export function ChargeNixAICard() {
  const {
    user,
    liveStations,
    userLocation,
    setPendingBookingDetails,
    navigate,
    addToWaitlist,
    addNotification,
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [batteryPercent, setBatteryPercent] = useState<number>(user?.batteryPercent ?? 18);
  const [destination, setDestination] = useState<string>('');
  const [thinking, setThinking] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recommendations, setRecommendations] = useState<StationRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<'BEST BALANCE' | 'FASTEST' | 'CHEAPEST'>('BEST BALANCE');
  const [confirmSummary, setConfirmSummary] = useState<PreBookingSummary | null>(null);
  const [waitlistSuccessMsg, setWaitlistSuccessMsg] = useState<string | null>(null);

  const isLowBattery = batteryPercent <= 20;

  // ── Trigger AI Analysis ───────────────────────────────────────────────────
  const handleAnalyze = (overrideQuery?: string, overrideBattery?: number, overrideDest?: string) => {
    setThinking(true);
    setWaitlistSuccessMsg(null);

    const queryToUse = overrideQuery ?? inputQuery;
    const parsed = queryToUse ? parseUserQuery(queryToUse) : null;
    const effBattery = overrideBattery ?? (parsed?.batteryPercent !== undefined ? parsed.batteryPercent : batteryPercent);
    const effDest = overrideDest ?? (parsed?.destination || destination);

    if (parsed?.batteryPercent !== undefined) {
      setBatteryPercent(parsed.batteryPercent);
    }
    if (parsed?.destination) {
      setDestination(parsed.destination);
    }

    // Direct routing for specific intents
    if (parsed?.intent === 'my_bookings') {
      setThinking(false);
      navigate('my-bookings');
      return;
    }
    if (parsed?.intent === 'plan_route') {
      setThinking(false);
      navigate('trip-planner');
      return;
    }

    // Simulate realistic AI telemetry deliberation
    setTimeout(() => {
      const coords = userLocation || { lat: 17.3850, lng: 78.4867 };
      const result = generateAIRecommendations(
        {
          currentBatteryPercent: effBattery,
          destination: effDest,
          vehicleModel: user?.vehicleModel,
          vehicleRangeKm: user?.vehicleRange,
        },
        liveStations,
        coords
      );

      setRecommendations(result.recommendations);
      if (parsed?.intent === 'cheaper') setActiveTab('CHEAPEST');
      else if (parsed?.intent === 'faster') setActiveTab('FASTEST');
      else setActiveTab('BEST BALANCE');

      setThinking(false);
      setHasSearched(true);
    }, 650);
  };

  // ── Pre-Booking Confirmation Handlers ─────────────────────────────────────
  const handleSelectOption = (rec: StationRecommendation) => {
    const today = new Date().toISOString().split('T')[0];
    const defaultTime = '02:00 PM';

    setConfirmSummary({
      stationId: rec.station.id,
      stationName: rec.station.name,
      stationLocation: rec.station.location,
      chargerType: rec.chargerType,
      date: today,
      dateLabel: 'Today',
      timeSlot: defaultTime,
      estimatedCost: rec.estimatedCostInr,
      estimatedMinutes: rec.estimatedTimeMin,
      lat: rec.station.lat,
      lng: rec.station.lng,
    });
  };

  const handleConfirmAndBook = () => {
    if (!confirmSummary) return;

    // Check availability again before proceeding (Section 6)
    const freshStation = liveStations.find((s) => s.id === confirmSummary.stationId);
    const charger = freshStation?.chargers.find((c) => c.type === confirmSummary.chargerType);

    if (charger && charger.availablePorts === 0) {
      // Station became occupied
      setConfirmSummary(null);
      alert('This charger was just occupied by another vehicle. You can join the waitlist instead.');
      return;
    }

    // Initiate payment flow
    initiatePayment(confirmSummary, setPendingBookingDetails, navigate);
  };

  const handleJoinWaitlist = (stationName: string, stationId: string, chargerType: string) => {
    const entry = joinWaitlist(stationId, stationName, chargerType as ChargerType);
    addToWaitlist(entry);
    setWaitlistSuccessMsg(`You joined the waitlist for ${stationName}. We will notify you the moment a ${chargerType} port opens.`);
    addNotification({
      id: `WL-NTF-${Date.now()}`,
      title: 'Waitlist Joined',
      message: `You are in queue for ${chargerType} charger at ${stationName}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
    });
  };

  const selectedRec = recommendations.find((r) => r.tier === activeTab) || recommendations[0];

  return (
    <div className="w-full">
      <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
        {/* Glowing atmospheric gradient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-acid/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header (Section 15) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-acid/15 border border-acid/30 flex items-center justify-center shadow-lg shadow-acid/10">
              <Sparkles className="w-6 h-6 text-acid animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-2xl text-white tracking-tight">ChargeNix AI</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-acid/15 border border-acid/30 text-acid">
                  Agent Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-300">Your intelligent EV charging assistant</p>
            </div>
          </div>

          {/* Quick Battery Slider Preview */}
          <div className="flex items-center gap-3 bg-ink-900/60 p-2.5 rounded-2xl border border-white/5">
            <BatteryCharging className={`w-5 h-5 ${isLowBattery ? 'text-danger-400 animate-bounce' : 'text-acid'}`} />
            <div className="flex flex-col">
              <span className="text-[11px] text-ink-400">Current Battery</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={batteryPercent}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setBatteryPercent(val);
                    if (hasSearched) handleAnalyze(undefined, val, undefined);
                  }}
                  className="w-20 accent-acid cursor-pointer"
                />
                <span className={`text-xs font-bold font-mono ${isLowBattery ? 'text-danger-400' : 'text-white'}`}>
                  {batteryPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Low Battery Warning Banner (Section 10: Emergency Low-Battery Mode) */}
        {isLowBattery && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-danger-500/10 border border-danger-500/30 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-danger-400">Emergency Low-Battery Mode Activated</p>
              <p className="text-ink-300 mt-0.5 leading-relaxed">
                Your battery level is low ({batteryPercent}%). ChargeNix found nearby charging options that may be reachable based on available vehicle telemetry.
              </p>
            </div>
          </motion.div>
        )}

        {/* Suggested Actions (Section 15) */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { label: '⚡ Find a Charger', query: `Find a charger nearby for ${batteryPercent}% battery` },
            { label: '🗺️ Plan My Route', query: `I need to travel to Warangal with ${batteryPercent}% battery` },
            { label: '⏱️ Check Availability', query: 'Check available chargers right now' },
            { label: '🎯 Optimize My Charging', query: 'Show best balance charging station' },
            { label: '📋 My Bookings', query: 'Show my bookings' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setInputQuery(action.query);
                handleAnalyze(action.query);
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-ink-800/60 border border-white/5 text-ink-300 hover:text-white hover:border-acid/30 hover:bg-acid/5 transition-all cursor-pointer"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Natural Language Prompt Input */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 bg-ink-900/80 rounded-2xl border border-white/10 p-2 focus-within:border-acid/50 transition-all shadow-inner">
            <Compass className="w-5 h-5 text-ink-400 ml-2" />
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAnalyze();
              }}
              placeholder='e.g., "I have 18% battery and need to travel to Warangal."'
              className="flex-1 bg-transparent text-sm text-white placeholder-ink-500 focus:outline-none px-2"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={thinking}
              className="btn-primary py-2 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-acid/20 disabled:opacity-60 cursor-pointer"
            >
              {thinking ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Ask AI</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success/Status Feedback Banner */}
        {waitlistSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs text-sky-300 flex items-center justify-between mb-4"
          >
            <span>{waitlistSuccessMsg}</span>
            <button onClick={() => setWaitlistSuccessMsg(null)} className="text-ink-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Thinking State Animation */}
        <AnimatePresence>
          {thinking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 rounded-2xl bg-ink-900/50 border border-acid/20 text-center my-4 overflow-hidden"
            >
              <div className="w-12 h-12 rounded-full bg-acid/10 border border-acid/30 flex items-center justify-center mx-auto mb-3 animate-spin">
                <Sparkles className="w-6 h-6 text-acid" />
              </div>
              <p className="text-sm font-semibold text-white">Observing &amp; Analyzing Live Network</p>
              <p className="text-xs text-ink-400 mt-1">
                Comparing distance, battery telemetry, charger speeds, and route compatibility...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Recommendations View (Section 3 & 4) */}
        {hasSearched && recommendations.length > 0 && !thinking && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Tiers Navigation Tabs: FASTEST | CHEAPEST | BEST BALANCE */}
            <div className="flex items-center gap-2 p-1.5 bg-ink-900/70 rounded-2xl border border-white/5">
              {(['BEST BALANCE', 'FASTEST', 'CHEAPEST'] as const).map((tier) => {
                const opt = recommendations.find((r) => r.tier === tier);
                const isActive = activeTab === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => setActiveTab(tier)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-acid text-ink-950 shadow-md shadow-acid/20'
                        : 'text-ink-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{tier === 'FASTEST' ? '⚡' : tier === 'CHEAPEST' ? '💰' : '✨'}</span>
                    <span>{tier}</span>
                    {opt && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-ink-950/20 text-ink-950' : 'bg-ink-800 text-ink-300'}`}>
                        {tier === 'FASTEST' ? `${opt.speedKw}kW` : tier === 'CHEAPEST' ? `₹${opt.estimatedCostInr}` : `${opt.distanceKm}km`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Option Detail Card */}
            {selectedRec && (
              <div className="glass p-5 rounded-2xl border border-white/10 space-y-4 relative">
                {/* Badge & Quick Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display font-bold text-lg text-white">{selectedRec.station.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-acid/15 border border-acid/30 text-acid">
                        {selectedRec.tier}
                      </span>
                      {selectedRec.availablePorts === 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger-500/15 border border-danger-500/30 text-danger-400">
                          Fully Occupied
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-400 mt-0.5">{selectedRec.station.location} · {selectedRec.distanceKm} km away</p>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right">
                    <div>
                      <p className="text-xs text-ink-400">Est. Total</p>
                      <p className="font-display font-bold text-xl text-acid">₹{selectedRec.estimatedCostInr}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <p className="text-xs text-ink-400">Time</p>
                      <p className="font-display font-bold text-xl text-white">~{selectedRec.estimatedTimeMin}m</p>
                    </div>
                  </div>
                </div>

                {/* Plain-English Explanation (Section 4) */}
                <div className="p-3.5 rounded-xl bg-ink-900/60 border border-white/5 text-xs space-y-1.5">
                  <p className="font-semibold text-ink-200">Recommended because:</p>
                  {selectedRec.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-ink-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-acid shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  {selectedRec.availablePorts > 0 ? (
                    <button
                      onClick={() => handleSelectOption(selectedRec)}
                      className="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-acid/20 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Select &amp; Book Slot</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinWaitlist(selectedRec.station.name, selectedRec.station.id, selectedRec.chargerType)}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      <span>No Chargers Available — Join Waitlist</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const nextTier = activeTab === 'BEST BALANCE' ? 'FASTEST' : activeTab === 'FASTEST' ? 'CHEAPEST' : 'BEST BALANCE';
                      setActiveTab(nextTier);
                    }}
                    className="btn-secondary w-full sm:w-auto py-2.5 px-4 text-xs font-medium cursor-pointer"
                  >
                    Compare Another
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Initial Empty State / Helper Prompt (Section 15) */}
        {!hasSearched && !thinking && (
          <div className="p-6 rounded-2xl bg-ink-900/30 border border-white/5 text-center text-xs text-ink-400">
            <Sparkles className="w-6 h-6 text-acid/40 mx-auto mb-2" />
            <p className="font-medium text-ink-300">Intelligent Charging Decision Engine</p>
            <p className="mt-1 max-w-md mx-auto text-ink-500">
              ChargeNix AI optimizes charging around your remaining battery, highway corridors, live open ports, and charging speed to save you waiting time.
            </p>
          </div>
        )}

        {/* Pre-Booking Confirmation Dialog (Section 5) */}
        <AnimatePresence>
          {confirmSummary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-strong p-6 sm:p-8 rounded-3xl max-w-md w-full border border-white/10 shadow-2xl relative"
              >
                <button
                  onClick={() => setConfirmSummary(null)}
                  className="absolute top-4 right-4 text-ink-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-acid/15 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-acid" />
                  </div>
                  <h4 className="font-display font-semibold text-white text-base">Confirm Slot Booking</h4>
                </div>

                <p className="text-xs text-ink-300 mb-4">
                  The AI Agent has reserved this slot recommendation for you. Please confirm details before proceeding to payment:
                </p>

                <div className="space-y-2.5 p-4 rounded-2xl bg-ink-900/80 border border-white/5 text-xs mb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-400">Station</span>
                    <span className="text-white font-semibold text-right">{confirmSummary.stationName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-400">Location</span>
                    <span className="text-ink-200 text-right truncate max-w-[200px]">{confirmSummary.stationLocation}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-400">Charger</span>
                    <span className="text-acid font-semibold">{confirmSummary.chargerType} Charger</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-400">Time Slot</span>
                    <span className="text-white font-medium">{confirmSummary.timeSlot} ({confirmSummary.dateLabel})</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-white font-semibold">Estimated Cost</span>
                    <span className="font-display font-bold text-acid text-base">₹{confirmSummary.estimatedCost}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleConfirmAndBook}
                    className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-acid/20 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Confirm &amp; Proceed to Payment</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setConfirmSummary(null);
                        setActiveTab(activeTab === 'BEST BALANCE' ? 'FASTEST' : 'CHEAPEST');
                      }}
                      className="btn-secondary flex-1 py-2 text-xs font-medium cursor-pointer"
                    >
                      Choose Another
                    </button>
                    <button
                      onClick={() => setConfirmSummary(null)}
                      className="btn-ghost flex-1 py-2 text-xs font-medium cursor-pointer text-ink-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
