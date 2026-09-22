import { MapPin, Navigation, Clock, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Station } from '@/types';
import { useApp } from '@/context/AppContext';

const statusConfig = {
  Available: { color: 'text-electric-400', bg: 'bg-electric-500/10', border: 'border-electric-500/30', dot: 'bg-electric-400' },
  Occupied: { color: 'text-danger-400', bg: 'bg-danger-500/10', border: 'border-danger-500/30', dot: 'bg-danger-400' },
  Limited: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400' },
};

export function StationCard({ station, index = 0 }: { station: Station; index?: number }) {
  const { navigate, selectStation } = useApp();
  const status = statusConfig[station.status];
  const totalAvail = station.chargers.reduce((s, c) => s + c.availablePorts, 0);
  const totalPorts = station.chargers.reduce((s, c) => s + c.totalPorts, 0);
  const maxSpeed = Math.max(...station.chargers.map((c) => c.speedKW));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass p-5 hover:border-white/15 transition-all duration-300 group cursor-pointer"
      onClick={() => { selectStation(station); navigate('station-details'); }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-white text-base group-hover:text-electric-400 transition-colors">
            {station.name}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-ink-400">
            <MapPin className="w-3 h-3" />
            <span>{station.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-ink-300">
          <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
          <span>{station.rating}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1 text-ink-300">
          <Navigation className="w-3.5 h-3.5" />
          <span>{station.distanceKm} km</span>
        </div>
        <div className="flex items-center gap-1 text-ink-300">
          <Zap className="w-3.5 h-3.5 text-electric-400" />
          <span>{maxSpeed} kW</span>
        </div>
        {station.open24Hours && (
          <div className="flex items-center gap-1 text-ink-300">
            <Clock className="w-3.5 h-3.5" />
            <span>24h</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 mb-4">
        {station.chargers.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-ink-300">{c.type}</span>
            <div className="flex items-center gap-2">
              <span className={c.availablePorts > 0 ? 'text-electric-400 font-medium' : 'text-danger-400'}>
                {c.availablePorts}/{c.totalPorts}
              </span>
              <span className="text-ink-500">available</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.border} border ${status.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
          {station.status}
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); selectStation(station); navigate('reserve'); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-ink-200 border border-white/10 hover:bg-white/10 transition-all"
          >
            Reserve
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); selectStation(station); navigate('station-details'); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-electric-500/10 text-electric-400 border border-electric-500/20 hover:bg-electric-500/20 transition-all"
          >
            Details
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>{totalAvail} of {totalPorts} ports available</span>
          <span>{station.amenities.slice(0, 2).join(' · ')}</span>
        </div>
      </div>
    </motion.div>
  );
}
