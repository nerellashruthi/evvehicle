import { motion } from 'framer-motion';
import { MapPin, Navigation, LocateFixed } from 'lucide-react';
import type { Station } from '@/types';
import { useApp } from '@/context/AppContext';

const statusColors: Record<string, string> = {
  Available: 'bg-acid',
  Occupied: 'bg-danger-400',
  Limited: 'bg-amber-400',
};

interface UserLocation {
  lat: number;
  lng: number;
}

function latLngToMapPercent(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
  return {
    x: Math.max(3, Math.min(97, x)),
    y: Math.max(3, Math.min(97, y)),
  };
}

export function MapMock({
  stations,
  height = '400px',
  showLabels = true,
  userLocation,
}: {
  stations: Station[];
  height?: string;
  showLabels?: boolean;
  userLocation?: UserLocation | null;
}) {
  const { selectStation, navigate, selectedStation } = useApp();

  // Compute geographic bounds from stations + optional user location for proportional pin placement
  const allLats = stations.map((s) => s.lat);
  const allLngs = stations.map((s) => s.lng);
  if (userLocation) {
    allLats.push(userLocation.lat);
    allLngs.push(userLocation.lng);
  }

  const minLat = Math.min(...allLats) - 0.05;
  const maxLat = Math.max(...allLats) + 0.05;
  const minLng = Math.min(...allLngs) - 0.05;
  const maxLng = Math.max(...allLngs) + 0.05;
  const bounds = { minLat, maxLat, minLng, maxLng };

  // When a user location is active, derive all map positions from real lat/lng.
  // Otherwise fall back to the existing pre-baked mapX/mapY percentages.
  const useGeoBounds = !!userLocation;

  const userPos = userLocation ? latLngToMapPercent(userLocation.lat, userLocation.lng, bounds) : null;

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
              <stop offset="0%" stopColor="rgba(237, 255, 57, 0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            {userPos && (
              <radialGradient id="userGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(99, 179, 237, 0.25)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            )}
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGlow)" />

          {/* User location accuracy ring */}
          {userPos && (
            <ellipse
              cx={`${userPos.x}%`}
              cy={`${userPos.y}%`}
              rx="8%"
              ry="5%"
              fill="url(#userGlow)"
            />
          )}

          <path
            d="M 10% 30% Q 30% 10% 50% 25% T 90% 40%"
            stroke="rgba(237, 255, 57, 0.15)"
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

      {/* Station pins */}
      {stations.map((station, i) => {
        const pos = useGeoBounds
          ? latLngToMapPercent(station.lat, station.lng, bounds)
          : { x: station.mapX, y: station.mapY };

        return (
          <motion.button
            key={station.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
            onClick={() => { selectStation(station); navigate('station-details'); }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div className="relative">
              {selectedStation?.id === station.id && (
                <div className="absolute -inset-3 rounded-full bg-acid/20 animate-ping" />
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
        );
      })}

      {/* "You are here" marker */}
      {userPos && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
        >
          {/* Pulsing accuracy ring */}
          <div className="absolute -inset-4 rounded-full bg-sky-400/15 animate-ping" />
          <div className="absolute -inset-2 rounded-full bg-sky-400/20 animate-pulse" />

          {/* Core dot */}
          <div className="relative w-5 h-5 rounded-full bg-sky-400 border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>

          {/* Label */}
          <div className="absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap">
            <div className="px-2 py-1 rounded-lg bg-sky-900/90 border border-sky-400/40 text-xs text-sky-200 font-semibold flex items-center gap-1">
              <LocateFixed className="w-3 h-3 text-sky-400" />
              You are here
            </div>
          </div>
        </motion.div>
      )}

      <div className="absolute top-4 left-4 glass px-3 py-2 flex items-center gap-2 text-xs text-ink-300">
        <Navigation className="w-3.5 h-3.5 text-acid" />
        <span>{userLocation ? 'Near your location' : 'Hyderabad Region'}</span>
      </div>

      <div className="absolute bottom-4 right-4 glass px-3 py-2 flex items-center gap-3 text-xs">
        {[
          { label: 'Available', color: 'bg-acid' },
          { label: 'Limited', color: 'bg-amber-400' },
          { label: 'Occupied', color: 'bg-danger-400' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-ink-300">
            <span className={`w-2 h-2 rounded-full ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>

      {userLocation && (
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-400/25 text-xs text-sky-300">
          <LocateFixed className="w-3 h-3 text-sky-400" />
          <span>Live location active</span>
        </div>
      )}

      {!userLocation && (
        <div className="absolute bottom-4 left-4 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="w-3 h-3" />
          <span>{stations.length} stations</span>
        </div>
      )}
    </div>
  );
}
