import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, HelpCircle, Phone, MessageSquare,
  Search, Filter, CheckCircle2, Clock, AlertTriangle,
  Zap, CreditCard, Shield, ChevronDown, ChevronUp,
  ArrowRight, Eye, Star, Headphones
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui';
import type { SupportTicket, TicketStatus } from '@/types';
import { RaiseTicketModal } from '@/components/support/RaiseTicketModal';
import { TicketDetailsModal } from '@/components/support/TicketDetailsModal';

type SupportTab = 'my_tickets' | 'raise' | 'faq' | 'contact';

export function SupportPage() {
  const { tickets, user } = useApp();

  const [activeTab, setActiveTab] = useState<SupportTab>('my_tickets');
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');

  // Filter user's tickets (in demo environment, shows all tickets or user's tickets)
  const userTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.stationName && t.stationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.bookingId && t.bookingId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  // Frequently Asked Questions
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What should I do if a charger does not start after plugging in?',
      a: 'First, check if the emergency stop button on the unit has been triggered and release it if safe. Ensure the connector latch firmly clicks into your EV charging port. Wait 30-45 seconds for the station to complete the digital handshake. If it still does not initiate, tap "+ Report an Issue" to have Station Operations remotely reboot the port or reassign you to an adjacent charger.',
    },
    {
      q: 'Money was debited from my account via UPI/Card, but charging failed. How do I get a refund?',
      a: 'ChargeNix employs automated bank settlement reconciliation. If power transfer was not initiated, failed capture reservations are automatically marked for reversal within 2 to 4 hours. You can file a ticket under "Payment Issue" with your Transaction ID to track instantaneous resolution.',
    },
    {
      q: 'What happens if another vehicle is occupying my reserved slot?',
      a: 'ChargeNix enforces a 15-minute grace period. If an unauthorized vehicle is occupying your slot, select "Slot already occupied" under Station Issues. Our AI will automatically verify adjacent available chargers and switch your booking slot without any additional fee.',
    },
    {
      q: 'What is the standard SLA response time for raised tickets?',
      a: 'Our target response SLAs depend on issue severity: Critical Safety issues are dispatched within 1 hour; High-priority charging & payment failures within 4 hours; Medium booking queries within 12 hours; and general inquiries within 24 hours.',
    },
    {
      q: 'How does the ChargeNix AI classify my problem?',
      a: 'The ChargeNix AI analyzes your description, matches your live vehicle booking context and station telemetry, assigns priority, routes the ticket directly to the specialized team (e.g. Station Operations or Payment Support), and generates immediate safe troubleshooting steps.',
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header with Prominent Report Button */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6">
          <PageHeader
            label="Help & Support"
            title="ChargeNix Support Center"
            subtitle="Autonomous issue classification, ticket tracking & 24/7 charging infrastructure resolution."
          />

          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="btn-primary self-start sm:self-auto shrink-0 flex items-center gap-2 px-5 py-3 shadow-lg shadow-acid/20 mb-6 sm:mb-8"
          >
            <Plus className="w-4 h-4" />
            <span>Report an Issue</span>
          </button>
        </div>

        {/* Support Tabs */}
        <div className="flex gap-2 p-1.5 glass rounded-2xl max-w-lg mb-8">
          <button
            onClick={() => setActiveTab('my_tickets')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'my_tickets'
                ? 'bg-acid text-ink-950 shadow-md shadow-acid/20'
                : 'text-ink-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Tickets ({tickets.length})</span>
          </button>

          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-ink-400 hover:text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise a Ticket</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-acid text-ink-950 shadow-md shadow-acid/20'
                : 'text-ink-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQs</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-acid text-ink-950 shadow-md shadow-acid/20'
                : 'text-ink-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Contact</span>
          </button>
        </div>

        {/* TAB 1: MY TICKETS */}
        {activeTab === 'my_tickets' && (
          <div className="space-y-6">
            {/* Search and Filter Chips */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Ticket ID (CNX-TKT-...), Station, or Issue..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-900 border border-white/10 text-white text-xs focus:border-acid focus:outline-none"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      statusFilter === st
                        ? 'bg-acid text-ink-950 shadow-sm'
                        : 'bg-ink-900/80 border border-white/5 text-ink-400 hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets Grid */}
            {userTickets.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="glass p-5 rounded-3xl border border-white/10 hover:border-acid/30 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                  >
                    <div>
                      {/* Top Bar: Ticket ID & Priority */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-acid bg-acid/15 px-2 py-0.5 rounded-full border border-acid/30">
                          {t.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            t.priority === 'CRITICAL'
                              ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-acid/20 text-acid border border-acid/30'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <h4 className="font-display font-semibold text-white text-base group-hover:text-acid transition-colors mb-1 line-clamp-1">
                        {t.subcategory}
                      </h4>
                      <p className="text-xs text-ink-400 mb-2 truncate">
                        {t.stationName || 'ChargeNix Network Issue'}
                      </p>

                      <p className="text-xs text-ink-300 line-clamp-2 leading-relaxed bg-ink-950/40 p-2.5 rounded-xl border border-white/5">
                        {t.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-400">Status</span>
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                            t.status === 'RESOLVED' || t.status === 'CLOSED'
                              ? 'bg-acid/20 text-acid'
                              : t.status === 'ESCALATED'
                              ? 'bg-danger-500/20 text-danger-400'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-ink-400">
                        <span>Updated {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-acid group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                          View Ticket <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 glass rounded-3xl border border-white/5 space-y-3">
                <FileText className="w-10 h-10 text-ink-500 mx-auto" />
                <h4 className="font-display font-semibold text-white text-lg">No Tickets Found</h4>
                <p className="text-xs text-ink-400 max-w-sm mx-auto">
                  You do not have any tickets matching the current filter. If you encountered an issue, report it below.
                </p>
                <button
                  onClick={() => setIsRaiseModalOpen(true)}
                  className="btn-primary text-xs mt-2 px-6"
                >
                  + Report an Issue
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FREQUENTLY ASKED QUESTIONS */}
        {activeTab === 'faq' && (
          <div className="max-w-3xl space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass p-5 rounded-2xl border border-white/5 cursor-pointer transition-all hover:border-white/15"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                >
                  <div className="flex justify-between items-center gap-3">
                    <h4 className="font-display font-semibold text-white text-sm leading-snug">
                      {faq.q}
                    </h4>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-acid shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ink-400 shrink-0" />
                    )}
                  </div>

                  {isOpen && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-ink-300 leading-relaxed mt-3 pt-3 border-t border-white/5"
                    >
                      {faq.a}
                    </motion.p>
                  )}
                </div>
              );
            })}

            <div className="p-6 rounded-3xl bg-acid/10 border border-acid/20 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <div>
                <h4 className="font-display font-bold text-white text-base">Still need assistance?</h4>
                <p className="text-xs text-ink-300">Our automated AI assistant and field engineers are on standby.</p>
              </div>
              <button onClick={() => setIsRaiseModalOpen(true)} className="btn-primary text-xs px-6 py-2.5 shrink-0">
                + Report an Issue Now
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CONTACT SUPPORT */}
        {activeTab === 'contact' && (
          <div className="grid md:grid-cols-3 gap-5">
            <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-acid/15 border border-acid/30 text-acid flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-white text-lg">24/7 Grid Emergency Line</h4>
              <p className="text-xs text-ink-300 leading-relaxed">
                For urgent on-road breakdowns, damaged hardware, or electrical safety concerns.
              </p>
              <div className="pt-2">
                <a
                  href="tel:18002694357"
                  className="font-mono text-sm font-bold text-acid hover:underline block"
                >
                  1800-CNX-HELP (Toll Free)
                </a>
                <p className="text-[11px] text-ink-400 mt-1">Available 24 hours, 7 days a week</p>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-acid/15 border border-acid/30 text-acid flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-white text-lg">WhatsApp Concierge</h4>
              <p className="text-xs text-ink-300 leading-relaxed">
                Real-time text support with our automated ticketing bot and live operations specialists.
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/919999999999"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs w-full text-center py-2"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-acid/15 border border-acid/30 text-acid flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-white text-lg">Station Operations Dispatch</h4>
              <p className="text-xs text-ink-300 leading-relaxed">
                Direct dispatch channel for commercial station hosts, grid partners, and technician fleets.
              </p>
              <div className="pt-2">
                <p className="font-mono text-xs text-white">ops@chargenix.io</p>
                <p className="text-[11px] text-ink-400 mt-1">Average response time: &lt; 15 mins</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      <RaiseTicketModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        onTicketCreated={(ticket) => {
          setSelectedTicket(ticket);
        }}
      />

      {/* Ticket Details Inspector Modal */}
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
