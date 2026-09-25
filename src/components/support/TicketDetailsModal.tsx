import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Send, CheckCircle2, AlertTriangle, Clock, Shield,
  Zap, CalendarCheck, CreditCard, Sparkles, Star, User,
  CornerDownRight, RefreshCw, MessageSquare, ArrowUpRight
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { SupportTicket, TicketStatus, TicketPriority } from '@/types';
import { TicketStatusTimeline } from './TicketStatusTimeline';

interface TicketDetailsModalProps {
  ticket: SupportTicket;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketDetailsModal({ ticket, isOpen, onClose }: TicketDetailsModalProps) {
  const { user, userRole, updateTicketState, addTicketReply } = useApp();

  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(ticket.resolutionRating || 5);
  const [ratingFeedback, setRatingFeedback] = useState<string>(ticket.resolutionFeedback || '');
  const [showRatingSubmitted, setShowRatingSubmitted] = useState(false);

  const isStaff = userRole === 'STATION_OPERATOR' || userRole === 'SUPPORT_AGENT' || userRole === 'ADMIN';

  if (!isOpen) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    addTicketReply(
      ticket.id,
      replyText,
      isInternalNote,
      isInternalNote ? `${user?.name || 'Staff'} (Internal)` : user?.name || 'User'
    );
    setReplyText('');
    setIsInternalNote(false);
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    updateTicketState(ticket.id, { status: newStatus });
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    updateTicketState(ticket.id, { priority: newPriority });
  };

  const handleAssignToSelf = () => {
    updateTicketState(ticket.id, {
      assignedTo: user?.name || 'Station Operations Lead',
      status: ticket.status === 'OPEN' ? 'ASSIGNED' : ticket.status,
    });
  };

  const handleMarkResolved = () => {
    updateTicketState(ticket.id, { status: 'RESOLVED' });
  };

  const handleReopen = () => {
    updateTicketState(ticket.id, { status: 'OPEN', isEscalated: true });
    addTicketReply(ticket.id, 'User reopened this ticket: Issue persists or needs further review.', false);
  };

