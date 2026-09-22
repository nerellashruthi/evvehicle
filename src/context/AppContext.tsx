import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { PageName, Reservation, User, Station } from '@/types';
import { stations as stationData } from '@/data/stations';
import {
  getUser, saveUser, clearUser, getReservations, saveReservation,
  setRecentStationId, getRecentStationId,
} from '@/utils/storage';

interface AppContextValue {
  page: PageName;
  navigate: (page: PageName) => void;
  selectedStation: Station | null;
  selectStation: (station: Station | null) => void;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  reservations: Reservation[];
  addReservation: (reservation: Reservation) => void;
  liveStations: typeof stationData;
  lastUpdated: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageName>('home');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [liveStations, setLiveStations] = useState(stationData);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  useEffect(() => {
    setUser(getUser());
    setReservations(getReservations());
    const recentId = getRecentStationId();
    if (recentId) {
      const s = stationData.find((s) => s.id === recentId);
      if (s) setSelectedStation(s);
    }
  }, []);

  // Simulate live availability updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStations((prev) =>
        prev.map((station) => {
          const chargers = station.chargers.map((c) => {
            if (c.availablePorts === 0) return c;
            if (c.availablePorts === c.totalPorts) return c;
            const change = Math.random() > 0.5 ? 1 : -1;
            const newAvail = Math.max(0, Math.min(c.totalPorts, c.availablePorts + change));
            return { ...c, availablePorts: newAvail };
          });
          const totalAvail = chargers.reduce((sum, c) => sum + c.availablePorts, 0);
          const totalPorts = chargers.reduce((sum, c) => sum + c.totalPorts, 0);
          let status: Station['status'] = 'Available';
          if (totalAvail === 0) status = 'Occupied';
          else if (totalAvail < totalPorts * 0.4) status = 'Limited';
          return { ...station, chargers, status };
        }),
      );
      setLastUpdated('Just now');
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const navigate = useCallback((newPage: PageName) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectStation = useCallback((station: Station | null) => {
    setSelectedStation(station);
    if (station) setRecentStationId(station.id);
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    saveUser(u);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearUser();
  }, []);

  const addReservation = useCallback((reservation: Reservation) => {
    setReservations((prev) => {
      const updated = [reservation, ...prev].slice(0, 20);
      saveReservation(reservation);
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        page,
        navigate,
        selectedStation,
        selectStation,
        user,
        login,
        logout,
        reservations,
        addReservation,
        liveStations,
        lastUpdated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
