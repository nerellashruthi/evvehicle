import { motion } from 'framer-motion';
import {
  BatteryCharging, Navigation, Zap, CalendarCheck, Route,
  Search, CheckCircle2, Map, TrendingUp, Clock, ArrowRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, Reveal } from '@/components/ui';
import { getRecentTrip } from '@/utils/storage';

export function DashboardPage() {
  const { user, reservations, navigate, liveStations, selectedStation } = useApp();
  const recentTrip = getRecentTrip();

  const battery = user?.batteryPercent ?? 72;
  const range = user?.vehicleRange ?? 320;
  const estimatedRange = Math.round((range * battery) / 100);
  const nearestStation = liveStations[0];

  const quickActions = [
    { icon: Search, label: 'Find Charger', page: 'stations' as const, color: 'text-electric-400' },
    { icon: CheckCircle2, label: 'Check Availability', page: 'stations' as const, color: 'text-amber-400' },
    { icon: CalendarCheck, label: 'Reserve Slot', page: 'reserve' as const, color: 'text-electric-400' },
    { icon: Map, label: 'Plan Trip', page: 'trip-planner' as const, color: 'text-electric-400' },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          label="Dashboard"
          title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
          subtitle="Your EV charging overview at a glance."
        />

        <div className="grid lg:grid-cols-3 gap-6 pb-20">
          {/* Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Battery & Range */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6"
            >
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BatteryCharging className="w-5 h-5 text-electric-400" />
                    <span className="text-sm text-ink-300">Current Battery</span>
                  </div>
                  <p className="font-display font-bold text-4xl text-white">{battery}%</p>
                  <div className="mt-2 h-2 rounded-full bg-ink-700 overflow-hidden">
                    <div className="h-full bg-electric-400 rounded-full transition-all" style={{ width: `${battery}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="w-5 h-5 text-electric-400" />
                    <span className="text-sm text-ink-300">Est. Range</span>
                  </div>
                  <p className="font-display font-bold text-4xl text-white">{estimatedRange}<span className="text-lg text-ink-400 ml-1">km</span></p>
                  <p className="text-xs text-ink-400 mt-2">of {range} km total range</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-electric-400" />
                    <span className="text-sm text-ink-300">Charging Status</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-electric-500/10 border border-electric-500/20 text-electric-400 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-electric-400 animate-pulse" />
                    Ready to travel
                  </div>
                  <p className="text-xs text-ink-400 mt-2">Battery sufficient for short trips</p>
                </div>
              </div>
            </motion.div>

            {/* Next recommended station */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Next Recommended Charging Station</h3>
              <div className="flex items-center justify-between p-4 rounded-xl bg-ink-800/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-electric-400" />
                  </div>
                  <div>
                    <p className="font-medium text-ink-100">{nearestStation.name}</p>
                    <p className="text-xs text-ink-400">{nearestStation.location} · {nearestStation.distanceKm} km away</p>
                  </div>
                </div>
                <button onClick={() => navigate('station-details')} className="btn-ghost">
                  Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.page)}
                    className="p-4 rounded-xl bg-ink-800/50 border border-white/5 hover:border-electric-500/20 transition-all group text-center"
                  >
                    <action.icon className={`w-6 h-6 ${action.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                    <p className="text-xs font-medium text-ink-200">{action.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {/* Recent reservation */}
                {reservations.length > 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-electric-500/10 flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5 text-electric-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-100">Reservation at {reservations[0].stationName}</p>
                      <p className="text-xs text-ink-400">{reservations[0].time} · {reservations[0].chargerType} · ID: {reservations[0].id}</p>
                    </div>
                    <span className="text-xs text-electric-400 font-medium">Confirmed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-ink-700 flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5 text-ink-500" />
                    </div>
                    <p className="text-sm text-ink-400">No reservations yet.</p>
                  </div>
                )}

                {/* Recent station */}
                {selectedStation && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-electric-500/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-electric-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-100">Viewed: {selectedStation.name}</p>
                      <p className="text-xs text-ink-400">{selectedStation.location} · {selectedStation.distanceKm} km</p>
                    </div>
                    <button onClick={() => navigate('station-details')} className="text-xs text-electric-400 hover:underline">
                      View
                    </button>
                  </div>
                )}

                {/* Recent trip */}
                {recentTrip ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-electric-500/10 flex items-center justify-center">
                      <Route className="w-5 h-5 text-electric-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-100">Trip: {recentTrip.from} → {recentTrip.to}</p>
                      <p className="text-xs text-ink-400">{recentTrip.distance} km</p>
                    </div>
                    <button onClick={() => navigate('trip-planner')} className="text-xs text-electric-400 hover:underline">
                      Plan again
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-ink-700 flex items-center justify-center">
                      <Route className="w-5 h-5 text-ink-500" />
                    </div>
                    <p className="text-sm text-ink-400">No trips planned yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Vehicle Info</h3>
              <div className="space-y-3">
                {[
                  { label: 'Model', value: user?.vehicleModel || 'Tata Nexon EV' },
                  { label: 'Range', value: `${range} km` },
                  { label: 'Battery', value: `${battery}%` },
                  { label: 'Est. Range', value: `${estimatedRange} km` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-ink-400">{item.label}</span>
                    <span className="text-ink-100 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Charging Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-ink-400">This Month</span>
                    <TrendingUp className="w-3.5 h-3.5 text-electric-400" />
                  </div>
                  <p className="font-display font-bold text-2xl text-white">{reservations.length}</p>
                  <p className="text-xs text-ink-400">Reservations made</p>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-ink-400">Total Sessions</span>
                    <Clock className="w-3.5 h-3.5 text-electric-400" />
                  </div>
                  <p className="font-display font-bold text-2xl text-white">{reservations.length + 3}</p>
                  <p className="text-xs text-ink-400">Charging sessions</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass-strong p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-2">Plan a New Trip</h3>
              <p className="text-sm text-ink-400 mb-4">Let Chargenix find the best charging stops for your next journey.</p>
              <button onClick={() => navigate('trip-planner')} className="btn-primary w-full">
                <Navigation className="w-4 h-4" />
                Start Planning
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
