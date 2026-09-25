import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { StationCard } from '@/components/StationCard';
import { MapMock } from '@/components/MapMock';
import { PageHeader } from '@/components/ui';
import type { ChargerType } from '@/types';

type SortBy = 'distance' | 'speed' | 'availability';

export function StationsPage() {
  const { liveStations } = useApp();
  const [search, setSearch] = useState('');
  const [maxDistance, setMaxDistance] = useState(20);
  const [chargerType, setChargerType] = useState<ChargerType | 'all'>('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('distance');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = liveStations.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.location.toLowerCase().includes(search.toLowerCase())) return false;
      if (s.distanceKm > maxDistance) return false;
      if (chargerType !== 'all' && !s.chargers.some((c) => c.type === chargerType)) return false;
      if (availableOnly && s.status === 'Occupied') return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'speed') return Math.max(...b.chargers.map((c) => c.speedKW)) - Math.max(...a.chargers.map((c) => c.speedKW));
      const aAvail = a.chargers.reduce((s, c) => s + c.availablePorts, 0);
      const bAvail = b.chargers.reduce((s, c) => s + c.availablePorts, 0);
      return bAvail - aAvail;
    });

    return result;
  }, [liveStations, search, maxDistance, chargerType, availableOnly, sortBy]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          label="Module 1 — Find"
          title="Charging Station Finder"
          subtitle="Search and filter nearby EV charging stations. See availability, charger types, and speeds at a glance."
        />

        <div className="grid lg:grid-cols-2 gap-6 pb-20">
          {/* Left: Search + Filters + List */}
          <div className="space-y-4">
            <div className="glass p-4">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-ink-800/80 border border-white/10 focus-within:border-acid/50 transition-colors">
                  <Search className="w-4 h-4 text-ink-400" />
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

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
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
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${availableOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
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

            <div className="flex items-center justify-between text-sm text-ink-400 px-1">
              <span>{filtered.length} stations found</span>
              <span className="flex items-center gap-1 text-xs">
                <Navigation className="w-3.5 h-3.5 text-acid" />
                Hyderabad region
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="glass p-8 text-center">
                  <Search className="w-8 h-8 text-ink-500 mx-auto mb-3" />
                  <p className="text-ink-300 text-sm">No stations match your filters.</p>
                  <button
                    onClick={() => { setSearch(''); setMaxDistance(20); setChargerType('all'); setAvailableOnly(false); }}
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

          {/* Right: Map */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <MapMock stations={filtered.length > 0 ? filtered : liveStations} height="600px" />
          </div>
        </div>
      </div>
    </div>
  );
}