  const handleConfirmClose = () => {
    updateTicketState(ticket.id, {
      status: 'CLOSED',
      resolutionRating: selectedRating,
      resolutionFeedback: ratingFeedback,
    });
    setShowRatingSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="w-full max-w-3xl glass-strong border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-acid bg-acid/15 px-2.5 py-0.5 rounded-full border border-acid/30">
                {ticket.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  ticket.priority === 'CRITICAL'
                    ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30'
                    : ticket.priority === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-acid/20 text-acid border border-acid/30'
                }`}
              >
                {ticket.priority} Priority
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-ink-300">
                {ticket.department}
              </span>
            </div>
            <h3 className="font-display font-bold text-xl text-white leading-snug">{ticket.subject}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Visual Status Timeline */}
          <div className="p-4 rounded-2xl bg-ink-900/60 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-ink-300">Ticket Progress</span>
              <span className="text-xs font-mono text-ink-400">
                Target SLA: {ticket.slaHours}h · Target: {new Date(ticket.slaTargetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <TicketStatusTimeline
              status={ticket.status}
              isEscalated={ticket.isEscalated}
              isSlaAtRisk={ticket.isSlaAtRisk}
            />
          </div>

          {/* Safety Alert (Section 17) */}
          {ticket.isSafetyConcern && (
            <div className="p-4 rounded-2xl bg-danger-500/15 border border-danger-500/30 flex items-start gap-3 text-danger-300">
              <AlertTriangle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-danger-400">
                  Critical Electrical / Hardware Safety Hazard Flagged
                </h4>
                <p className="text-xs leading-relaxed mt-1 text-danger-200">
                  Avoid physical contact with this charger and maintain a safe clearance. Station operations has been signaled to isolate power remotely.
                </p>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-ink-900/40 border border-white/5 text-xs">
            <div>
              <p className="text-[11px] text-ink-400">Station</p>
              <p className="font-semibold text-white mt-0.5 truncate">{ticket.stationName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-400">Charger / Port</p>
              <p className="font-semibold text-white mt-0.5">{ticket.chargerNumber || ticket.chargerType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-400">Assigned To</p>
              <p className="font-semibold text-acid mt-0.5">{ticket.assignedTo || 'Unassigned (In Pool)'}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-400">Created At</p>
              <p className="font-semibold text-white mt-0.5">{new Date(ticket.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Staff Control Bar (Section 11) */}
          {isStaff && (
            <div className="p-4 rounded-2xl bg-acid/5 border border-acid/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-acid flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Staff Operator Controls ({userRole})
                </span>
                {!ticket.assignedTo && (
                  <button onClick={handleAssignToSelf} className="text-xs text-acid hover:underline">
                    Assign to Me
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-ink-400 block mb-1">Update Status</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-ink-900 border border-white/10 text-white text-xs"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="WAITING_FOR_USER">WAITING FOR USER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="ESCALATED">ESCALATED</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-ink-400 block mb-1">Change Priority</label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-ink-900 border border-white/10 text-white text-xs"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleMarkResolved}
                    className="btn-primary w-full py-1.5 text-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resolution Prompt for User (Section 15) */}
          {ticket.status === 'RESOLVED' && (
            <div className="p-4 rounded-2xl bg-acid/10 border border-acid/30 text-center space-y-3">
              <CheckCircle2 className="w-6 h-6 text-acid mx-auto" />
              <h4 className="font-bold text-white text-sm">Your issue has been marked as resolved</h4>
              <p className="text-xs text-ink-300">
                Please verify if your issue is completely addressed. You can close the ticket or reopen it if further assistance is required.
              </p>

              {/* Star Rating Section */}
              <div className="pt-2">
                <p className="text-xs text-ink-400 mb-1.5">Rate Support Experience:</p>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="p-1 text-amber-400 transition-transform hover:scale-125"
                    >
                      <Star className={`w-5 h-5 ${star <= selectedRating ? 'fill-amber-400' : 'text-ink-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleConfirmClose}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept &amp; Close Ticket
                </button>
                <button
                  onClick={handleReopen}
                  className="btn-ghost text-xs px-4 py-2 text-danger-400 hover:text-danger-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reopen Ticket
                </button>
              </div>
            </div>
          )}

          {/* Conversation Thread (Section 10) */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-acid" /> Ticket Updates &amp; Conversation
            </h4>

            <div className="space-y-3">
              {ticket.messages.map((m) => {
                const isUser = m.sender === 'user';
                const isSys = m.sender === 'ai_system';
                const isInternal = m.isInternalNote;

                if (isInternal && !isStaff) return null; // hide internal notes from regular user

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                      isInternal
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                        : isSys
                        ? 'bg-acid/10 border border-acid/20 text-ink-200'
                        : isUser
                        ? 'bg-ink-800/80 border border-white/10 ml-6 text-white'
                        : 'bg-ink-900 border border-white/10 mr-6 text-ink-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold flex items-center gap-1">
                        {isSys && <Sparkles className="w-3 h-3 text-acid" />}
                        {isInternal && <Shield className="w-3 h-3 text-amber-400" />}
                        {m.senderName}
                        {isInternal && ' [Internal Note]'}
                      </span>
                      <span className="text-ink-400 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reply Input Bar (Section 10) */}
        {ticket.status !== 'CLOSED' && (
          <form onSubmit={handleSendReply} className="pt-3 border-t border-white/10 shrink-0 space-y-2">
            {isStaff && (
              <label className="flex items-center gap-2 text-xs text-ink-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded border-white/20 bg-ink-900 text-acid focus:ring-0"
                />
                <span>Post as Internal Staff Note (hidden from driver)</span>
              </label>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isInternalNote ? 'Write internal note...' : 'Type message or provide update...'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-ink-900 border border-white/10 text-white text-xs focus:border-acid focus:outline-none"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="btn-primary text-xs px-4 flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
