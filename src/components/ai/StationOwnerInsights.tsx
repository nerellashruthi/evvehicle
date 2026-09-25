import { useState } from 'react';
import {
  TrendingUp, Clock, Zap, BatteryCharging, Sparkles, HelpCircle,
  Shield, Settings, AlertTriangle, CheckCircle2, User, Sliders,
  RefreshCw, Play, XCircle, FileText, Check, ChevronRight
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getStationOwnerInsights } from '@/services/aiAgentService';
import { calculateBookingTimeState } from '@/services/gracePeriodService';
import type { BookingWithPayment, NoShowPolicy } from '@/types';

export function StationOwnerInsightsView() {
  const {
    liveStations,
    bookings,
    graceConfig,
    updateGraceConfig,
    noShowAuditRecords,
    userRole,
    setUserRole,
    startChargingSession,
    cancelPaidBooking,
    simulateSlotStartNow,
    simulateGraceExpiryNow,
  } = useApp();

  const [selectedBooking, setSelectedBooking] = useState<BookingWithPayment | null>(null);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Edit config state
  const [editGraceMinutes, setEditGraceMinutes] = useState<number>(graceConfig.gracePeriodMinutes);
  const [editPolicy, setEditPolicy] = useState<NoShowPolicy>(graceConfig.noShowPolicy);

  const isAuthorized = userRole === 'ADMIN' || userRole === 'STATION_OPERATOR';

  const insights = getStationOwnerInsights(liveStations);

  // Calculate the 6 required statistics
  const totalChargers = liveStations.reduce(
    (acc, s) => acc + s.chargers.reduce((cAcc, c) => cAcc + c.totalPorts, 0),
    0
  );
  const totalAvailable = liveStations.reduce(
    (acc, s) => acc + s.chargers.reduce((cAcc, c) => cAcc + c.availablePorts, 0),
    0
  );

  const categorized = bookings.map((b) => ({
    booking: b,
    state: calculateBookingTimeState(b, graceConfig.gracePeriodMinutes),
  }));

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookingsCount = bookings.filter((b) => b.date === todayStr || b.createdAt.startsWith(todayStr)).length;
  const activeBookingsCount = categorized.filter((c) =>
    ['RESERVED', 'GRACE_PERIOD', 'CHARGING'].includes(c.state.normalizedStatus)
  ).length;
  const gracePeriodCount = categorized.filter((c) => c.state.normalizedStatus === 'GRACE_PERIOD').length;
  const chargingNowCount = categorized.filter((c) => c.state.normalizedStatus === 'CHARGING').length;
  const noShowsCount = categorized.filter((c) => c.state.normalizedStatus === 'NO_SHOW').length;

  const handleSaveConfig = () => {
    if (!isAuthorized) return;
    updateGraceConfig({
      gracePeriodMinutes: editGraceMinutes,
      noShowPolicy: editPolicy,
    });
    setConfigSuccess(true);
    setTimeout(() => setConfigSuccess(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Role Switcher Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-ink-900/80 border border-white/10">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-acid" />
          <div>
            <p className="text-xs font-semibold text-white">Station Operator &amp; Grid Command View</p>
            <p className="text-[11px] text-ink-400">Manage real-time grace periods, no-show rules, and automated port release.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span className="text-[11px] text-ink-400 font-medium">Role:</span>
          <div className="inline-flex p-1 rounded-xl bg-ink-950 border border-white/10">
            {(['STATION_OPERATOR', 'ADMIN', 'USER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setUserRole(r)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  userRole === r ? 'bg-acid text-ink-950 shadow-sm' : 'text-ink-400 hover:text-white'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. THE 6 REQUIRED STATISTICS (Section 11)
      ───────────────────────────────────────────────────────────── */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-acid" />
          <span>Grace Period &amp; Station Capacity Telemetry</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Today's Bookings */}
          <div className="glass p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] text-ink-400 font-medium block mb-1">Today's Bookings</span>
            <p className="font-display font-bold text-2xl text-white">{todaysBookingsCount}</p>
            <span className="text-[10px] text-acid mt-0.5 block">Total scheduled</span>
          </div>

          {/* 2. Active Bookings */}
          <div className="glass p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] text-ink-400 font-medium block mb-1">Active Bookings</span>
            <p className="font-display font-bold text-2xl text-white">{activeBookingsCount}</p>
            <span className="text-[10px] text-sky-400 mt-0.5 block">Current in-flight</span>
          </div>

          {/* 3. Grace Period */}
          <div className="glass p-4 rounded-2xl border border-amber-400/30 bg-amber-500/[0.04]">
            <span className="text-[11px] text-amber-300 font-medium block mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Grace Period
            </span>
            <p className="font-display font-bold text-2xl text-amber-400">{gracePeriodCount}</p>
            <span className="text-[10px] text-amber-300/80 mt-0.5 block">Awaiting plug-in</span>
          </div>

          {/* 4. Charging Now */}
          <div className="glass p-4 rounded-2xl border border-sky-400/30 bg-sky-500/[0.04]">
            <span className="text-[11px] text-sky-300 font-medium block mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              Charging Now
            </span>
            <p className="font-display font-bold text-2xl text-sky-300">{chargingNowCount}</p>
            <span className="text-[10px] text-sky-300/80 mt-0.5 block">Delivering power</span>
          </div>

          {/* 5. No-Shows */}
          <div className="glass p-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.04]">
            <span className="text-[11px] text-rose-300 font-medium block mb-1">No-Shows</span>
            <p className="font-display font-bold text-2xl text-rose-400">{noShowsCount}</p>
            <span className="text-[10px] text-rose-300/80 mt-0.5 block">Released slots</span>
          </div>

          {/* 6. Available Chargers */}
          <div className="glass p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] text-ink-400 font-medium block mb-1">Available Chargers</span>
            <p className="font-display font-bold text-2xl text-acid">
              {totalAvailable}
              <span className="text-sm font-normal text-ink-500">/{totalChargers}</span>
            </p>
            <span className="text-[10px] text-ink-400 mt-0.5 block">Ready for EVs</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ADMIN CONFIGURATION PANEL (Grace Period & No-Show Policy)
      ───────────────────────────────────────────────────────────── */}
      <div className="glass-strong p-6 rounded-3xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-acid/15 border border-acid/30 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-acid" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Grace Period &amp; No-Show Policy Settings</h3>
              <p className="text-xs text-ink-400">Configure operational thresholds for all charging stations in network.</p>
            </div>
          </div>

          {!isAuthorized && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Read-only: Switch to Admin or Station Operator role</span>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-5">
          {/* Default Grace Period setting */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink-200 block">Default Grace Period</label>
            <select
              value={editGraceMinutes}
              disabled={!isAuthorized}
              onChange={(e) => setEditGraceMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink-900 border border-white/15 text-white text-xs font-medium focus:border-acid focus:outline-none disabled:opacity-50"
            >
              <option value={5}>5 Minutes (High Turnover / Urban Hubs)</option>
              <option value={10}>10 Minutes (ChargeNix Default Recommendation)</option>
              <option value={15}>15 Minutes (Highway &amp; Corridor Stations)</option>
              <option value={20}>20 Minutes (Heavy Traffic Zones)</option>
              <option value={30}>30 Minutes (Destination Resorts)</option>
            </select>
            <p className="text-[11px] text-ink-400">
              Arrival timer granted to drivers before reserved slot is automatically released.
            </p>
          </div>

          {/* No-Show Policy setting */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink-200 block">No-Show Policy</label>
            <select
              value={editPolicy}
              disabled={!isAuthorized}
              onChange={(e) => setEditPolicy(e.target.value as NoShowPolicy)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink-900 border border-white/15 text-white text-xs font-medium focus:border-acid focus:outline-none disabled:opacity-50"
            >
              <option value="NONE">NONE (Default MVP - Release slot, 0 penalty)</option>
              <option value="WARNING">WARNING (In-app late arrival notification)</option>
              <option value="PENALTY">PENALTY (Simulated ₹50 idle reservation lock)</option>
            </select>
            <p className="text-[11px] text-ink-400">
              Action executed against driver record upon timer expiration. Currently: <strong>{graceConfig.noShowPolicy}</strong>.
            </p>
          </div>

          {/* Save & Audit actions */}
          <div className="space-y-2 flex flex-col justify-end">
            <div className="flex gap-2.5">
              <button
                onClick={handleSaveConfig}
                disabled={!isAuthorized}
                className="flex-1 py-2.5 px-4 rounded-xl bg-acid text-ink-950 font-display font-bold text-xs flex items-center justify-center gap-2 hover:bg-acid-400 transition-all shadow-md shadow-acid/20 disabled:opacity-50 cursor-pointer"
              >
                {configSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-ink-950" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    <span>Apply Policy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowAuditModal(true)}
                className="py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-ink-200 hover:text-white hover:border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="View No-Show Audit Log"
              >
                <FileText className="w-3.5 h-3.5 text-acid" />
                <span>Audits ({noShowAuditRecords.length})</span>
              </button>
            </div>
            <p className="text-[10px] text-ink-500">
              Updated: {graceConfig.lastUpdated ? new Date(graceConfig.lastUpdated).toLocaleTimeString('en-IN') : 'Just now'}
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. REAL-TIME BOOKINGS TABLE (Required Columns)
      ───────────────────────────────────────────────────────────── */}
      <div className="glass-strong p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="font-display font-bold text-lg text-white">Live Booking &amp; Slot Roster</h3>
            <p className="text-xs text-ink-400">Inspect real-time slot states, technician actions, and live countdowns.</p>
          </div>
          <span className="text-xs font-mono text-ink-400">{bookings.length} Registered Bookings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-ink-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Station</th>
                <th className="py-3 px-3">Charger</th>
                <th className="py-3 px-3">Start Time</th>
                <th className="py-3 px-3">End Time</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Grace Period</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((b) => {
                const state = calculateBookingTimeState(b, graceConfig.gracePeriodMinutes);
                const isGrace = state.normalizedStatus === 'GRACE_PERIOD';
                const isCharging = state.normalizedStatus === 'CHARGING';
                const isReserved = state.normalizedStatus === 'RESERVED';
                const isNoShow = state.normalizedStatus === 'NO_SHOW';

                return (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Booking ID */}
                    <td className="py-3 px-3 font-mono font-medium text-white">{b.id}</td>

                    {/* User */}
                    <td className="py-3 px-3 text-ink-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-ink-400" />
                        <span>EV Driver</span>
                      </div>
                    </td>

                    {/* Station */}
                    <td className="py-3 px-3 font-medium text-white max-w-[150px] truncate" title={b.stationName}>
                      {b.stationName}
                    </td>

                    {/* Charger */}
                    <td className="py-3 px-3 text-ink-300">
                      {b.chargerNumber || 'Charger 2'} ({b.chargerType})
                    </td>

                    {/* Start Time */}
                    <td className="py-3 px-3 text-ink-300 font-mono">
                      {b.startTime || b.time.split('–')[0]?.trim() || b.time}
                    </td>

                    {/* End Time */}
                    <td className="py-3 px-3 text-ink-400 font-mono">
                      {b.endTime || (b.time.includes('–') ? b.time.split('–')[1]?.trim() : '+45m')}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isGrace
                          ? 'bg-amber-500/10 text-amber-400 border-amber-400/30'
                          : isCharging
                          ? 'bg-sky-500/10 text-sky-400 border-sky-400/30'
                          : isReserved
                          ? 'bg-acid/10 text-acid border-acid/20'
                          : isNoShow
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isGrace ? 'bg-amber-400 animate-pulse' : isCharging ? 'bg-sky-400 animate-ping' : 'bg-current'
                        }`} />
                        {state.normalizedStatus}
                      </span>
                    </td>

                    {/* Grace Period */}
                    <td className="py-3 px-3 font-mono">
                      {isGrace ? (
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>{state.countdownFormatted}</span>
                        </div>
                      ) : (
                        <span className="text-ink-400">{b.gracePeriodMinutes || graceConfig.gracePeriodMinutes} mins</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {isGrace && (
                          <button
                            onClick={() => startChargingSession(b.id)}
                            className="px-2 py-1 rounded bg-amber-400 hover:bg-amber-300 text-ink-950 font-bold text-[10px] transition-all cursor-pointer"
                            title="Start charging on behalf of arrived vehicle"
                          >
                            Start Charge
                          </button>
                        )}
                        {isReserved && isAuthorized && (
                          <button
                            onClick={() => simulateSlotStartNow(b.id)}
                            className="px-2 py-1 rounded bg-acid/15 hover:bg-acid/25 text-acid font-semibold text-[10px] transition-all cursor-pointer"
                            title="Simulate slot start to begin grace period"
                          >
                            Trigger Start
                          </button>
                        )}
                        {isGrace && isAuthorized && (
                          <button
                            onClick={() => simulateGraceExpiryNow(b.id)}
                            className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-semibold text-[10px] transition-all cursor-pointer"
                            title="Simulate immediate grace period expiration (No-Show)"
                          >
                            Expire Slot
                          </button>
                        )}
                        {isReserved && (
                          <button
                            onClick={() => cancelPaidBooking(b.id)}
                            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-ink-300 text-[10px] transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
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

      {/* ─────────────────────────────────────────────────────────────
          4. AI INTELLIGENCE & INFRASTRUCTURE FORECAST
      ───────────────────────────────────────────────────────────── */}
      <div className="glass-strong p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-acid/15 border border-acid/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-acid" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white">Station Operator AI Insights</h3>
              <p className="text-xs text-ink-400">Autonomous pattern recognition &amp; infrastructure capacity estimates</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-ink-300">
            <HelpCircle className="w-3.5 h-3.5 text-acid" />
            <span>Labeled predictions are algorithmic estimates</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-5 rounded-2xl bg-ink-900/70 border border-white/10 hover:border-acid/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${insight.badgeColor}`}>
                    {insight.badge}
                  </span>
                  <span className="text-[10px] font-mono text-ink-500">Telemetry Engine</span>
                </div>
                <h4 className="font-display font-semibold text-white text-base mb-2">{insight.metric}</h4>
                <p className="text-xs text-ink-200 leading-relaxed">{insight.finding}</p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <Zap className="w-3.5 h-3.5 text-acid shrink-0 mt-0.5" />
                  <span className="text-ink-300 leading-tight">
                    <strong className="text-white">Recommendation:</strong> {insight.recommendation}
                  </span>
                </div>
                <p className="text-[10px] text-ink-500 italic mt-1">{insight.confidence}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          NO-SHOW AUDIT LOG MODAL
      ───────────────────────────────────────────────────────────── */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm">
          <div className="glass-strong p-6 rounded-3xl border border-white/10 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-acid" />
                <h3 className="font-display font-bold text-lg text-white">No-Show Audit Trail</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-ink-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            {noShowAuditRecords.length === 0 ? (
              <div className="p-8 text-center text-ink-400 text-xs">
                No no-show audit events recorded yet. When a grace period expires without charging, an immutable audit event is recorded here.
              </div>
            ) : (
              <div className="space-y-3">
                {noShowAuditRecords.map((audit) => (
                  <div key={audit.id} className="p-4 rounded-xl bg-ink-900 border border-white/10 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-acid font-semibold">{audit.bookingId}</span>
                      <span className="text-ink-500 text-[11px]">{new Date(audit.expiredAt).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-white font-medium">{audit.stationName} · {audit.chargerNumber}</p>
                    <div className="flex items-center justify-between text-ink-400 text-[11px] pt-1 border-t border-white/5">
                      <span>Grace Duration: {audit.gracePeriodMinutes} mins</span>
                      <span>Policy: <strong className="text-amber-400">{audit.policyApplied}</strong></span>
                      <span>Penalty: ₹{audit.penaltyInr}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
