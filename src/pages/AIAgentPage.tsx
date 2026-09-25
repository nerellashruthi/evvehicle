import {
  Sparkles, BatteryCharging, Navigation, Clock,
  Zap, CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui';
import { AIAgentChatModal } from '@/components/ai/AIAgentChatModal';

export function AIAgentPage() {
  const {
    user,
    userLocation,
    bookings,
    waitlist,
    activeSlotMonitoring,
  } = useApp();

  const battery = user?.batteryPercent ?? 18;
  const range = user?.vehicleRange ?? 320;
  const estimatedRange = Math.round((range * battery) / 100);
  const activeBookings = bookings.filter((b) => b.status === 'confirmed');

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          label="ChargeNix Intelligence"
          title="Autonomous AI Charging Agent"
          subtitle="Real-time multi-factor decision engine for routing, charger availability, slot reservations & smart monitoring."
        />

        {/* Telemetry Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${battery <= 20 ? 'bg-danger-500/15 text-danger-400' : 'bg-acid/15 text-acid'}`}>
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-ink-400">Battery &amp; Range</p>
              <p className="font-display font-bold text-white text-base">
                {battery}% <span className="text-xs font-normal text-ink-400">({estimatedRange} km)</span>
              </p>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-acid/15 text-acid flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-ink-400">Location</p>
              <p className="font-display font-bold text-white text-sm truncate max-w-[130px]">
                {userLocation ? 'GPS Acquired' : 'Hyderabad (Default)'}
              </p>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-acid/15 text-acid flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-ink-400">Active Bookings</p>
              <p className="font-display font-bold text-white text-base">
                {activeBookings.length} Slot{activeBookings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-ink-400">Waitlist Queues</p>
              <p className="font-display font-bold text-white text-base">
                {waitlist.length} Station{waitlist.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Interactive Chat Window */}
            <div className="lg:col-span-2 h-[680px]">
              <AIAgentChatModal isOpen={true} embedded={true} />
            </div>

            {/* Live Monitoring & Workflow Panel (Right Column) */}
            <div className="space-y-5">
              {/* Agent Workflow Card */}
              <div className="glass p-5 rounded-3xl border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-acid" />
                  <h4 className="font-display font-semibold text-white text-sm">Autonomous Workflow</h4>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { step: 'OBSERVE', desc: 'Read battery telemetry, highway routes, and live port occupancy' },
                    { step: 'ANALYZE', desc: 'Compute charging speeds, pricing, and estimated arrival queues' },
                    { step: 'RECOMMEND', desc: 'Formulate 3 tailored tiers (Fastest, Cheapest, Best Balance)' },
                    { step: 'CONFIRM', desc: 'Explicit user authorization required before any slot booking' },
                    { step: 'ACT', desc: 'Reserve slot, transition to payment, and dispatch driving navigation' },
                    { step: 'MONITOR', desc: 'Track slot start, manage 15-min grace period, and auto-release no-shows' },
                  ].map((w, idx) => (
                    <div key={w.step} className="flex items-start gap-2.5 p-2 rounded-xl bg-ink-900/40 border border-white/5">
                      <span className="font-mono text-[10px] font-bold text-acid bg-acid/10 px-1.5 py-0.5 rounded">
                        0{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white text-[11px]">{w.step}</p>
                        <p className="text-ink-400 text-[10px] leading-tight mt-0.5">{w.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slot Monitoring Status Card (Section 8) */}
              <div className="glass p-5 rounded-3xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-acid" />
                    <h4 className="font-display font-semibold text-white text-sm">Slot Monitoring</h4>
                  </div>
                  <span className="text-[10px] font-bold text-acid bg-acid/15 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                {activeSlotMonitoring ? (
                  <div className="p-3.5 rounded-2xl bg-ink-900/60 border border-white/5 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400">Station</span>
                      <span className="text-white font-semibold">{activeSlotMonitoring.stationName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400">Reserved Slot</span>
                      <span className="text-acid">{activeSlotMonitoring.timeSlot}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400">Grace Period</span>
                      <span className="text-ink-200">15 Minutes</span>
                    </div>
                    <div className="pt-2 border-t border-white/5 text-[11px] text-ink-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-acid shrink-0" />
                      <span>{activeSlotMonitoring.message}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-ink-400">
                    No active charging slot is currently in the monitoring window. When you reserve a slot, the agent tracks your arrival and manages the grace period.
                  </p>
                )}
              </div>

              {/* Waitlist Queue Card (Section 9) */}
              <div className="glass p-5 rounded-3xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h4 className="font-display font-semibold text-white text-sm">Waitlist Queues</h4>
                  </div>
                  <span className="text-[10px] font-mono text-ink-400">
                    {waitlist.length} Active
                  </span>
                </div>

                {waitlist.length > 0 ? (
                  <div className="space-y-2">
                    {waitlist.map((w) => (
                      <div key={w.id} className="p-3 rounded-2xl bg-ink-900/60 border border-white/5 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-white">{w.stationName}</span>
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {w.status === 'notified' ? 'Port Ready!' : 'In Queue'}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-400">{w.chargerType} Charger · ID: {w.id}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-400">
                    You have not joined any station waitlists. If all chargers are occupied at your destination, you can join the queue and the agent will notify you immediately when a port is released.
                  </p>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
