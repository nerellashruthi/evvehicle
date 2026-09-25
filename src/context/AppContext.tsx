import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type {
  PageName, Reservation, User, Station, BookingWithPayment, ChargerType,
  SupportTicket, UserRole, GracePeriodConfig,
  IndividualCharger, ChargerOperationalStatus, RefundRecord
} from '@/types';
import { stations as stationData } from '@/data/stations';
import {
  getUser, saveUser, clearUser, getReservations, saveReservation,
  setRecentStationId, getRecentStationId, getBookings, saveBooking, cancelBooking,
  getTickets, saveTicket as storeSaveTicket, updateTicket as storeUpdateTicket,
  addTicketMessage as storeAddTicketMessage,
  getGracePeriodConfig, saveGracePeriodConfig, getNoShowAuditRecords, saveNoShowAuditRecord,
  updateBooking as storeUpdateBooking,
  getCustomStations, saveCustomStation, getIndividualChargers,
  updateChargerStatus as storeUpdateChargerStatus, getRefunds, saveRefundRecord,
  markStationPaymentPaid
} from '@/utils/storage';

import type { WaitlistEntry, SlotMonitoringState, AgentNotification } from '@/services/aiAgentService';
import { type NoShowAuditRecord, calculateNoShowRefund } from '@/services/gracePeriodService';

export interface PendingBookingDetails {
  stationId?: string;
  stationName: string;
  stationLocation: string;
  lat?: number;
  lng?: number;
  chargerType: ChargerType;
  date: string;
  time: string;
  dateLabel: string;
  paymentChoice?: 'ONLINE' | 'PAY_AT_STATION';
}

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
  // Payment / Bookings
  bookings: BookingWithPayment[];
  addBooking: (booking: BookingWithPayment) => void;
  cancelPaidBooking: (bookingId: string) => void;
  startChargingSession: (bookingId: string) => boolean;
  completeChargingSession: (bookingId: string) => boolean;
  pendingBookingDetails: PendingBookingDetails | null;
  setPendingBookingDetails: (details: PendingBookingDetails | null) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (coords: { lat: number; lng: number } | null) => void;
  // Grace Period & No-Show Configuration
  graceConfig: GracePeriodConfig;
  updateGraceConfig: (newConfig: Partial<GracePeriodConfig>) => void;
  noShowAuditRecords: NoShowAuditRecord[];
  simulateSlotStartNow: (bookingId: string) => void;
  simulateGraceExpiryNow: (bookingId: string) => void;
  // AI Agent & Smart Monitoring
  waitlist: WaitlistEntry[];
  addToWaitlist: (entry: WaitlistEntry) => void;
  removeFromWaitlist: (id: string) => void;
  notifications: AgentNotification[];
  addNotification: (notification: AgentNotification) => void;
  dismissNotification: (id: string) => void;
  activeSlotMonitoring: SlotMonitoringState | null;
  setActiveSlotMonitoring: (state: SlotMonitoringState | null) => void;
  // Support & Tickets System
  tickets: SupportTicket[];
  addTicket: (ticket: SupportTicket) => void;
  updateTicketState: (ticketId: string, updates: Partial<SupportTicket>) => void;
  addTicketReply: (ticketId: string, message: string, isInternal?: boolean, senderName?: string) => void;
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  // Station Owner Operations
  ownerStations: Station[];
  addStation: (station: Station) => void;
  updateStationDetails: (station: Station) => void;
  chargers: IndividualCharger[];
  updateCharger: (chargerId: string, status: ChargerOperationalStatus) => { success: boolean; message: string };
  refunds: RefundRecord[];
  markCounterPayment: (bookingId: string) => boolean;
  markStationPayment: (bookingId: string) => boolean;
  stationOwnerTab: string;
  setStationOwnerTab: (tab: string) => void;
  authLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// URL pathname to PageName mapping
const getPageFromPath = (): PageName => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (path === '/station-owner/register') return 'station-owner-register';
  if (path === '/station-owner/stations') return 'station-owner-stations';
  if (path === '/station-owner/chargers') return 'station-owner-chargers';
  if (path === '/station-owner/bookings') return 'station-owner-bookings';
  if (path === '/station-owner/payments' || path === '/station-owner/pay-at-station') return 'station-owner-payments';
  if (path === '/station-owner/refunds') return 'station-owner-refunds';
  if (path === '/station-owner/tickets') return 'station-owner-tickets';
  if (path === '/station-owner/analytics') return 'station-owner-analytics';
  if (path === '/station-owner/ai-insights' || path === '/station-owner/insights') return 'station-owner-ai-insights';
  if (path === '/station-owner/settings') return 'station-owner-settings';
  if (path === '/station-owner/dashboard' || path === '/station-owner') return 'station-owner-dashboard';
  if (path === '/dashboard') return 'dashboard';
  if (path === '/my-bookings' || path === '/bookings') return 'my-bookings';
  if (path === '/ai-agent') return 'ai-agent';
  if (path === '/support' || path === '/help') return 'support';
  if (path === '/payment') return 'payment';
  if (path === '/reserve' || path === '/book') return 'reserve';
  if (path === '/stations') return 'stations';
  if (path === '/station-details') return 'station-details';
  if (path === '/trip-planner') return 'trip-planner';
  if (path === '/how-it-works') return 'how-it-works';
  if (path === '/login') return 'login';
  return 'home';
};

