import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, Zap, Calendar, Banknote, RotateCcw,
  LifeBuoy, BarChart3, Brain, Settings, Bell, User, LogOut,
  Plus, Edit3, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, X, ArrowUpRight,
  TrendingUp, Check, MapPin, Phone, WifiOff, Activity,
  Info, AlertCircle, ShieldAlert
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/Logo';
import type {
  Station,
  BookingWithPayment,
  SupportTicket,
  TicketStatus,
  PageName
} from '@/types';

// Tab union
type StationOwnerTab =
  | 'overview'
  | 'my-station'
  | 'chargers'
  | 'bookings'
  | 'payments'
  | 'refunds'
  | 'tickets'
  | 'analytics'
  | 'ai-insights'
  | 'settings';

const pageToTabMap: Partial<Record<string, StationOwnerTab>> = {
  'station-owner-dashboard': 'overview',
  'station-owner-stations': 'my-station',
  'station-owner-chargers': 'chargers',
  'station-owner-bookings': 'bookings',
  'station-owner-payments': 'payments',
  'station-owner-refunds': 'refunds',
  'station-owner-tickets': 'tickets',
  'station-owner-analytics': 'analytics',
  'station-owner-ai-insights': 'ai-insights',
  'station-owner-settings': 'settings',
};

const tabToPageMap: Record<StationOwnerTab, string> = {
  overview: 'station-owner-dashboard',
  'my-station': 'station-owner-stations',
  chargers: 'station-owner-chargers',
  bookings: 'station-owner-bookings',
  payments: 'station-owner-payments',
  refunds: 'station-owner-refunds',
  tickets: 'station-owner-tickets',
  analytics: 'station-owner-analytics',
  'ai-insights': 'station-owner-ai-insights',
  settings: 'station-owner-settings',
};

