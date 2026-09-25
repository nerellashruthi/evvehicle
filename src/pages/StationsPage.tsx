import { useState, useMemo, useEffect } from 'react';
import {
  Search, SlidersHorizontal, X, Navigation,
  LocateFixed, Loader, AlertTriangle, ShieldOff, Zap, Clock, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { StationCard } from '@/components/StationCard';
import { MapMock } from '@/components/MapMock';
import { PageHeader } from '@/components/ui';
import { useGeolocation, haversineKm } from '@/hooks/useGeolocation';
import type { ChargerType, Station } from '@/types';

type SortBy = 'distance' | 'speed' | 'availability';

// How many km radius to consider "nearby" when user location is active
const NEARBY_RADIUS_KM = 50;

const statusConfig = {
  Available: { color: 'text-acid', bg: 'bg-acid/10', border: 'border-acid/30', dot: 'bg-acid' },
  Occupied: { color: 'text-danger-400', bg: 'bg-danger-500/10', border: 'border-danger-500/30', dot: 'bg-danger-400' },
  Limited: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400' },
};

// ─────────────────────────────────────────────
// Nearby Station Card (compact variant for the
// "Near You" panel — reuses existing StationCard
// logic but adds live distance from user)
// ─────────────────────────────────────────────
function NearbyStationCard({
  station,
  distanceKm,
  index,
}: {
  station: Station;
  distanceKm: number;
  index: number;
}) {
  const { navigate, selectStation } = useApp();
  const status = statusConfig[station.status];
  const totalAvail = station.chargers.reduce((s, c) => s + c.availablePorts, 0);
  const totalPorts = station.chargers.reduce((s, c) => s + c.totalPorts, 0);
  const maxSpeed = Math.max(...station.chargers.map((c) => c.speedKW));
  const chargerTypes = [...new Set(station.chargers.map((c) => c.type))].join(' · ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="glass p-4 hover:border-white/15 transition-all duration-300 group cursor-pointer"
      onClick={() => { selectStation(station); navigate('station-details'); }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-white text-sm group-hover:text-acid transition-colors truncate">
            {station.name}
          </h4>
          <p className="text-xs text-ink-400 mt-0.5 truncate">{station.location}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-xs text-ink-300">
          <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
          <span>{station.rating}</span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-xs">
        {/* Distance from user */}
        <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-400/25 text-sky-300 px-2 py-0.5 rounded-full font-medium">
          <LocateFixed className="w-3 h-3 text-sky-400" />
          {distanceKm < 1
            ? `${Math.round(distanceKm * 1000)} m`
            : `${distanceKm.toFixed(1)} km away`}
        </div>

        <div className="flex items-center gap-1 text-ink-300">
          <Zap className="w-3.5 h-3.5 text-acid" />
          <span>{maxSpeed} kW</span>
        </div>

        {station.open24Hours && (
          <div className="flex items-center gap-1 text-ink-300">
            <Clock className="w-3.5 h-3.5" />
            <span>24h</span>
          </div>
        )}
      </div>

      {/* Charger availability */}
      <div className="space-y-1 mb-3">
        {station.chargers.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-ink-300">{c.type}</span>
            <span className={c.availablePorts > 0 ? 'text-acid font-medium' : 'text-danger-400'}>
              {c.availablePorts}/{c.totalPorts} available
            </span>
          </div>
        ))}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.border} border ${status.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
          {station.status}
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); selectStation(station); navigate('reserve'); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-acid/10 text-acid border border-acid/20 hover:bg-acid/20 transition-all"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Amenities + charger type hint */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-ink-500">
        <span>{totalAvail} of {totalPorts} ports free</span>
        <span className="text-ink-500">{chargerTypes}</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Location error / permission banner
// ─────────────────────────────────────────────
function GeoErrorBanner({ type, message, onDismiss }: {
  type: 'denied' | 'error';
  message?: string;
  onDismiss: () => void;
}) {
  const isDenied = type === 'denied';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${
        isDenied
          ? 'bg-amber-500/10 border-amber-500/25'
          : 'bg-danger-500/10 border-danger-500/25'
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${isDenied ? 'text-amber-400' : 'text-danger-400'}`}>
        {isDenied ? <ShieldOff className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      </div>
      <div className="flex-1 text-sm">
        {isDenied ? (
          <>
            <p className="font-semibold text-amber-300 mb-0.5">Location access denied</p>
            <p className="text-amber-400/80 text-xs">
              Please enable location access in your browser settings and try again.
              In Chrome: tap the lock icon in the address bar → Site settings → Location → Allow.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-danger-300 mb-0.5">Location unavailable</p>
            <p className="text-danger-400/80 text-xs">{message}</p>
          </>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-ink-400 hover:text-ink-200 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export function StationsPage() {
  const { liveStations, userLocation, setUserLocation } = useApp();
  const [search, setSearch] = useState('');
  const [maxDistance, setMaxDistance] = useState(20);
  const [chargerType, setChargerType] = useState<ChargerType | 'all'>('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('distance');
  const [showFilters, setShowFilters] = useState(false);

  const { state: geoState, locate, reset: resetGeo } = useGeolocation();

  useEffect(() => {
    if (geoState.status === 'success') {
      setUserLocation({ lat: geoState.lat, lng: geoState.lng });
    }
  }, [geoState, setUserLocation]);

  // User coords if available from current geoState or AppContext
  const userCoords = useMemo(() => {
    return geoState.status === 'success'
      ? { lat: geoState.lat, lng: geoState.lng }
      : userLocation;
  }, [geoState, userLocation]);

  // Stations enriched with real distance from user (if geo active)
  const stationsWithDist = useMemo<(Station & { realDistKm: number })[]>(() => {
    return liveStations.map((s) => ({
      ...s,
      realDistKm: userCoords
        ? haversineKm(userCoords.lat, userCoords.lng, s.lat, s.lng)
        : s.distanceKm,
    }));
  }, [liveStations, userCoords]);

  // Nearby stations: within NEARBY_RADIUS_KM, sorted by real distance from user
  const nearbyStations = useMemo(() => {
    if (!userCoords) return [];
    return stationsWithDist
      .filter((s) => s.realDistKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.realDistKm - b.realDistKm);
  }, [stationsWithDist, userCoords]);

  // Regular filtered list (uses realDistKm when geo is on)
  const filtered = useMemo(() => {
    let result = stationsWithDist.filter((s) => {
      if (
        search &&
        !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.location.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (userCoords) {
        // When geo is active, filter by real distance instead of static distanceKm
        if (s.realDistKm > NEARBY_RADIUS_KM) return false;
      } else {
        if (s.distanceKm > maxDistance) return false;
      }
      if (chargerType !== 'all' && !s.chargers.some((c) => c.type === chargerType)) return false;
      if (availableOnly && s.status === 'Occupied') return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'distance') return a.realDistKm - b.realDistKm;
      if (sortBy === 'speed')
        return (
          Math.max(...b.chargers.map((c) => c.speedKW)) -
          Math.max(...a.chargers.map((c) => c.speedKW))
        );
      const aAvail = a.chargers.reduce((s, c) => s + c.availablePorts, 0);
      const bAvail = b.chargers.reduce((s, c) => s + c.availablePorts, 0);
      return bAvail - aAvail;
    });

    return result;
  }, [stationsWithDist, search, maxDistance, chargerType, availableOnly, sortBy, userCoords]);

  const isGeoLoading = geoState.status === 'loading';
  const isGeoActive = geoState.status === 'success';

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          label="Module 1 — Find"
          title="Charging Station Finder"
          subtitle="Search and filter nearby EV charging stations. See availability, charger types, and speeds at a glance."
        />

        <div className="grid lg:grid-cols-2 gap-6 pb-20">
          {/* ── Left: Search + Filters + List ── */}
          <div className="space-y-4">
            {/* Search bar + "Use Current Location" button */}
            <div className="glass p-4 space-y-3">
              <div className="flex gap-2">
                {/* Search input */}
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-ink-800/80 border border-white/10 focus-within:border-acid/50 transition-colors">
                  <Search className="w-4 h-4 text-ink-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search charging stations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-ink-100 placeholder-ink-400 focus:outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-ink-400 hover:text-ink-200">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filters toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium ${
                    showFilters
                      ? 'bg-acid/10 border-acid/30 text-acid'
                      : 'bg-ink-800/80 border-white/10 text-ink-300'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>

              {/* ── Use Current Location button ── */}
              <button
                id="use-current-location-btn"
                onClick={isGeoActive ? resetGeo : locate}
                disabled={isGeoLoading}
                className={`w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  isGeoActive
                    ? 'bg-sky-500/15 border-sky-400/35 text-sky-300 hover:bg-sky-500/25'
                    : isGeoLoading
                    ? 'bg-ink-800/50 border-white/10 text-ink-400 cursor-not-allowed'
                    : 'bg-ink-800/60 border-white/15 text-ink-200 hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-300'
                }`}
              >
                {isGeoLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Getting your location…</span>
                  </>
                ) : isGeoActive ? (
                  <>
                    <LocateFixed className="w-4 h-4 text-sky-400" />
                    <span>Location active — click to clear</span>
                    <span className="ml-auto w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-4 h-4" />
                    <span>Use Current Location</span>
                  </>
                )}
              </button>

              {/* Error / denied banner */}
              <AnimatePresence>
                {geoState.status === 'denied' && (
                  <GeoErrorBanner type="denied" onDismiss={resetGeo} />
                )}
                {geoState.status === 'error' && (
                  <GeoErrorBanner
                    type="error"
                    message={geoState.message}
                    onDismiss={resetGeo}
                  />
                )}
              </AnimatePresence>

              {/* Filters panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-white/5 space-y-4">
                      {/* Max distance — hide when geo is active (we use NEARBY_RADIUS_KM) */}
                      {!isGeoActive && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-ink-300">Max Distance</label>
                            <span className="text-xs text-acid font-medium">{maxDistance} km</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={maxDistance}
                            onChange={(e) => setMaxDistance(Number(e.target.value))}
                            className="w-full accent-acid"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-medium text-ink-300 block mb-2">Charger Type</label>
                        <div className="flex flex-wrap gap-2">
                          {(['all', 'Fast', 'Normal', 'Ultra-Fast'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setChargerType(t)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                chargerType === t
                                  ? 'bg-acid/15 text-acid border border-acid/30'
                                  : 'bg-ink-800/50 text-ink-300 border border-white/10 hover:border-white/20'
                              }`}
                            >
                              {t === 'all' ? 'All Types' : t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-ink-300">Available Only</label>
                        <button
                          onClick={() => setAvailableOnly(!availableOnly)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${availableOnly ? 'bg-acid' : 'bg-ink-600'}`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${availableOnly ? 'translate-x-5' : 'translate-x-0.5'}`}
                          />
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-ink-300 block mb-2">Sort By</label>
                        <div className="flex flex-wrap gap-2">
                          {([
                            { label: 'Distance', value: 'distance' },
                            { label: 'Speed', value: 'speed' },
                            { label: 'Availability', value: 'availability' },
                          ] as const).map((s) => (
                            <button
                              key={s.value}
                              onClick={() => setSortBy(s.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                sortBy === s.value
                                  ? 'bg-acid/15 text-acid border border-acid/30'
                                  : 'bg-ink-800/50 text-ink-300 border border-white/10'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Nearby Stations panel (geo active) ── */}
            <AnimatePresence>
              {isGeoActive && nearbyStations.length > 0 && (
                <motion.div
                  key="nearby-panel"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="glass p-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/25 flex items-center justify-center">
                      <LocateFixed className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Stations Near You</h3>
                      <p className="text-xs text-ink-400">
                        {nearbyStations.length} station{nearbyStations.length !== 1 ? 's' : ''} within {NEARBY_RADIUS_KM} km · sorted by distance
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {nearbyStations.map((station, i) => (
                      <NearbyStationCard
                        key={station.id}
                        station={station}
                        distanceKm={station.realDistKm}
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {isGeoActive && nearbyStations.length === 0 && (
                <motion.div
                  key="no-nearby"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass p-6 text-center"
                >
                  <LocateFixed className="w-8 h-8 text-ink-500 mx-auto mb-2" />
                  <p className="text-ink-300 text-sm">No ChargeNix stations within {NEARBY_RADIUS_KM} km of your location.</p>
                  <p className="text-xs text-ink-500 mt-1">Try browsing the full list below.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Standard filtered station list ── */}
            <div className="flex items-center justify-between text-sm text-ink-400 px-1">
              <span>{filtered.length} station{filtered.length !== 1 ? 's' : ''} found</span>
              <span className="flex items-center gap-1 text-xs">
                {isGeoActive ? (
                  <>
                    <LocateFixed className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-sky-400">Near you</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-acid" />
                    Hyderabad region
                  </>
                )}
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="glass p-8 text-center">
                  <Search className="w-8 h-8 text-ink-500 mx-auto mb-3" />
                  <p className="text-ink-300 text-sm">No stations match your filters.</p>
                  <button
                    onClick={() => {
                      setSearch('');
                      setMaxDistance(20);
                      setChargerType('all');
                      setAvailableOnly(false);
                    }}
                    className="mt-3 text-sm text-acid hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                filtered.map((station, i) => (
                  <StationCard key={station.id} station={station} index={i} />
                ))
              )}
            </div>
          </div>

          {/* ── Right: Map ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <MapMock
              stations={filtered.length > 0 ? filtered : liveStations}
              height="600px"
              userLocation={userCoords}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
