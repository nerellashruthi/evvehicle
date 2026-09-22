import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import type { Station } from '@/types';
import { useApp } from '@/context/AppContext';

const statusColors: Record<string, string> = {
  Available: 'bg-electric-400',
  Occupied: 'bg-danger-400',
  Limited: 'bg-amber-400',
};

export function MapMock({
  stations,
  height = '400px',
  showLabels = true,
}: {
  stations: Station[];
  height?: string;
  showLabels?: boolean;
}) {
  const { selectStation, navigate, selectedStation } = useApp();

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-ink-900 border border-white/5"
      style={{ height }}
    >
      <div className="absolute inset-0 grid-pattern opacity-40" />

      <div className="absolute inset-0">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 232, 101, 0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGlow)" />

          <path
            d="M 10% 30% Q 30% 10% 50% 25% T 90% 40%"
            stroke="rgba(0, 232, 101, 0.15)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="6 4"
            className="animate-dash"
          />
          <path
            d="M 15% 70% Q 40% 50% 60% 65% T 85% 80%"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 5% 50% L 95% 50%"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>

      {stations.map((station, i) => (
        <motion.button
          key={station.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
          onClick={() => { selectStation(station); navigate('station-details'); }}
          className="absolute -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${station.mapX}%`, top: `${station.mapY}%` }}
        >
          <div className="relative">
            {selectedStation?.id === station.id && (
              <div className="absolute -inset-3 rounded-full bg-electric-500/20 animate-ping" />
            )}
            <div className={`w-3 h-3 rounded-full ${statusColors[station.status]} shadow-glow`} />
            <div className={`absolute inset-0 rounded-full ${statusColors[station.status]} animate-pulse-glow opacity-50`} />
          </div>
          {showLabels && (
            <div className="absolute left-1/2 -translate-x-1/2 top-5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="px-2 py-1 rounded-lg bg-ink-800/90 border border-white/10 text-xs text-ink-100 font-medium">
                {station.name}
              </div>
            </div>
          )}
        </motion.button>
      ))}

      <div className="absolute top-4 left-4 glass px-3 py-2 flex items-center gap-2 text-xs text-ink-300">
        <Navigation className="w-3.5 h-3.5 text-electric-400" />
        <span>Hyderabad Region</span>
      </div>

      <div className="absolute bottom-4 right-4 glass px-3 py-2 flex items-center gap-3 text-xs">
        {[
          { label: 'Available', color: 'bg-electric-400' },
          { label: 'Limited', color: 'bg-amber-400' },
          { label: 'Occupied', color: 'bg-danger-400' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-ink-300">
            <span className={`w-2 h-2 rounded-full ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-1 text-xs text-ink-500">
        <MapPin className="w-3 h-3" />
        <span>{stations.length} stations</span>
      </div>
    </div>
  );
}
