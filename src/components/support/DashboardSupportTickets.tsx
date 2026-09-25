import { useState, useMemo } from 'react';
import {
  FileText, AlertTriangle, CheckCircle2, Clock, Shield,
  Search, Filter, ArrowUpRight, User, Eye, Sparkles, RefreshCw
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { SupportTicket, TicketStatus, TicketPriority } from '@/types';
import { TicketDetailsModal } from './TicketDetailsModal';

export function DashboardSupportTickets() {
  const { tickets, user, userRole, setUserRole, updateTicketState } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const high = tickets.filter((t) => t.priority === 'HIGH').length;
    const critical = tickets.filter((t) => t.priority === 'CRITICAL').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
    const resolvedToday = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    return { total, open, high, critical, inProgress, resolvedToday };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.stationName && t.stationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.bookingId && t.bookingId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  const handleQuickAssign = (ticketId: string) => {
    updateTicketState(ticketId, {
      assignedTo: user?.name || 'Station Operations Lead',
      status: 'ASSIGNED',
    });
  };

  const handleQuickEscalate = (ticketId: string) => {
    updateTicketState(ticketId, {
      priority: 'CRITICAL',
      status: 'ESCALATED',
      isEscalated: true,
    });
  };

  const handleQuickResolve = (ticketId: string) => {
    updateTicketState(ticketId, { status: 'RESOLVED' });
  };

  return (
    <div className="space-y-6">
      {/* Role Toggle for Testing & Demonstration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-ink-900/60 border border-white/5">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-acid" />
          <span className="text-xs text-ink-300">Viewing support portal as:</span>
          <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-acid/15 border border-acid/30">
            {userRole}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-ink-400 text-[11px] mr-1">Switch Role:</span>
          {(['STATION_OPERATOR', 'SUPPORT_AGENT', 'ADMIN', 'USER'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setUserRole(r)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                userRole === r
                  ? 'bg-acid text-ink-950 shadow-sm'
                  : 'bg-ink-800 text-ink-400 hover:text-white'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Strip (Section 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass p-4 rounded-2xl border border-white/10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-ink-400">Total Tickets</span>
            <FileText className="w-4 h-4 text-ink-400" />
          </div>
          <p className="font-display font-bold text-2xl text-white">{metrics.total}</p>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-ink-400">Open Tickets</span>
            <Clock className="w-4 h-4 text-acid" />
          </div>
          <p className="font-display font-bold text-2xl text-acid">{metrics.open}</p>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-ink-400">High Priority</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-display font-bold text-2xl text-amber-400">{metrics.high}</p>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-ink-400">Critical</span>
            <AlertTriangle className="w-4 h-4 text-danger-400" />
          </div>
          <p className="font-display font-bold text-2xl text-danger-400">{metrics.critical}</p>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-ink-400">In Progress</span>
            <Clock className="w-4 h-4 text-ink-200" />
          </div>
          <p className="font-display font-bold text-2xl text-white">{metrics.inProgress}</p>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-ink-400">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-acid" />
          </div>
          <p className="font-display font-bold text-2xl text-white">{metrics.resolvedToday}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Ticket ID, Station, Subject, Booking ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-900 border border-white/10 text-white text-xs focus:border-acid focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-ink-900 border border-white/10 text-white text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-ink-900 border border-white/10 text-white text-xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Ticket Table (Section 11) */}
      <div className="glass rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink-300">
            <thead className="bg-ink-900/80 border-b border-white/10 text-ink-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Station / Hardware</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5">Assigned To</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-acid">{t.id}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-white block">{t.subcategory}</span>
                      <span className="text-[10px] text-ink-400">{t.department}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white font-medium truncate max-w-[160px]">{t.stationName || 'Network-wide'}</p>
                      {t.chargerNumber && <p className="text-[10px] text-ink-400">{t.chargerNumber}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          t.priority === 'CRITICAL'
                            ? 'bg-danger-500/20 text-danger-400'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-acid/20 text-acid'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          t.status === 'RESOLVED' || t.status === 'CLOSED'
                            ? 'bg-acid/15 text-acid'
                            : t.status === 'ESCALATED'
                            ? 'bg-danger-500/20 text-danger-400 font-bold'
                            : 'bg-white/5 text-ink-200'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-400">
                      {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 font-medium text-white">
                      {t.assignedTo ? (
                        <span className="text-ink-200">{t.assignedTo}</span>
                      ) : (
                        <button
                          onClick={() => handleQuickAssign(t.id)}
                          className="text-[11px] text-acid hover:underline"
                        >
                          + Assign to Me
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleQuickResolve(t.id)}
                            title="Mark Resolved"
                            className="p-1.5 rounded-lg bg-acid/10 hover:bg-acid/20 text-acid"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!t.isEscalated && t.priority !== 'CRITICAL' && (
                          <button
                            onClick={() => handleQuickEscalate(t.id)}
                            title="Escalate"
                            className="p-1.5 rounded-lg bg-danger-500/10 hover:bg-danger-500/20 text-danger-400"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="btn-ghost py-1 px-2.5 text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-ink-400">
                    No support tickets match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