export function StationOwnerDashboardPage() {
  const {
    user,
    logout,
    navigate,
    page,
    ownerStations,
    addStation,
    updateStationDetails,
    chargers,
    updateCharger,
    bookings,
    refunds,
    markCounterPayment,
    tickets,
    updateTicketState,
    addTicketReply,
    notifications,
    graceConfig,
    updateGraceConfig,
  } = useApp();

  const currentTabFromPage = (page && pageToTabMap[page]) || 'overview';
  const [activeTab, setActiveTab] = useState<StationOwnerTab>(currentTabFromPage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Sync tab with external page navigation
  useEffect(() => {
    if (page && pageToTabMap[page] && pageToTabMap[page] !== activeTab) {
      setActiveTab(pageToTabMap[page]!);
    }
  }, [page]);

  const handleSelectTab = (tab: StationOwnerTab) => {
    setActiveTab(tab);
    const targetPage = tabToPageMap[tab] as PageName;
    if (targetPage && page !== targetPage) {
      navigate(targetPage);
    }
  };

  // Modals
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<BookingWithPayment | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketResolutionNote, setTicketResolutionNote] = useState('');

  // Station IDs owned by this owner
  const ownerStationIds = useMemo(() => ownerStations.map((s) => s.id), [ownerStations]);

  // Filter bookings for this station owner's stations
  const ownerBookings = useMemo(() => {
    return bookings.filter((b) => ownerStationIds.includes(b.stationId));
  }, [bookings, ownerStationIds]);

  // Filter chargers for this owner's stations
  const ownerChargers = useMemo(() => {
    return chargers.filter((c) => ownerStationIds.includes(c.stationId));
  }, [chargers, ownerStationIds]);

  // Filter refunds for this owner's stations
  const ownerRefunds = useMemo(() => {
    return refunds.filter((r) => ownerStationIds.includes(r.stationId));
  }, [refunds, ownerStationIds]);

  // Filter support tickets for this owner's stations
  const ownerTickets = useMemo(() => {
    return tickets.filter((t) => t.stationId && ownerStationIds.includes(t.stationId));
  }, [tickets, ownerStationIds]);

  // Pay at Station bookings pending
  const counterBookings = useMemo(() => {
    return ownerBookings.filter(
      (b) =>
        b.payment.method === 'PAY_AT_STATION' ||
        b.payment.method === 'PAY_AT_COUNTER' ||
        b.payment.method === 'counter'
    );
  }, [ownerBookings]);

  // Summary Metrics
  const totalStationsCount = ownerStations.length;
  const totalChargersCount = ownerChargers.length || 4;
  const availableChargersCount = ownerChargers.filter((c) => c.status === 'AVAILABLE').length || 1;
  const chargingNowCount = ownerChargers.filter((c) => c.status === 'CHARGING').length || 1;
  const offlineChargersCount = ownerChargers.filter((c) => c.status === 'OFFLINE' || c.status === 'MAINTENANCE').length || 1;
  const reservedChargersCount = ownerChargers.filter((c) => c.status === 'RESERVED').length || 1;

  // ONE STATION architecture: always use ownerStations[0]
  const myStation = ownerStations[0] || null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookingsCount = ownerBookings.filter((b) => b.date === todayStr || b.createdAt.startsWith(todayStr)).length + 8; // demo floor
  const todayRevenue = 4850; // demo figure per spec
  const noShowsTodayCount = Math.max(ownerBookings.filter((b) => b.status === 'NO_SHOW').length, 2);
  const pendingCounterAmount = counterBookings
    .filter((b) => b.payment.status === 'pending' || b.payment.status === 'PENDING' || b.payment.status === 'PAYMENT_PENDING')
    .reduce((sum, b) => sum + (b.payment.amount || 0), 0);

  // Owner Name
  const ownerDisplayName = user?.name || 'Ravi Kumar';
  const ownerBusinessName = user?.businessName || 'ChargeNix Charging Services';

  // Navigation Items
  interface NavItem {
    id: StationOwnerTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { id: 'overview',     label: 'Overview',        icon: LayoutDashboard },
    { id: 'my-station',   label: 'My Station',      icon: Building2 },
    { id: 'chargers',     label: 'Chargers',         icon: Zap,       count: totalChargersCount || 4 },
    { id: 'bookings',     label: 'Bookings',         icon: Calendar,  count: ownerBookings.length || undefined },
    { id: 'payments',     label: 'Pay at Station',   icon: Banknote,  count: counterBookings.filter(b => b.payment.status === 'pending' || b.payment.status === 'PENDING').length || undefined },
    { id: 'refunds',      label: 'Refunds',          icon: RotateCcw, count: ownerRefunds.length || undefined },
    { id: 'tickets',      label: 'Support Tickets',  icon: LifeBuoy,  count: ownerTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length || undefined },
    { id: 'analytics',    label: 'Analytics',        icon: BarChart3 },
    { id: 'ai-insights',  label: 'AI Insights',      icon: Brain,     badge: 'AI' },
    { id: 'settings',     label: 'Settings',         icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-ink-950 text-white flex flex-col pt-16">
      {/* ==================================================
          STATION OWNER DASHBOARD HEADER
          ================================================== */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-ink-950/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('home')} className="shrink-0 flex items-center gap-2">
            <Logo size="sm" />
          </button>
          <div className="h-4 w-px bg-white/15 hidden sm:block" />
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-acid flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Station Owner Dashboard
            </span>
            <span className="text-[11px] text-ink-400 font-medium truncate max-w-[200px]">
              {ownerBusinessName}
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-ink-300 hover:text-white transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-acid text-ink-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            <AnimatePresence>
              {notifDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 glass-strong rounded-2xl p-4 shadow-2xl border border-white/15 z-50 max-h-[420px] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-acid" />
                      Station Notifications
                    </span>
                    <span className="text-[11px] text-ink-400">
                      {notifications.length} unread
                    </span>
                  </div>

                  <div className="space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-ink-500 py-4 text-center">No new notifications</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs hover:border-white/15 transition-all"
                        >
                          <div className="flex items-center justify-between font-semibold text-white mb-0.5">
                            <span className="text-[11px] text-acid">{n.title}</span>
                            <span className="text-[9px] text-ink-500">Just now</span>
                          </div>
                          <p className="text-[11px] text-ink-300 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile pill */}
          <button
            onClick={() => handleSelectTab('settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-acid/20 text-acid flex items-center justify-center font-bold text-xs">
              {ownerDisplayName.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-ink-200 hidden md:inline truncate max-w-[130px]">
              {ownerDisplayName}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 border border-danger-500/20 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-ink-200 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ==================================================
          MAIN DASHBOARD LAYOUT (SIDEBAR + CONTENT)
          ================================================== */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* SIDEBAR NAVIGATION (Desktop) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-1">
          <div className="p-3.5 mb-2 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-acid animate-ping" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-acid">
                Operator Gateway Active
              </span>
            </div>
            <div className="text-xs font-semibold text-white truncate">{ownerDisplayName}</div>
            <div className="text-[10px] text-ink-400 truncate">{user?.email || 'owner@chargenix.io'}</div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id as StationOwnerTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-acid text-ink-950 font-bold shadow-lg shadow-acid/15'
                      : 'text-ink-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-ink-950' : 'text-ink-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-ink-950/20 text-ink-950'
                          : 'bg-white/10 text-ink-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-acid/20 text-acid border border-acid/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="p-3 rounded-xl bg-ink-900/60 border border-white/5 text-[11px] text-ink-400">
              <span className="text-white font-medium block mb-0.5">Need Operator Support?</span>
              Direct hotline for station hosts: 1800-CNX-HOST
            </div>
          </div>
        </aside>

        {/* MOBILE NAVIGATION BAR (Horizontal Scroll) */}
        <div className="lg:hidden w-full overflow-x-auto flex gap-2 pb-2 mb-4 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id as StationOwnerTab)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-acid text-ink-950 font-bold shadow-md'
                    : 'bg-white/5 text-ink-300 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ==================================================
            MAIN CONTENT AREA
            ================================================== */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                    Good morning, {ownerDisplayName} 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-ink-400 mt-0.5">
                    Here's your station operations summary for today.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">DEMO DATA</span>
                  <div className="flex items-center gap-1.5 text-xs text-ink-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Station ACTIVE
                  </div>
                </div>
              </div>

              {/* 8 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <SummaryCard
                  title="Offline / Maint."
                  value={offlineChargersCount}
                  subtitle="Needs attention"
                  icon={AlertTriangle}
                  color="text-rose-400"
                />
                <SummaryCard
                  title="Total Chargers"
                  value={totalChargersCount}
                  subtitle="Configured guns"
                  icon={Zap}
                  color="text-sky-400"
                />
                <SummaryCard
                  title="Available Chargers"
                  value={availableChargersCount}
                  subtitle="Ready for EVs"
                  icon={CheckCircle2}
                  color="text-emerald-400"
                />
                <SummaryCard
                  title="Charging Now"
                  value={chargingNowCount}
                  subtitle="Active sessions"
                  icon={TrendingUp}
                  color="text-amber-400"
                />
                <SummaryCard
                  title="Today's Bookings"
                  value={todayBookingsCount}
                  subtitle="+18% vs yesterday"
                  icon={Calendar}
                  color="text-acid"
                />
                <SummaryCard
                  title="Today's Revenue"
                  value={`₹${todayRevenue.toLocaleString('en-IN')}`}
                  subtitle="Settled & counter"
                  icon={Banknote}
                  color="text-emerald-400"
                />
                <SummaryCard
                  title="No-Shows"
                  value={noShowsTodayCount}
                  subtitle="Slot released"
                  icon={AlertTriangle}
                  color="text-rose-400"
                />
                <SummaryCard
                  title="Pending Pay-at-Station Payments"
                  value={`₹${pendingCounterAmount.toLocaleString('en-IN')}`}
                  subtitle="Pay at station"
                  icon={Clock}
                  color="text-amber-400"
                />
              </div>

              {/* SECTION 6: "MY STATIONS" OVERVIEW CARDS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-acid" />
                    My Station
                  </h2>
                  <button
                    onClick={() => setActiveTab('my-station')}
                    className="text-xs text-acid hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {myStation ? (
                  <div
                    className="glass-strong p-5 rounded-2xl border border-white/10 hover:border-acid/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight">
                            {myStation.name}
                          </h3>
                          <p className="text-xs text-ink-400 mt-0.5">{myStation.location}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          ACTIVE
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-2 py-3 border-y border-white/5 text-center my-3">
                        <div>
                          <span className="text-xs text-ink-400 block">Chargers</span>
                          <span className="text-sm font-bold text-white">{totalChargersCount}</span>
                        </div>
                        <div>
                          <span className="text-xs text-ink-400 block">Available</span>
                          <span className="text-sm font-bold text-emerald-400">{availableChargersCount}</span>
                        </div>
                        <div>
                          <span className="text-xs text-ink-400 block">Charging</span>
                          <span className="text-sm font-bold text-sky-400">{chargingNowCount}</span>
                        </div>
                        <div>
                          <span className="text-xs text-ink-400 block">Offline</span>
                          <span className="text-sm font-bold text-rose-400">{offlineChargersCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-ink-300 mb-4">
                        <span>Today's Bookings: <strong className="text-white">{todayBookingsCount}</strong></span>
                        <span>Today's Revenue: <strong className="text-acid">₹{todayRevenue.toLocaleString('en-IN')}</strong></span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('chargers')}
                        className="btn-secondary flex-1 text-xs py-2"
                      >
                        Manage Chargers
                      </button>
                      <button
                        onClick={() => setActiveTab('my-station')}
                        className="btn-primary text-xs py-2 px-4"
                      >
                        Station Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="glass-strong p-8 rounded-2xl border border-white/10 text-center text-ink-400">
                    No station assigned to your account yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY STATION */}
          {activeTab === 'my-station' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-display font-bold text-white">My Station</h1>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Full details for your assigned charging station.
                  </p>
                </div>
              </div>

              {myStation ? (
                <div className="glass-strong p-6 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">ACTIVE</span>
                        <span className="text-[11px] text-ink-400">Station ID: {myStation.id}</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">{myStation.name}</h2>
                      <div className="flex items-center gap-1.5 text-sm text-ink-300 mt-1">
                        <MapPin className="w-4 h-4 text-acid" />
                        {myStation.location}
                      </div>
                    </div>
                    <span className="text-yellow-400 font-bold text-sm">★ {myStation.rating}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                    <div>
                      <span className="text-[11px] text-ink-500 block">Operating Hours</span>
                      <span className="text-sm font-semibold text-white">{myStation.operatingHours || '06:00 AM – 10:00 PM'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-500 block">Contact</span>
                      <span className="text-sm font-semibold text-white">{myStation.contactNumber || '+91 98490 54321'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-500 block">Total Chargers</span>
                      <span className="text-sm font-bold text-acid">{totalChargersCount} Dispensers</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-500 block">Location (Lat/Lng)</span>
                      <span className="text-sm font-mono text-white">{myStation.lat.toFixed(4)}, {myStation.lng.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-500 block">Owner</span>
                      <span className="text-sm font-semibold text-white">{ownerDisplayName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-500 block">Business</span>
                      <span className="text-sm font-semibold text-white">{ownerBusinessName}</span>
                    </div>
                  </div>

                  {myStation.amenities?.length > 0 && (
                    <div className="border-t border-white/5 pt-4">
                      <h3 className="text-sm font-bold text-white mb-2">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {myStation.amenities.map((am: string) => (
                          <span key={am} className="text-xs px-2.5 py-1 rounded-full bg-acid/10 text-acid border border-acid/20">{am}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {myStation.description && (
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-xs text-ink-300 italic">"{myStation.description}"</p>
                    </div>
                  )}

                  <div className="border-t border-white/5 pt-4">
                    <h3 className="text-sm font-bold text-white mb-3">Charger Configuration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ownerChargers.map((chg, idx) => (
                        <div key={chg.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                          <Zap className="w-4 h-4 text-acid shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-white">Charger {idx + 1} — {chg.chargingSpeed}</span>
                            <span className="text-[11px] text-ink-400 block">{chg.connectorType} · {chg.powerKw} kW</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-acid/10 text-acid border-acid/20">{chg.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-strong p-8 rounded-2xl border border-white/10 text-center text-ink-400">No station data available.</div>
              )}
            </div>
          )}

          {/* TAB 3: CHARGERS */}
          {activeTab === 'chargers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Charger Management</h1>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Real-time dispenser power controls, online telemetry, and maintenance locks.
                  </p>
                </div>
              </div>

              {/* Chargers Table */}
              <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 border-b border-white/10 text-ink-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Charger ID</th>
                        <th className="py-3 px-4">Station</th>
                        <th className="py-3 px-4">Connector</th>
                        <th className="py-3 px-4">Power</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Current Session</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ownerChargers.map((chg) => {
                        const isCharging = chg.status === 'CHARGING';
                        return (
                          <tr key={chg.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-white">{chg.id}</td>
                            <td className="py-3 px-4 text-ink-200">{chg.stationName}</td>
                            <td className="py-3 px-4 text-ink-300">{chg.connectorType}</td>
                            <td className="py-3 px-4 font-semibold text-acid">{chg.powerKw} kW</td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  chg.status === 'AVAILABLE'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                    : chg.status === 'CHARGING'
                                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                                    : chg.status === 'GRACE_PERIOD'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                    : chg.status === 'RESERVED'
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/25'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                }`}
                              >
                                {chg.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-ink-300">
                              {chg.currentBookingId ? (
                                <div>
                                  <span className="font-mono text-white font-semibold">{chg.currentBookingId}</span>
                                  {chg.currentUser && <span className="block text-[11px] text-ink-400">{chg.currentUser}</span>}
                                </div>
                              ) : (
                                <span className="text-ink-500 italic">None</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {chg.status === 'OFFLINE' || chg.status === 'MAINTENANCE' ? (
                                  <button
                                    onClick={() => updateCharger(chg.id, 'AVAILABLE')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold"
                                  >
                                    Mark Available
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      disabled={isCharging}
                                      onClick={() => updateCharger(chg.id, 'OFFLINE')}
                                      title={isCharging ? 'Cannot mark offline while charging' : 'Take charger offline'}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                        isCharging
                                          ? 'opacity-40 cursor-not-allowed bg-white/5 text-ink-500'
                                          : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
                                      }`}
                                    >
                                      Mark Offline
                                    </button>
                                    <button
                                      disabled={isCharging}
                                      onClick={() => updateCharger(chg.id, 'MAINTENANCE')}
                                      title={isCharging ? 'Cannot mark maintenance while charging' : 'Schedule maintenance'}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                        isCharging
                                          ? 'opacity-40 cursor-not-allowed bg-white/5 text-ink-500'
                                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30'
                                      }`}
                                    >
                                      Maintenance
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Station Bookings</h1>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Showing reservation ledger for your managed stations only.
                  </p>
                </div>
              </div>

              {/* Bookings Table */}
              <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 border-b border-white/10 text-ink-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Station & Charger</th>
                        <th className="py-3 px-4">Time Window</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ownerBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">{b.id}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-white block">{b.userName || 'EV Driver'}</span>
                            <span className="text-[11px] text-ink-400">{b.userEmail || 'driver@chargenix.io'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-ink-200 block font-medium">{b.stationName}</span>
                            <span className="text-[11px] text-acid">{b.chargerNumber || b.chargerType}</span>
                          </td>
                          <td className="py-3 px-4 text-ink-300">
                            <div>{b.date}</div>
                            <div className="text-[11px] text-ink-400">{b.time}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                b.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  : b.status === 'CHARGING'
                                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                                  : b.status === 'GRACE_PERIOD'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                  : b.status === 'NO_SHOW'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                  : 'bg-purple-500/10 text-purple-400 border-purple-500/25'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">₹{b.payment?.amount || 350}</div>
                            <div className="text-[10px] text-ink-400 uppercase">
                              {b.payment?.method === 'PAY_AT_COUNTER' ? 'Counter' : b.payment?.method || 'UPI'} • {b.payment?.status}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedBookingDetails(b)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAY AT STATION */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Pay at Station</h1>
                  <p className="text-xs text-ink-400 mt-0.5">
                    On-site payments. Station owners can verify and mark pay-at-station bookings as paid.
                  </p>
                </div>
              </div>

              <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 border-b border-white/10 text-ink-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Station</th>
                        <th className="py-3 px-4">Charger</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Booking Status</th>
                        <th className="py-3 px-4">Payment Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {counterBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-ink-400">
                            No Pay-at-Station bookings recorded yet.
                          </td>
                        </tr>
                      ) : (
                        counterBookings.map((cb) => {
                          const isPaid = cb.payment.status === 'success' || cb.payment.status === 'PAID';
                          return (
                            <tr key={cb.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-white">{cb.id}</td>
                              <td className="py-3 px-4 font-medium text-white">{cb.userName || 'EV Driver'}</td>
                              <td className="py-3 px-4 text-ink-300">{cb.stationName}</td>
                              <td className="py-3 px-4 text-acid font-mono text-[11px]">{cb.chargerNumber || 'Charger 1'}</td>
                              <td className="py-3 px-4 font-bold text-acid text-sm">
                                ₹{cb.payment.amount}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                                  {cb.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {isPaid ? (
                                  <div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                      PAID
                                    </span>
                                    {cb.payment.paidBy && (
                                      <span className="block text-[10px] text-ink-400 mt-0.5">
                                        By: {cb.payment.paidBy}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                    PENDING
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {isPaid ? (
                                  <span className="text-emerald-400 text-xs font-semibold flex items-center justify-end gap-1">
                                    <Check className="w-3.5 h-3.5" /> Settled
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => markCounterPayment(cb.id)}
                                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 ml-auto"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Mark as Paid
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REFUNDS */}
          {activeTab === 'refunds' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Station Refunds</h1>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Refund audits and cancellations related to your charging stations (read-only view).
                  </p>
                </div>
              </div>

              <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 border-b border-white/10 text-ink-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Refund ID</th>
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Original Amount</th>
                        <th className="py-3 px-4">No-Show Charge</th>
                        <th className="py-3 px-4">Refund Amount</th>
                        <th className="py-3 px-4">Refund Status</th>
                        <th className="py-3 px-4">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ownerRefunds.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-ink-400">
                            No refunds recorded for your stations.
                          </td>
                        </tr>
                      ) : (
                        ownerRefunds.map((ref) => {
                          const orig = ref.originalAmount || ref.amount || 300;
                          const charge = ref.noShowCharge ?? Math.round(orig * 0.1);
                          const refund = ref.refundAmount || ref.amount || Math.max(0, orig - charge);
                          return (
                            <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-white">{ref.id}</td>
                              <td className="py-3 px-4 font-mono text-acid">{ref.bookingId}</td>
                              <td className="py-3 px-4">
                                <span className="text-white font-medium block">{ref.userName}</span>
                                <span className="text-[11px] text-ink-400">{ref.userEmail}</span>
                              </td>
                              <td className="py-3 px-4 font-mono text-ink-200">₹{orig}</td>
                              <td className="py-3 px-4 font-mono text-rose-400">₹{charge}</td>
                              <td className="py-3 px-4 font-mono font-bold text-acid text-sm">₹{refund}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    ref.status === 'REFUNDED'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                      : ref.status === 'REFUND_PROCESSING'
                                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                                      : ref.status === 'REFUND_INITIATED'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                  }`}
                                >
                                  {ref.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-ink-300 max-w-xs">{ref.reason}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SUPPORT TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Support Tickets</h1>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Hardware, customer access, and charging issue reports for your stations.
                  </p>
                </div>
              </div>

              <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 border-b border-white/10 text-ink-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Ticket ID</th>
                        <th className="py-3 px-4">Subject & Station</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ownerTickets.map((tkt) => (
                        <tr key={tkt.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">{tkt.id}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-white block truncate max-w-xs">{tkt.subject}</span>
                            <span className="text-[11px] text-ink-400">{tkt.stationName} • {tkt.chargerNumber || 'All'}</span>
                          </td>
                          <td className="py-3 px-4 text-ink-300 capitalize">{tkt.category.replace('_', ' ')}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                tkt.priority === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : tkt.priority === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-white/10 text-ink-300'
                              }`}
                            >
                              {tkt.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                tkt.status === 'RESOLVED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  : tkt.status === 'IN_PROGRESS'
                                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                              }`}
                            >
                              {tkt.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-ink-400">{tkt.createdAt.split('T')[0]}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedTicket(tkt)}
                              className="px-2.5 py-1 rounded-lg bg-acid/10 hover:bg-acid/20 text-acid font-semibold text-xs"
                            >
                              Respond
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Station Analytics</h1>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Utilization, revenue trajectories, no-show ratios, and peak charging demand.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ink-900 border border-white/10">
                  <span className="px-2.5 py-1 rounded-lg bg-acid text-ink-950 text-xs font-bold">Today</span>
                  <span className="px-2.5 py-1 rounded-lg text-ink-400 hover:text-white text-xs cursor-pointer">7 Days</span>
                  <span className="px-2.5 py-1 rounded-lg text-ink-400 hover:text-white text-xs cursor-pointer">30 Days</span>
                </div>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-ink-400">Total Bookings</span>
                  <div className="text-2xl font-bold text-white mt-1">42</div>
                  <span className="text-[11px] text-emerald-400 mt-1 block">↑ 18.2% vs last week</span>
                </div>
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-ink-400">Completed Sessions</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">36</div>
                  <span className="text-[11px] text-ink-400 mt-1 block">85.7% completion rate</span>
                </div>
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-ink-400">Charger Utilization</span>
                  <div className="text-2xl font-bold text-sky-400 mt-1">78.4%</div>
                  <span className="text-[11px] text-ink-400 mt-1 block">Peak 92% at 7:30 PM</span>
                </div>
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-ink-400">Average Session</span>
                  <div className="text-2xl font-bold text-acid mt-1">38 min</div>
                  <span className="text-[11px] text-ink-400 mt-1 block">₹439 average ticket</span>
                </div>
              </div>

              {/* Visual Demand Bars */}
              <div className="glass-strong p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center justify-between">
                  <span>Peak Charging Demand by Hour</span>
                  <span className="text-xs font-semibold text-acid">Peak: 6:00 PM – 9:00 PM</span>
                </h3>
                <div className="grid grid-cols-8 gap-2 items-end h-44 pt-6">
                  {[
                    { hour: '09 AM', pct: 30 },
                    { hour: '11 AM', pct: 45 },
                    { hour: '01 PM', pct: 60 },
                    { hour: '03 PM', pct: 50 },
                    { hour: '05 PM', pct: 75 },
                    { hour: '07 PM', pct: 95 },
                    { hour: '09 PM', pct: 85 },
                    { hour: '11 PM', pct: 35 },
                  ].map((d) => (
                    <div key={d.hour} className="flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-acid/40 to-acid transition-all duration-500 hover:brightness-125"
                        style={{ height: `${d.pct}%` }}
                      />
                      <span className="text-[10px] text-ink-400 font-mono">{d.hour}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: AI INSIGHTS */}
          {activeTab === 'ai-insights' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-acid" />
                    AI Operational Insights
                  </h1>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Automated operational intelligence derived strictly from your station portfolio telemetry, dispenser logs, and reservation patterns.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-acid font-semibold px-2.5 py-1 rounded-lg bg-acid/10 border border-acid/20">
                    Live Station Telemetry
                  </span>
                </div>
              </div>

              {/* Station Owner Specific AI Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Charger Utilization */}
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                    <span>Charger Utilization</span>
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-xl font-bold text-white">78.4%</div>
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +6.2% vs last week
                  </p>
                  <p className="text-[10px] text-ink-400 mt-0.5">
                    {chargingNowCount} active of {totalChargersCount} dispensers
                  </p>
                </div>

                {/* 2. Peak Charging Hours */}
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                    <span>Peak Charging Hours</span>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-amber-400">6 PM – 9 PM</div>
                  <p className="text-[10px] text-ink-300 mt-1">92% peak occupancy</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">Secondary surge at 12–2 PM</p>
                </div>

                {/* 3. No-Show Trends */}
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                    <span>No-Show Trends</span>
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-xl font-bold text-rose-400">{noShowsTodayCount} Recorded</div>
                  <p className="text-[10px] text-ink-300 mt-1">
                    8.6% of reservations today
                  </p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">
                    10% no-show charge applied
                  </p>
                </div>

                {/* 4. Station Demand */}
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                    <span>Station Demand</span>
                    <TrendingUp className="w-3.5 h-3.5 text-acid" />
                  </div>
                  <div className="text-xl font-bold text-acid">High Demand</div>
                  <p className="text-[10px] text-ink-300 mt-1">
                    {todayBookingsCount} bookings across {totalStationsCount} hubs
                  </p>
                  <p className="text-[10px] text-ink-400 mt-0.5">Avg 4.2 slot turns/day</p>
                </div>

                {/* 5. Revenue Trends */}
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                    <span>Revenue Trends</span>
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400">₹{todayRevenue.toLocaleString()}</div>
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +14.8% vs last week
                  </p>
                  <p className="text-[10px] text-ink-400 mt-0.5">₹439 average ticket size</p>
                </div>

                {/* 6. Charger Downtime */}
                <div className="glass-strong p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                    <span>Charger Downtime</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-amber-400">
                    {offlineChargersCount} {offlineChargersCount === 1 ? 'Charger' : 'Chargers'}
                  </div>
                  <p className="text-[10px] text-amber-400 mt-1">
                    Needs service / offline
                  </p>
                  <p className="text-[10px] text-ink-400 mt-0.5">~₹3,200 daily revenue impact</p>
                </div>

                {/* 7. Booking Patterns */}
                <div className="glass-strong p-4 rounded-2xl border border-white/10 col-span-2">
                  <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                    <span>Booking Patterns</span>
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <span className="text-sm font-bold text-white">68% Fast • 32% Ultra-Fast</span>
                      <p className="text-[10px] text-ink-400 mt-0.5">38 min average charging duration</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                      Predictable Turnaround
                    </span>
                  </div>
                </div>
              </div>

              {/* Exact AI recommendations specified in requirements */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Operational AI Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AIInsightCard
                    title="Repeated Hardware Failure Warning"
                    insight="Charger CNX-04 has had repeated handshake timeouts this week. Cable sheath wear or connector contact degradation suspected."
                    severity="high"
                    recommendation="Trigger diagnostic protocol or schedule certified technician inspection."
                  />
                  <AIInsightCard
                    title="Peak Hour Congestion Detection"
                    insight="Most charging sessions occur between 6:00 PM and 9:00 PM (92% occupancy). Drivers experienced minor queueing."
                    severity="medium"
                    recommendation="Consider reviewing charger availability and enabling dynamic slot durations during peak evening hours."
                  />
                  <AIInsightCard
                    title="No-Show Velocity Increase"
                    insight="No-show bookings increased compared with the previous period (4 no-shows recorded today across your managed stations)."
                    severity="medium"
                    recommendation="Maintain default 10-minute grace period and verify automated SMS warning notifications."
                  />
                  <AIInsightCard
                    title="Prolonged Offline Equipment"
                    insight="Two chargers (CNX-04 and CNX-13) have remained offline for an extended period (>48 hours)."
                    severity="warning"
                    recommendation="Re-energize isolation relays or complete maintenance ticket to recover estimated ₹3,200 daily uncaptured revenue."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-display font-bold text-white">Station Owner Settings</h1>
                <p className="text-xs text-ink-400 mt-0.5">
                  Configure station policies, grace periods, business metadata, and payout preferences.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Station Policy Settings */}
                <div className="glass-strong p-6 rounded-2xl border border-white/10 space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-acid" />
                    Station Grace Period & No-Show Policy
                  </h3>

                  <div>
                    <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                      Default Grace Period (Minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      value={graceConfig.gracePeriodMinutes}
                      onChange={(e) => updateGraceConfig({ gracePeriodMinutes: Number(e.target.value) })}
                      className="input-field text-sm"
                    />
                    <span className="text-[10px] text-ink-400 mt-1 block">
                      Default: 10 minutes. If user does not arrive in time, slot automatically releases.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                      No-Show Policy (MVP)
                    </label>
                    <select
                      value={graceConfig.noShowPolicy}
                      onChange={(e) => updateGraceConfig({ noShowPolicy: e.target.value as any })}
                      className="input-field text-sm bg-ink-900"
                    >
                      <option value="NONE">NONE (No automatic penalty)</option>
                      <option value="WARNING">WARNING (Notification reminder)</option>
                      <option value="PENALTY">PENALTY (Simulated deduction)</option>
                    </select>
                    <span className="text-[10px] text-ink-400 mt-1 block">
                      Per requirements, default policy is NONE.
                    </span>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="glass-strong p-6 rounded-2xl border border-white/10 space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-acid" />
                    Business & Account Profile
                  </h3>

                  <div className="space-y-2.5 text-xs text-ink-300">
                    <div>
                      <span className="text-ink-500 block text-[11px]">Owner Name</span>
                      <span className="text-white font-semibold">{ownerDisplayName}</span>
                    </div>
                    <div>
                      <span className="text-ink-500 block text-[11px]">Business / Company Name</span>
                      <span className="text-white font-semibold">{ownerBusinessName}</span>
                    </div>
                    <div>
                      <span className="text-ink-500 block text-[11px]">Registered Email</span>
                      <span className="text-white font-mono">{user?.email || 'owner@chargenix.io'}</span>
                    </div>
                    <div>
                      <span className="text-ink-500 block text-[11px]">GST / Business Registration</span>
                      <span className="text-white font-mono">{user?.gstId || '36AAACH7789F1Z5'}</span>
                    </div>
                    <div>
                      <span className="text-ink-500 block text-[11px]">Account Role</span>
                      <span className="text-acid font-bold">STATION_OWNER</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================
          ADD / EDIT STATION MODAL
          ================================================== */}
      <AnimatePresence>
        {stationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong p-6 rounded-2xl max-w-lg w-full border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-acid" />
                  {editingStation ? 'Edit Station' : 'Add New Charging Station'}
                </h3>
                <button
                  onClick={() => setStationModalOpen(false)}
                  className="p-1 rounded-lg text-ink-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const name = (form.elements.namedItem('stn-name') as HTMLInputElement).value;
                  const address = (form.elements.namedItem('stn-address') as HTMLInputElement).value;
                  const lat = Number((form.elements.namedItem('stn-lat') as HTMLInputElement).value);
                  const lng = Number((form.elements.namedItem('stn-lng') as HTMLInputElement).value);
                  const hours = (form.elements.namedItem('stn-hours') as HTMLInputElement).value;
                  const phone = (form.elements.namedItem('stn-phone') as HTMLInputElement).value;
                  const desc = (form.elements.namedItem('stn-desc') as HTMLTextAreaElement).value;

                  if (editingStation) {
                    updateStationDetails({
                      ...editingStation,
                      name,
                      location: address,
                      lat,
                      lng,
                      operatingHours: hours,
                      contactNumber: phone,
                      description: desc,
                    });
                  } else {
                    addStation({
                      id: `stn-${Date.now()}`,
                      name,
                      location: address,
                      distanceKm: 3.5,
                      lat,
                      lng,
                      mapX: 50,
                      mapY: 50,
                      chargers: [
                        { type: 'Fast', totalPorts: 6, availablePorts: 6, speedKW: 60 },
                        { type: 'Normal', totalPorts: 4, availablePorts: 4, speedKW: 22 },
                      ],
                      status: 'Available',
                      operationalStatus: 'OPEN',
                      rating: 5.0,
                      open24Hours: true,
                      operatingHours: hours,
                      contactNumber: phone,
                      description: desc,
                      amenities: ['WiFi', 'Parking', 'Restroom'],
                      ownerId: user?.id || 'owner-demo-01',
                    });
                  }
                  setStationModalOpen(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1 block">Station Name</label>
                  <input
                    name="stn-name"
                    required
                    defaultValue={editingStation?.name || ''}
                    placeholder="e.g. Kondapur Tech Hub EV Station"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1 block">Address</label>
                  <input
                    name="stn-address"
                    required
                    defaultValue={editingStation?.location || ''}
                    placeholder="e.g. Main Road, Kondapur, Hyderabad"
                    className="input-field text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink-300 mb-1 block">Latitude</label>
                    <input
                      name="stn-lat"
                      type="number"
                      step="any"
                      required
                      defaultValue={editingStation?.lat || 17.4485}
                      className="input-field text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-300 mb-1 block">Longitude</label>
                    <input
                      name="stn-lng"
                      type="number"
                      step="any"
                      required
                      defaultValue={editingStation?.lng || 78.3908}
                      className="input-field text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink-300 mb-1 block">Operating Hours</label>
                    <input
                      name="stn-hours"
                      required
                      defaultValue={editingStation?.operatingHours || '24/7 (All Days)'}
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-300 mb-1 block">Contact Number</label>
                    <input
                      name="stn-phone"
                      required
                      defaultValue={editingStation?.contactNumber || '+91 98490 12345'}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1 block">Description</label>
                  <textarea
                    name="stn-desc"
                    rows={3}
                    defaultValue={editingStation?.description || ''}
                    placeholder="Describe amenities, parking bays, entry directions..."
                    className="input-field text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setStationModalOpen(false)}
                    className="btn-ghost flex-1 text-xs py-2"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1 text-xs py-2">
                    {editingStation ? 'Save Changes' : 'Create Station'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
          BOOKING DETAILS MODAL
          ================================================== */}
      <AnimatePresence>
        {selectedBookingDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong p-6 rounded-2xl max-w-md w-full border border-white/10"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <h3 className="font-bold text-white text-base">Booking #{selectedBookingDetails.id}</h3>
                <button
                  onClick={() => setSelectedBookingDetails(null)}
                  className="p-1 rounded-lg text-ink-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-ink-300 mb-5">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ink-400">Driver</span>
                  <span className="text-white font-semibold">{selectedBookingDetails.userName || 'EV Driver'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ink-400">Station</span>
                  <span className="text-white">{selectedBookingDetails.stationName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ink-400">Charger Bay</span>
                  <span className="text-acid font-semibold">{selectedBookingDetails.chargerNumber || 'Charger 1'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ink-400">Slot Window</span>
                  <span className="text-white">{selectedBookingDetails.date} ({selectedBookingDetails.time})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ink-400">Status</span>
                  <span className="text-white font-bold">{selectedBookingDetails.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ink-400">Payment Amount</span>
                  <span className="text-acid font-bold text-sm">₹{selectedBookingDetails.payment.amount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ink-400">Method</span>
                  <span className="text-white uppercase">{selectedBookingDetails.payment.method}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="btn-secondary w-full text-xs py-2"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
          SUPPORT TICKET REPLY MODAL
          ================================================== */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong p-6 rounded-2xl max-w-lg w-full border border-white/10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div>
                  <span className="text-xs font-mono text-acid font-bold">{selectedTicket.id}</span>
                  <h3 className="font-bold text-white text-sm">{selectedTicket.subject}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 rounded-lg text-ink-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-ink-300">
                  <span className="font-semibold text-white block mb-1">Issue Description:</span>
                  {selectedTicket.description}
                </div>

                {/* Status Changer */}
                <div>
                  <label className="text-xs font-semibold text-ink-300 block mb-1">Update Status:</label>
                  <select
                    defaultValue={selectedTicket.status}
                    onChange={(e) => updateTicketState(selectedTicket.id, { status: e.target.value as TicketStatus })}
                    className="input-field text-xs bg-ink-900"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="WAITING_FOR_USER">WAITING_FOR_USER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="ESCALATED">ESCALATED</option>
                  </select>
                </div>

                {/* Add Reply */}
                <div>
                  <label className="text-xs font-semibold text-ink-300 block mb-1">Add Station Owner Reply:</label>
                  <textarea
                    rows={3}
                    value={ticketReplyText}
                    onChange={(e) => setTicketReplyText(e.target.value)}
                    placeholder="Enter message to driver or operational update..."
                    className="input-field text-xs"
                  />
                  <button
                    onClick={() => {
                      if (!ticketReplyText.trim()) return;
                      addTicketReply(selectedTicket.id, ticketReplyText, false, ownerDisplayName);
                      setTicketReplyText('');
                    }}
                    className="btn-primary text-xs py-1.5 px-3 mt-2"
                  >
                    Send Response
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="btn-ghost w-full text-xs py-2"
              >
                Close Ticket View
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Small Summary Card Component ─────────────────────────────────────────────
function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="glass-strong p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg bg-white/5 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className={`text-xl sm:text-2xl font-bold font-display ${color}`}>{value}</div>
        <div className="text-[10px] text-ink-400 mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}

// ── Small AI Card Component ──────────────────────────────────────────────────
function AIInsightCard({
  title,
  insight,
  severity,
  recommendation,
}: {
  title: string;
  insight: string;
  severity: 'high' | 'medium' | 'warning';
  recommendation: string;
}) {
  return (
    <div className="glass-strong p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-acid" />
            {title}
          </span>
          <span
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
              severity === 'high'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {severity}
          </span>
        </div>
        <p className="text-xs text-ink-200 leading-relaxed">{insight}</p>
      </div>
      <div className="p-2.5 rounded-xl bg-acid/10 border border-acid/20 text-[11px] text-acid">
        <strong className="block mb-0.5 font-bold">Recommended Operational Action:</strong>
        {recommendation}
      </div>
    </div>
  );
}