export const pageToPath: Record<PageName, string> = {
  home: '/',
  stations: '/stations',
  'station-details': '/station-details',
  reserve: '/reserve',
  'trip-planner': '/trip-planner',
  'how-it-works': '/how-it-works',
  dashboard: '/dashboard',
  login: '/login',
  payment: '/payment',
  'my-bookings': '/my-bookings',
  'ai-agent': '/ai-agent',
  support: '/support',
  'station-owner-dashboard': '/station-owner/dashboard',
  'station-owner-stations': '/station-owner/stations',
  'station-owner-chargers': '/station-owner/chargers',
  'station-owner-bookings': '/station-owner/bookings',
  'station-owner-payments': '/station-owner/payments',
  'station-owner-refunds': '/station-owner/refunds',
  'station-owner-tickets': '/station-owner/tickets',
  'station-owner-analytics': '/station-owner/analytics',
  'station-owner-ai-insights': '/station-owner/ai-insights',
  'station-owner-settings': '/station-owner/settings',
  'station-owner-register': '/station-owner/register',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState<PageName>(() => getPageFromPath());
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [liveStations, setLiveStations] = useState<Station[]>(stationData);
  const [bookings, setBookings] = useState<BookingWithPayment[]>([]);
  const [pendingBookingDetails, setPendingBookingDetails] = useState<PendingBookingDetails | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [activeSlotMonitoring, setActiveSlotMonitoring] = useState<SlotMonitoringState | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('USER');
  const [graceConfig, setGraceConfig] = useState<GracePeriodConfig>(getGracePeriodConfig());
  const [noShowAuditRecords, setNoShowAuditRecords] = useState<NoShowAuditRecord[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  // Station Owner states
  const [chargers, setChargers] = useState<IndividualCharger[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [stationOwnerTab, setStationOwnerTab] = useState<string>('overview');

  useEffect(() => {
    try {
      const storedUser = getUser();
      setUser(storedUser);
      if (storedUser?.role) {
        setUserRole(storedUser.role);
      }
      setReservations(getReservations());
      setBookings(getBookings());
      setTickets(getTickets());
      setGraceConfig(getGracePeriodConfig());
      setNoShowAuditRecords(getNoShowAuditRecords());
      setLiveStations(getCustomStations());
      setChargers(getIndividualChargers());
      setRefunds(getRefunds());

      const recentId = getRecentStationId();
      if (recentId) {
        const s = stationData.find((s) => s.id === recentId);
        if (s) setSelectedStation(s);
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Listen to browser popstate (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Access control & Role guard for station owner & user routes
  useEffect(() => {
    if (authLoading) return;

    const isStationOwnerRoute = page.startsWith('station-owner');
    if (isStationOwnerRoute && page !== 'station-owner-register') {
      if (!user) {
        setPage('login');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.history.replaceState({ page: 'login' }, '', '/login');
        }
      } else if (user.role !== 'STATION_OWNER') {
        // Disallow EV User from accessing station owner routes: redirect to EV User dashboard
        setPage('dashboard');
        if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
          window.history.replaceState({ page: 'dashboard' }, '', '/dashboard');
        }
      }
    } else if (page === 'dashboard') {
      if (user && user.role === 'STATION_OWNER') {
        // Disallow Station Owner from accessing EV User dashboard: redirect to Station Owner dashboard
        setPage('station-owner-dashboard');
        if (typeof window !== 'undefined' && window.location.pathname !== '/station-owner/dashboard') {
          window.history.replaceState({ page: 'station-owner-dashboard' }, '', '/station-owner/dashboard');
        }
      }
    }
  }, [page, user, authLoading]);

  const addNotification = useCallback((notification: AgentNotification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 20));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Update Grace Period Config
  const updateGraceConfig = useCallback((newConfig: Partial<GracePeriodConfig>) => {
    setGraceConfig((prev) => {
      const updated: GracePeriodConfig = {
        ...prev,
        ...newConfig,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.name || 'Admin',
      };
      saveGracePeriodConfig(updated);
      return updated;
    });
  }, [user?.name]);

  // Grace Period & No-Show Lifecycle Engine (1-second tick)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      setBookings((prevBookings) => {
        let changed = false;
        const updatedList = prevBookings.map((b) => {
          const currentStatus = b.status === 'confirmed' ? 'RESERVED' : b.status;
          const startTs = b.slotStartTimestamp || new Date(b.createdAt).getTime();
          const graceMinutes = b.gracePeriodMinutes || graceConfig.gracePeriodMinutes;
          const graceEndTs = b.gracePeriodEndTimestamp || (startTs + graceMinutes * 60 * 1000);
          const history = b.notificationHistory || [];

          // 1. Transition RESERVED -> GRACE_PERIOD if start time arrived
          if (currentStatus === 'RESERVED' && now >= startTs && now < graceEndTs) {
            changed = true;
            const updated: BookingWithPayment = {
              ...b,
              status: 'GRACE_PERIOD',
              slotStartTimestamp: startTs,
              gracePeriodMinutes: graceMinutes,
              gracePeriodEndTimestamp: graceEndTs,
              notificationHistory: [...history, 'notifiedGraceStarted'],
            };
            storeUpdateBooking(updated);

            addNotification({
              id: `NTF-GRACE-START-${b.id}`,
              title: 'Charging Slot Started',
              message: 'Your charging slot has started. Please arrive and start charging within your grace period.',
              type: 'info',
              timestamp: new Date().toISOString(),
              actionLabel: 'Navigate',
              actionData: { bookingId: b.id },
            });

            return updated;
          }

          // 2. 5-minute warning before grace period expiration
          if (currentStatus === 'GRACE_PERIOD' && !history.includes('notified5MinWarning')) {
            const remainingMs = graceEndTs - now;
            if (remainingMs <= 5 * 60 * 1000 && remainingMs > 0) {
              changed = true;
              const updated: BookingWithPayment = {
                ...b,
                notificationHistory: [...history, 'notified5MinWarning'],
              };
              storeUpdateBooking(updated);

              addNotification({
                id: `NTF-5MIN-WARN-${b.id}`,
                title: 'Grace Period Warning (5 Mins Remaining)',
                message: 'Your charging slot will expire in 5 minutes. Start charging to keep your reservation.',
                type: 'warning',
                timestamp: new Date().toISOString(),
                actionLabel: 'Start Charging',
                actionData: { bookingId: b.id },
              });

              return updated;
            }
          }

          // 3. Grace period expired -> NO_SHOW transition
          if (currentStatus === 'GRACE_PERIOD' && now >= graceEndTs) {
            changed = true;
            const isPayAtStation =
              b.payment.method === 'PAY_AT_STATION' ||
              b.payment.method === 'PAY_AT_COUNTER' ||
              b.payment.method === 'counter';

            const nowIso = new Date().toISOString();
            let updated: BookingWithPayment;

            if (isPayAtStation) {
              updated = {
                ...b,
                status: 'NO_SHOW',
                noShowAt: nowIso,
                refundStatus: 'NOT_APPLICABLE',
                payment: {
                  ...b.payment,
                  status: 'NOT_PAID',
                  refundStatus: 'NOT_APPLICABLE',
                },
                notificationHistory: [...history, 'notifiedNoShow'],
              };
              storeUpdateBooking(updated);

              addNotification({
                id: `NTF-NOSHOW-${b.id}`,
                title: 'Booking Expired (No-Show)',
                message: 'Your booking expired because you did not arrive within the grace period. No payment was collected, so no refund is required.',
                type: 'warning',
                timestamp: nowIso,
                actionLabel: 'View Details',
                actionData: { bookingId: b.id },
              });
            } else {
              // Online payment -> calculate refund minus 10% no-show charge
              const originalAmount = b.payment.amount || 300;
              const chargePct = graceConfig.noShowChargePercentage ?? 10;
              const refundCalc = calculateNoShowRefund(originalAmount, chargePct);

              updated = {
                ...b,
                status: 'NO_SHOW',
                noShowAt: nowIso,
                originalPaymentAmount: refundCalc.originalAmount,
                noShowCharge: refundCalc.noShowCharge,
                refundAmount: refundCalc.refundAmount,
                refundStatus: 'REFUNDED',
                refundReason: 'Booking not used within grace period',
                refundProcessedAt: nowIso,
                payment: {
                  ...b.payment,
                  status: 'refunded',
                  refundStatus: 'REFUNDED',
                },
                notificationHistory: [...history, 'notifiedNoShow'],
              };
              storeUpdateBooking(updated);

              // Record refund
              const refundRecord: RefundRecord = {
                id: `RFND-${Date.now()}-${b.id.slice(-4)}`,
                bookingId: b.id,
                stationId: b.stationId,
                stationName: b.stationName,
                userName: b.userName || user?.name || 'EV Driver',
                userEmail: b.userEmail || user?.email || 'user@example.com',
                originalAmount: refundCalc.originalAmount,
                noShowCharge: refundCalc.noShowCharge,
                refundAmount: refundCalc.refundAmount,
                amount: refundCalc.refundAmount,
                reason: 'Booking not used within grace period',
                status: 'REFUNDED',
                createdAt: nowIso,
                processedAt: nowIso,
                txnRef: `TXN-RFND-${Date.now().toString().slice(-6)}`,
              };
              saveRefundRecord(refundRecord);
              setRefunds((prev) => [refundRecord, ...prev.filter((r) => r.id !== refundRecord.id)]);

              addNotification({
                id: `NTF-NOSHOW-${b.id}`,
                title: 'Booking Expired — Refund Processed',
                message: `Your booking expired because you did not arrive within the grace period. Original payment: ₹${refundCalc.originalAmount} | No-show charge: ₹${refundCalc.noShowCharge} | Refund amount: ₹${refundCalc.refundAmount}. Refund is being processed.`,
                type: 'warning',
                timestamp: nowIso,
                actionLabel: 'View Refund',
                actionData: { bookingId: b.id },
              });
            }

            // Audit record creation
            const audit: NoShowAuditRecord = {
              id: `AUDIT-${Date.now()}-${b.id}`,
              bookingId: b.id,
              stationId: b.stationId,
              stationName: b.stationName,
              chargerNumber: b.chargerNumber || 'Charger 1',
              userId: user?.id || 'usr-default',
              userName: user?.name || 'EV Driver',
              slotTime: b.time,
              slotStartTimestamp: startTs,
              gracePeriodMinutes: graceMinutes,
              expiredAt: new Date().toISOString(),
              policyApplied: graceConfig.noShowPolicy,
              penaltyInr: graceConfig.noShowPolicy === 'PENALTY' ? (graceConfig.penaltyAmountInr || 50) : 0,
            };
            saveNoShowAuditRecord(audit);
            setNoShowAuditRecords((prevAudits) => [audit, ...prevAudits].slice(0, 100));

            // Release reserved charger port in liveStations
            setLiveStations((stations) =>
              stations.map((s) => {
                if (s.id === updated.stationId) {
                  const chargers = s.chargers.map((c) =>
                    c.type === updated.chargerType ? { ...c, availablePorts: Math.min(c.totalPorts, c.availablePorts + 1) } : c
                  );
                  return { ...s, chargers };
                }
                return s;
              })
            );

            return updated;
          }

          return b;
        });

        return changed ? updatedList : prevBookings;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [graceConfig, user, addNotification]);

  // Simulation helpers for immediate testing
  const simulateSlotStartNow = useCallback((bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const now = Date.now();
        const graceMinutes = b.gracePeriodMinutes || graceConfig.gracePeriodMinutes;
        const updated: BookingWithPayment = {
          ...b,
          status: 'GRACE_PERIOD',
          slotStartTimestamp: now,
          gracePeriodMinutes: graceMinutes,
          gracePeriodEndTimestamp: now + graceMinutes * 60 * 1000,
        };
        storeUpdateBooking(updated);
        return updated;
      })
    );
  }, [graceConfig.gracePeriodMinutes]);

  const simulateGraceExpiryNow = useCallback((bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const now = Date.now();
        const nowIso = new Date().toISOString();
        const isPayAtStation =
          b.payment.method === 'PAY_AT_STATION' ||
          b.payment.method === 'PAY_AT_COUNTER' ||
          b.payment.method === 'counter';

        let updated: BookingWithPayment;
        if (isPayAtStation) {
          updated = {
            ...b,
            status: 'NO_SHOW',
            noShowAt: nowIso,
            refundStatus: 'NOT_APPLICABLE',
            payment: {
              ...b.payment,
              status: 'NOT_PAID',
              refundStatus: 'NOT_APPLICABLE',
            },
            gracePeriodEndTimestamp: now - 1000,
          };
          addNotification({
            id: `NTF-NOSHOW-SIM-${b.id}`,
            title: 'Booking Expired (No-Show)',
            message: 'Your booking expired because you did not arrive within the grace period. No payment was collected, so no refund is required.',
            type: 'warning',
            timestamp: nowIso,
          });
        } else {
          const originalAmount = b.payment.amount || 300;
          const chargePct = graceConfig.noShowChargePercentage ?? 10;
          const refundCalc = calculateNoShowRefund(originalAmount, chargePct);

          updated = {
            ...b,
            status: 'NO_SHOW',
            noShowAt: nowIso,
            gracePeriodEndTimestamp: now - 1000,
            originalPaymentAmount: refundCalc.originalAmount,
            noShowCharge: refundCalc.noShowCharge,
            refundAmount: refundCalc.refundAmount,
            refundStatus: 'REFUNDED',
            refundReason: 'Booking not used within grace period',
            refundProcessedAt: nowIso,
            payment: {
              ...b.payment,
              status: 'refunded',
              refundStatus: 'REFUNDED',
            },
          };

          const refundRecord: RefundRecord = {
            id: `RFND-${Date.now()}-${b.id.slice(-4)}`,
            bookingId: b.id,
            stationId: b.stationId,
            stationName: b.stationName,
            userName: b.userName || user?.name || 'EV Driver',
            userEmail: b.userEmail || user?.email || 'user@example.com',
            originalAmount: refundCalc.originalAmount,
            noShowCharge: refundCalc.noShowCharge,
            refundAmount: refundCalc.refundAmount,
            amount: refundCalc.refundAmount,
            reason: 'Booking not used within grace period',
            status: 'REFUNDED',
            createdAt: nowIso,
            processedAt: nowIso,
            txnRef: `TXN-RFND-${Date.now().toString().slice(-6)}`,
          };
          saveRefundRecord(refundRecord);
          setRefunds((prevRefunds) => [refundRecord, ...prevRefunds.filter((r) => r.id !== refundRecord.id)]);

          addNotification({
            id: `NTF-NOSHOW-SIM-${b.id}`,
            title: 'Booking Expired — Refund Processed',
            message: `Your booking expired because you did not arrive within the grace period. Original payment: ₹${refundCalc.originalAmount} | No-show charge: ₹${refundCalc.noShowCharge} | Refund amount: ₹${refundCalc.refundAmount}. Refund is being processed.`,
            type: 'warning',
            timestamp: nowIso,
          });
        }

        storeUpdateBooking(updated);

        // Release charger
        setLiveStations((stations) =>
          stations.map((s) => {
            if (s.id === updated.stationId) {
              const chargers = s.chargers.map((c) =>
                c.type === updated.chargerType ? { ...c, availablePorts: Math.min(c.totalPorts, c.availablePorts + 1) } : c
              );
              return { ...s, chargers };
            }
            return s;
          })
        );

        return updated;
      })
    );
  }, [graceConfig.noShowChargePercentage, user?.name, user?.email, addNotification]);

  // Simulate live availability updates and waitlist check
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStations((prev) => {
        const updated = prev.map((station) => {
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
        });

        // Smart Waitlist Notification Trigger (Section 9)
        setWaitlist((currentWaitlist) => {
          if (currentWaitlist.length === 0) return currentWaitlist;
          return currentWaitlist.map((entry) => {
            if (entry.status !== 'waiting') return entry;
            const station = updated.find((s) => s.id === entry.stationId);
            if (station && station.chargers.some((c) => c.type === entry.chargerType && c.availablePorts > 0)) {
              // Notify user that charger became available
              setNotifications((prevN) => [
                {
                  id: `NTF-${Date.now()}`,
                  title: 'Waitlist Update: Charger Available!',
                  message: `${entry.chargerType} charger is now available at ${entry.stationName}. Would you like to reserve it?`,
                  type: 'success',
                  timestamp: new Date().toISOString(),
                  actionLabel: 'Reserve Now',
                  actionData: { stationId: entry.stationId, chargerType: entry.chargerType },
                },
                ...prevN.slice(0, 9),
              ]);
              return { ...entry, status: 'notified', notifiedChargerPort: 'Port 2' };
            }
            return entry;
          });
        });

        return updated;
      });
      setLastUpdated('Just now');
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const navigate = useCallback((newPage: PageName) => {
    setPage(newPage);
    const targetPath = pageToPath[newPage] || '/';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      try {
        window.history.pushState({ page: newPage }, '', targetPath);
      } catch {
        // ignore
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectStation = useCallback((station: Station | null) => {
    setSelectedStation(station);
    if (station) setRecentStationId(station.id);
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    const role = u.role || 'USER';
    setUserRole(role);
    saveUser(u);
    if (role === 'STATION_OWNER') {
      navigate('station-owner-dashboard');
    } else {
      navigate('dashboard');
    }
  }, [navigate]);

  const logout = useCallback(() => {
    setUser(null);
    setUserRole('USER');
    clearUser();
    navigate('home');
  }, [navigate]);

  const addReservation = useCallback((reservation: Reservation) => {
    setReservations((prev) => {
      const updated = [reservation, ...prev].slice(0, 20);
      saveReservation(reservation);
      return updated;
    });
  }, []);

  const addBooking = useCallback(
    (booking: BookingWithPayment) => {
      const graceMinutes = booking.gracePeriodMinutes || graceConfig.gracePeriodMinutes;
      const startTs = booking.slotStartTimestamp || Date.now();
      const endTs = booking.slotEndTimestamp || startTs + 45 * 60 * 1000;
      const graceEndTs = booking.gracePeriodEndTimestamp || startTs + graceMinutes * 60 * 1000;

      const fullBooking: BookingWithPayment = {
        ...booking,
        userId: booking.userId || user?.id || 'usr-default',
        userName: booking.userName || user?.name || 'EV Driver',
        userEmail: booking.userEmail || user?.email || 'driver@chargenix.io',
        slotStartTimestamp: startTs,
        slotEndTimestamp: endTs,
        gracePeriodMinutes: graceMinutes,
        gracePeriodEndTimestamp: graceEndTs,
        status: booking.status || 'RESERVED',
        notificationHistory: booking.notificationHistory || [],
      };

      setBookings((prev) => {
        const updated = [fullBooking, ...prev.filter((b) => b.id !== fullBooking.id)].slice(0, 50);
        saveBooking(fullBooking);
        return updated;
      });

      // Mark the station charger as reserved/occupied
      setLiveStations((stations) =>
        stations.map((s) => {
          if (s.id === fullBooking.stationId) {
            const chargers = s.chargers.map((c) =>
              c.type === fullBooking.chargerType
                ? { ...c, availablePorts: Math.max(0, c.availablePorts - 1) }
                : c
            );
            return { ...s, chargers };
          }
          return s;
        })
      );

      // Notification for booking creation
      addNotification({
        id: `NTF-BOOKING-CREATED-${fullBooking.id}`,
        title: 'Charging Slot Reserved',
        message: `Your charging slot starts at ${fullBooking.startTime || fullBooking.time}. Please arrive and start charging within your ${graceMinutes}-min grace period.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        actionLabel: 'View Booking',
        actionData: { bookingId: fullBooking.id },
      });

      // Monitor slot
      setActiveSlotMonitoring({
        bookingId: fullBooking.id,
        stationName: fullBooking.stationName,
        timeSlot: fullBooking.time,
        startTime: new Date(startTs).toISOString(),
        gracePeriodMinutes: graceMinutes,
        status: fullBooking.status === 'GRACE_PERIOD' ? 'started' : 'upcoming',
        message: `Your reservation at ${fullBooking.stationName} is locked. Grace period: ${graceMinutes} minutes.`,
      });
    },
    [graceConfig.gracePeriodMinutes, addNotification]
  );

  const startChargingSession = useCallback(
    (bookingId: string): boolean => {
      let success = false;
      setBookings((prev) => {
        const idx = prev.findIndex((b) => b.id === bookingId);
        if (idx === -1) return prev;
        const b = prev[idx];
        // Cannot start charging if NO_SHOW, CANCELLED, or COMPLETED
        if (
          b.status === 'NO_SHOW' ||
          b.status === 'CANCELLED' ||
          b.status === 'COMPLETED' ||
          b.status === 'cancelled' ||
          b.status === 'completed'
        ) {
          return prev;
        }

        const updated: BookingWithPayment = {
          ...b,
          status: 'CHARGING',
          chargingStartedAt: new Date().toISOString(),
          notificationHistory: [...(b.notificationHistory || []), 'notifiedChargingStarted'],
        };
        const nextList = [...prev];
        nextList[idx] = updated;
        storeUpdateBooking(updated);
        success = true;

        // Ensure charger is marked occupied
        setLiveStations((stations) =>
          stations.map((s) => {
            if (s.id === updated.stationId) {
              const chargers = s.chargers.map((c) =>
                c.type === updated.chargerType
                  ? { ...c, availablePorts: Math.max(0, c.availablePorts - 1) }
                  : c
              );
              return { ...s, chargers };
            }
            return s;
          })
        );

        addNotification({
          id: `NTF-CHARGE-${bookingId}-${Date.now()}`,
          title: 'Charging Session Started',
          message: 'Charging session started successfully.',
          type: 'success',
          timestamp: new Date().toISOString(),
          actionLabel: 'View Bookings',
          actionData: { bookingId },
        });

        return nextList;
      });
      return success;
    },
    [addNotification]
  );

  const completeChargingSession = useCallback(
    (bookingId: string): boolean => {
      let success = false;
      setBookings((prev) => {
        const idx = prev.findIndex((b) => b.id === bookingId);
        if (idx === -1) return prev;
        const b = prev[idx];
        const updated: BookingWithPayment = {
          ...b,
          status: 'COMPLETED',
        };
        const nextList = [...prev];
        nextList[idx] = updated;
        storeUpdateBooking(updated);
        success = true;

        // Release charger back to Available
        setLiveStations((stations) =>
          stations.map((s) => {
            if (s.id === updated.stationId) {
              const chargers = s.chargers.map((c) =>
                c.type === updated.chargerType
                  ? { ...c, availablePorts: Math.min(c.totalPorts, c.availablePorts + 1) }
                  : c
              );
              return { ...s, chargers };
            }
            return s;
          })
        );

        addNotification({
          id: `NTF-COMPLETE-${bookingId}-${Date.now()}`,
          title: 'Charging Completed',
          message: `Charging completed at ${updated.stationName}. The slot is now released.`,
          type: 'success',
          timestamp: new Date().toISOString(),
          actionLabel: 'View Receipt',
          actionData: { bookingId },
        });

        return nextList;
      });
      return success;
    },
    [addNotification]
  );

  const cancelPaidBooking = useCallback(
    (bookingId: string) => {
      const updated = cancelBooking(bookingId);
      if (updated) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));

        const isPayAtStation =
          updated.payment.method === 'PAY_AT_STATION' ||
          updated.payment.method === 'PAY_AT_COUNTER' ||
          updated.payment.method === 'counter';

        if (!isPayAtStation) {
          setRefunds(getRefunds());
        }

        // Release charger port back to available
        setLiveStations((stations) =>
          stations.map((s) => {
            if (s.id === updated.stationId) {
              const chargers = s.chargers.map((c) =>
                c.type === updated.chargerType
                  ? { ...c, availablePorts: Math.min(c.totalPorts, c.availablePorts + 1) }
                  : c
              );
              return { ...s, chargers };
            }
            return s;
          })
        );

        addNotification({
          id: `NTF-CANCEL-${bookingId}-${Date.now()}`,
          title: 'Booking Cancelled',
          message: isPayAtStation
            ? `Your Pay at Station booking ${bookingId} was cancelled and the slot has been released. No payment was collected, so no refund is required.`
            : `Your booking ${bookingId} was cancelled and a full refund of ₹${updated.originalPaymentAmount || updated.payment.amount} has been initiated.`,
          type: 'info',
          timestamp: new Date().toISOString(),
        });
      }
    },
    [addNotification]
  );

  const addToWaitlist = useCallback((entry: WaitlistEntry) => {
    setWaitlist((prev) => [entry, ...prev.filter((w) => w.id !== entry.id)]);
  }, []);

  const removeFromWaitlist = useCallback((id: string) => {
    setWaitlist((prev) => prev.filter((w) => w.id !== id));
  }, []);



  const addTicket = useCallback((ticket: SupportTicket) => {
    const fullTicket: SupportTicket = {
      ...ticket,
      userId: ticket.userId || user?.id || 'usr-default',
      userName: ticket.userName || user?.name || 'EV Driver',
      userEmail: ticket.userEmail || user?.email || 'driver@chargenix.io',
    };
    setTickets((prev) => [fullTicket, ...prev.filter((t) => t.id !== fullTicket.id)]);
    storeSaveTicket(fullTicket);

    addNotification({
      id: `NTF-TKT-${ticket.id}`,
      title: 'Ticket Submitted',
      message: `Your ticket ${ticket.id} (${ticket.priority} Priority) has been received and routed to ${ticket.department}.`,
      type: ticket.isSafetyConcern ? 'warning' : 'info',
      timestamp: new Date().toISOString(),
      actionLabel: 'View Ticket',
      actionData: { ticketId: ticket.id },
    });
  }, [addNotification]);

  const updateTicketState = useCallback((ticketId: string, updates: Partial<SupportTicket>) => {
    const updated = storeUpdateTicket(ticketId, updates);
    if (updated) {
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));

      if (updates.status) {
        addNotification({
          id: `NTF-TKT-STATUS-${ticketId}-${Date.now()}`,
          title: `Ticket ${ticketId} Updated`,
          message: `Status changed to ${updates.status.replace('_', ' ')}.`,
          type: updates.status === 'RESOLVED' ? 'success' : updates.status === 'ESCALATED' ? 'warning' : 'info',
          timestamp: new Date().toISOString(),
          actionLabel: 'View Ticket',
          actionData: { ticketId },
        });
      }
    }
  }, [addNotification]);

  const addTicketReply = useCallback(
    (ticketId: string, message: string, isInternal: boolean = false, senderName: string = 'Support') => {
      const updated = storeAddTicketMessage(ticketId, {
        sender: isInternal ? 'support' : 'user',
        senderName: senderName || (user?.name ?? 'User'),
        message,
        isInternalNote: isInternal,
      });

      if (updated) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));

        if (!isInternal) {
          addNotification({
            id: `NTF-MSG-${ticketId}-${Date.now()}`,
            title: `Update on Ticket ${ticketId}`,
            message: `New message recorded on your ticket.`,
            type: 'info',
            timestamp: new Date().toISOString(),
            actionLabel: 'View Ticket',
            actionData: { ticketId },
          });
        }
      }
    },
    [user?.name, addNotification]
  );

  // Station Owner operations & Data Isolation (Requirements 9, 10, 11, 12)
  const ownerStations = useMemo(() => {
    if (!user) return [];
    if (
      user.id === 'owner-demo-01' || user.email === 'owner@chargenix.io' ||
      user.id === 'owner-mgit-ravi' || user.email === 'owner@chargenix.demo'
    ) {
      // Demo owner: Ravi Kumar owns only the MGIT station
      return liveStations.filter((s) => s.ownerId === 'owner-mgit-ravi');
    }
    return liveStations.filter((s) => s.ownerId === user.id || s.ownerId === user.email);
  }, [liveStations, user]);

  const ownerStationIds = useMemo(() => ownerStations.map((s: Station) => s.id), [ownerStations]);

  // Scoped bookings: EV User strictly gets their own bookings; Station Owner gets their stations' bookings
  const scopedBookings = useMemo(() => {
    if (!user) return [];
    if (user.role === 'STATION_OWNER') {
      return bookings.filter((b) => ownerStationIds.includes(b.stationId));
    }
    return bookings.filter(
      (b) =>
        (b.userId && b.userId === user.id) ||
        (b.userEmail && b.userEmail === user.email) ||
        (!b.userId && (user.id === 'usr-default' || user.id === 'usr-guest'))
    );
  }, [bookings, user, ownerStationIds]);

  // Scoped tickets: EV User gets their own tickets; Station Owner gets their stations' tickets
  const scopedTickets = useMemo(() => {
    if (!user) return [];
    if (user.role === 'STATION_OWNER') {
      return tickets.filter((t) => t.stationId && ownerStationIds.includes(t.stationId));
    }
    return tickets.filter(
      (t) =>
        (t.userId && t.userId === user.id) ||
        (t.userEmail && t.userEmail === user.email) ||
        (!t.userId && (user.id === 'usr-default' || user.id === 'usr-guest'))
    );
  }, [tickets, user, ownerStationIds]);

  // Scoped refunds: EV User gets their own refunds; Station Owner gets their stations' refunds
  const scopedRefunds = useMemo(() => {
    if (!user) return [];
    if (user.role === 'STATION_OWNER') {
      return refunds.filter((r) => ownerStationIds.includes(r.stationId));
    }
    return refunds.filter(
      (r) =>
        r.userEmail === user.email ||
        (user.id === 'usr-default' || user.id === 'usr-guest')
    );
  }, [refunds, user, ownerStationIds]);

  const addStation = useCallback((newStation: Station) => {
    saveCustomStation(newStation);
    setLiveStations((prev) => [newStation, ...prev.filter((s) => s.id !== newStation.id)]);
    addNotification({
      id: `NTF-STN-ADD-${newStation.id}`,
      title: 'Station Added Successfully',
      message: `${newStation.name} has been added to your portfolio.`,
      type: 'success',
      timestamp: new Date().toISOString(),
    });
  }, [addNotification]);

  const updateStationDetails = useCallback((stn: Station) => {
    saveCustomStation(stn);
    setLiveStations((prev) => prev.map((s) => (s.id === stn.id ? stn : s)));
    addNotification({
      id: `NTF-STN-UPD-${stn.id}`,
      title: 'Station Updated',
      message: `${stn.name} details have been updated.`,
      type: 'info',
      timestamp: new Date().toISOString(),
    });
  }, [addNotification]);

  const updateCharger = useCallback(
    (chargerId: string, status: ChargerOperationalStatus) => {
      const res = storeUpdateChargerStatus(chargerId, status);
      if (res.success && res.charger) {
        setChargers((prev) => prev.map((c) => (c.id === chargerId ? res.charger! : c)));
        addNotification({
          id: `NTF-CHG-${chargerId}-${Date.now()}`,
          title: `Charger ${chargerId} Updated`,
          message: `Status updated to ${status}.`,
          type: status === 'OFFLINE' || status === 'MAINTENANCE' ? 'warning' : 'info',
          timestamp: new Date().toISOString(),
        });
      }
      return { success: res.success, message: res.message };
    },
    [addNotification]
  );

  const markCounterPayment = useCallback(
    (bookingId: string): boolean => {
      const updated = markStationPaymentPaid(bookingId, user?.name || 'Station Owner');
      if (updated) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
        addNotification({
          id: `NTF-CTR-PAID-${bookingId}-${Date.now()}`,
          title: 'Pay at Station Payment Completed',
          message: `Booking ${bookingId} marked as PAID (₹${updated.payment.amount}) at station.`,
          type: 'success',
          timestamp: new Date().toISOString(),
        });
        return true;
      }
      return false;
    },
    [user?.name, addNotification]
  );

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
        bookings: scopedBookings,
        addBooking,
        cancelPaidBooking,
        startChargingSession,
        completeChargingSession,
        pendingBookingDetails,
        setPendingBookingDetails,
        userLocation,
        setUserLocation,
        graceConfig,
        updateGraceConfig,
        noShowAuditRecords,
        simulateSlotStartNow,
        simulateGraceExpiryNow,
        waitlist,
        addToWaitlist,
        removeFromWaitlist,
        notifications,
        addNotification,
        dismissNotification,
        activeSlotMonitoring,
        setActiveSlotMonitoring,
        tickets: scopedTickets,
        addTicket,
        updateTicketState,
        addTicketReply,
        selectedTicketId,
        setSelectedTicketId,
        userRole,
        setUserRole,
        ownerStations,
        addStation,
        updateStationDetails,
        chargers,
        updateCharger,
        refunds: scopedRefunds,
        markCounterPayment,
        markStationPayment: markCounterPayment,
        stationOwnerTab,
        setStationOwnerTab,
        authLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
