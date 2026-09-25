import { motion } from 'framer-motion';
import {
  MapPin, Navigation, Star, Clock, Zap, CheckCircle2,
  CalendarCheck, Route, ArrowLeft, Wifi, Coffee, ParkingSquare, Sofa,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, StatusBadge } from '@/components/ui';
import { getEstimatedChargingTime } from '@/utils/tripPlanner';

const amenityIcons: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  Cafe: Coffee,
  Parking: ParkingSquare,
  'EV Lounge': Sofa,
  Restroom: CheckCircle2,
  Shopping: CheckCircle2,
};

export function StationDetailsPage() {
  const { selectedStation, navigate, user } = useApp();

  if (!selectedStation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-300 mb-4">No station selected.</p>
          <button onClick={() => navigate('stations')} className="btn-primary">
            Browse Stations
          </button>
        </div>
      </div>
    );
  }

  const station = selectedStation;
  const maxSpeed = Math.max(...station.chargers.map((c) => c.speedKW));

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader label="Station Details" title={station.name} subtitle={station.location} />

        <button
          onClick={() => navigate('stations')}
          className="flex items-center gap-2 text-sm text-ink-400 hover:text-acid transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to stations
        </button>

        <div className="grid lg:grid-cols-3 gap-6 pb-20">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-display font-medium text-2xl text-white">{station.name}</h2>
                  <div className="flex items-center gap-1 mt-1 text-sm text-ink-400">
                    <MapPin className="w-4 h-4" />
                    {station.location}
                  </div>
                </div>
                <StatusBadge status={station.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Navigation, label: 'Distance', value: `${station.distanceKm} km` },
                  { icon: Star, label: 'Rating', value: `${station.rating} / 5` },
                  { icon: Zap, label: 'Max Speed', value: `${maxSpeed} kW` },
                  { icon: Clock, label: 'Hours', value: station.open24Hours ? '24 Hours' : '6 AM – 10 PM' },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <stat.icon className="w-5 h-5 text-acid mb-1.5" />
                    <p className="font-display font-semibold text-white text-sm">{stat.value}</p>
                    <p className="text-xs text-ink-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Chargers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Charger Types</h3>
              <div className="space-y-4">
                {station.chargers.map((charger, i) => (
                  <div key={i} className="p-4 rounded-xl bg-ink-800/50 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          charger.type === 'Ultra-Fast' ? 'bg-acid/15' : charger.type === 'Fast' ? 'bg-acid/10' : 'bg-white/5'
                        }`}>
                          <Zap className={`w-5 h-5 ${charger.type === 'Ultra-Fast' ? 'text-acid' : 'text-acid'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-ink-100 text-sm">{charger.type} Charger</p>
                          <p className="text-xs text-ink-400">{charger.speedKW} kW</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${charger.availablePorts > 0 ? 'text-acid' : 'text-danger-400'}`}>
                          {charger.availablePorts} / {charger.totalPorts}
                        </p>
                        <p className="text-xs text-ink-400">ports available</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: charger.totalPorts }).map((_, j) => (
                        <div
                          key={j}
                          className={`flex-1 h-1.5 rounded-full ${j < charger.availablePorts ? 'bg-acid' : 'bg-ink-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-ink-400">
                      Est. charging time: {getEstimatedChargingTime(charger.speedKW, 20)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Amenities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {station.amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity] || CheckCircle2;
                  return (
                    <div key={amenity} className="flex items-center gap-2 p-3 rounded-xl bg-ink-800/50 border border-white/5">
                      <Icon className="w-4 h-4 text-acid" />
                      <span className="text-sm text-ink-200">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-strong p-6 sticky top-24"
            >
              <h3 className="font-display font-semibold text-white text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('reserve')}
                  className="btn-primary w-full"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Reserve Slot
                </button>
                <button
                  onClick={() => navigate('trip-planner')}
                  className="btn-secondary w-full"
                >
                  <Route className="w-4 h-4" />
                  Add to Trip
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Operating Status</span>
                  <span className={station.status === 'Available' ? 'text-acid font-medium' : station.status === 'Limited' ? 'text-amber-400 font-medium' : 'text-danger-400 font-medium'}>
                    {station.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Total Ports</span>
                  <span className="text-ink-100 font-medium">
                    {station.chargers.reduce((s, c) => s + c.totalPorts, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Available Now</span>
                  <span className="text-acid font-medium">
                    {station.chargers.reduce((s, c) => s + c.availablePorts, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">24 Hours</span>
                  <span className="text-ink-100 font-medium">{station.open24Hours ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {!user && (
                <div className="mt-6 p-3 rounded-xl bg-acid/10 border border-acid/20 text-center">
                  <p className="text-xs text-ink-300 mb-2">Sign up to save reservations</p>
                  <button onClick={() => navigate('login')} className="text-xs text-acid font-medium hover:underline">
                    Get Started →
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
