import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Upload, X, Sparkles,
  Zap, CalendarCheck, CreditCard, Shield, MapPin,
  Clock, ArrowRight, CornerDownLeft, Eye, FileText
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type {
  TicketIssueCategory,
  ChargerType,
  SupportTicket,
} from '@/types';
import {
  COMMON_STATION_ISSUES,
  COMMON_APP_ISSUES,
  classifyTicketWithAI,
  buildSupportTicket,
} from '@/services/ticketClassifierService';

interface RaiseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillBookingId?: string;
  prefillStationId?: string;
  onTicketCreated?: (ticket: SupportTicket) => void;
}

export function RaiseTicketModal({
  isOpen,
  onClose,
  prefillBookingId,
  prefillStationId,
  onTicketCreated,
}: RaiseTicketModalProps) {
  const { user, liveStations, bookings, addTicket } = useApp();

  const [category, setCategory] = useState<TicketIssueCategory>('charging_station');
  const [subcategory, setSubcategory] = useState<string>('');
  const [stationId, setStationId] = useState<string>(prefillStationId || liveStations[0]?.id || '');
  const [chargerNumber, setChargerNumber] = useState<string>('Charger 1');
  const [chargerType, setChargerType] = useState<ChargerType>('Fast');
  const [bookingId, setBookingId] = useState<string>(prefillBookingId || '');
  const [transactionId, setTransactionId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<{ name: string; url: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  const selectedStation = useMemo(
    () => liveStations.find((s) => s.id === stationId),
    [liveStations, stationId]
  );

  // Real-time AI classification preview
  const liveClassification = useMemo(() => {
    if (!description.trim()) return null;
    return classifyTicketWithAI({
      description,
      category,
      subcategory,
      stationName: selectedStation?.name,
      stationId,
      chargerNumber,
      chargerType,
      bookingId,
      transactionId,
    });
  }, [description, category, subcategory, selectedStation, stationId, chargerNumber, chargerType, bookingId, transactionId]);

  const handleSubcategorySelect = (issue: string) => {
    setSubcategory(issue);
    if (!description) {
      setDescription(`Issue: ${issue}. `);
    } else if (!description.includes(issue)) {
      setDescription((prev) => `${prev} (${issue})`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (< 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const fakeUrl = URL.createObjectURL(file);
      setUploadedImage({ name: file.name, url: fakeUrl });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please describe your issue before submitting.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const ticket = buildSupportTicket(
        {
          description,
          category,
          subcategory: subcategory || (category === 'charging_station' ? 'Charger malfunction' : 'App inquiry'),
          stationId: selectedStation?.id,
          stationName: selectedStation?.name,
          chargerNumber,
          chargerType,
          bookingId: bookingId || undefined,
          transactionId: transactionId || undefined,
        },
        {
          id: user?.id || 'usr-default',
          name: user?.name || 'EV Driver',
          email: user?.email || 'driver@chargenix.io',
        },
        uploadedImage ? { name: uploadedImage.name, url: uploadedImage.url } : undefined
      );

      addTicket(ticket);
      setSubmittedTicket(ticket);
      setIsSubmitting(false);
      if (onTicketCreated) onTicketCreated(ticket);
    }, 600);
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setDescription('');
    setSubcategory('');
    setUploadedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl glass-strong border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8"
      >
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-ink-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedTicket ? (
          /* Submission Success View */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-acid/20 border border-acid/30 text-acid flex items-center justify-center mx-auto shadow-lg shadow-acid/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold tracking-wider px-3 py-1 rounded-full bg-acid/15 text-acid border border-acid/30">
                {submittedTicket.id}
              </span>
              <h3 className="font-display font-bold text-2xl text-white mt-3">
                Your ticket has been submitted successfully
              </h3>
              <p className="text-sm text-ink-300 mt-1 max-w-md mx-auto">
                Our AI routing engine has classified your issue and dispatched it to the{' '}
                <strong className="text-white">{submittedTicket.department}</strong> team.
              </p>
            </div>

            {/* Ticket Snapshot Card */}
            <div className="p-5 rounded-2xl bg-ink-900/80 border border-white/10 text-left max-w-lg mx-auto space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-400">Issue Category:</span>
                <span className="font-semibold text-white uppercase">{submittedTicket.category.replace('_', ' ')}</span>
              </div>
              {submittedTicket.stationName && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink-400">Station:</span>
                  <span className="font-semibold text-white">{submittedTicket.stationName}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-400">Priority:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    submittedTicket.priority === 'CRITICAL'
                      ? 'bg-danger-500/20 text-danger-400'
                      : submittedTicket.priority === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-acid/20 text-acid'
                  }`}
                >
                  {submittedTicket.priority}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-400">Initial Status:</span>
                <span className="font-mono text-acid font-bold">{submittedTicket.status}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-400">Target SLA:</span>
                <span className="text-ink-200">{submittedTicket.slaHours} Hours Resolution</span>
              </div>

              {submittedTicket.suggestedFirstAction && (
                <div className="pt-3 border-t border-white/5">
                  <p className="text-[11px] font-bold text-acid flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Suggested Immediate Action:
                  </p>
                  <p className="text-xs text-ink-300 leading-relaxed bg-ink-950/60 p-2.5 rounded-xl border border-white/5">
                    {submittedTicket.suggestedFirstAction}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button onClick={handleResetAndClose} className="btn-primary px-8">
                Done &amp; Track in My Tickets
              </button>
            </div>
          </div>
        ) : (
          /* Ticket Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-acid/15 border border-acid/30 text-acid flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">Raise a Support Ticket</h3>
                <p className="text-xs text-ink-400">Report station glitches, payment mismatches, or hardware faults</p>
              </div>
            </div>

            {/* 1. Issue Category */}
            <div>
              <label className="block text-xs font-semibold text-ink-200 mb-2">Issue Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'charging_station', label: 'Station Issue', icon: Zap },
                  { id: 'booking', label: 'Booking Issue', icon: CalendarCheck },
                  { id: 'payment', label: 'Payment Issue', icon: CreditCard },
                  { id: 'navigation', label: 'Map / Nav', icon: MapPin },
                  { id: 'app', label: 'App Bug', icon: AlertTriangle },
                  { id: 'account', label: 'Account / Login', icon: Shield },
                  { id: 'other', label: 'Other', icon: Clock },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setCategory(item.id as TicketIssueCategory);
                        setSubcategory('');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-acid/15 border-acid text-white font-semibold'
                          : 'bg-ink-900/60 border-white/5 text-ink-300 hover:border-white/20'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-acid' : 'text-ink-400'}`} />
                      <span className="text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Common Issue Chips */}
            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1.5">Common Issues (Select to autofill)</label>
              <div className="flex flex-wrap gap-1.5">
                {(category === 'charging_station' ? COMMON_STATION_ISSUES : COMMON_APP_ISSUES).map((issue) => (
                  <button
                    type="button"
                    key={issue}
                    onClick={() => handleSubcategorySelect(issue)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      subcategory === issue
                        ? 'bg-acid text-ink-950 font-bold border-acid shadow-sm'
                        : 'bg-ink-900/50 border-white/5 text-ink-300 hover:border-white/20'
                    }`}
                  >
                    {issue}
                  </button>
                ))}
              </div>
            </div>

            {/* Station & Charger (Visible for charging station issues) */}
            {category === 'charging_station' && (
              <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-ink-900/40 border border-white/5">
                <div>
                  <label className="block text-xs font-semibold text-ink-300 mb-1">Charging Station</label>
                  <select
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-white text-xs focus:border-acid focus:outline-none"
                  >
                    {liveStations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-300 mb-1">Charger Port / Type</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chargerNumber}
                      onChange={(e) => setChargerNumber(e.target.value)}
                      placeholder="e.g. Charger 2 / Gun A"
                      className="flex-1 px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-white text-xs focus:border-acid focus:outline-none"
                    />
                    <select
                      value={chargerType}
                      onChange={(e) => setChargerType(e.target.value as ChargerType)}
                      className="px-2 py-2 rounded-xl bg-ink-800 border border-white/10 text-white text-xs focus:border-acid focus:outline-none"
                    >
                      <option value="Fast">Fast (DC)</option>
                      <option value="Ultra-Fast">Ultra-Fast (150kW+)</option>
                      <option value="Normal">Normal (AC Type 2)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Booking & Transaction References */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">Booking ID (Optional)</label>
                {bookings.length > 0 ? (
                  <select
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-white text-xs focus:border-acid focus:outline-none"
                  >
                    <option value="">-- None / General Inquiry --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} ({b.stationName} - {b.time})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g. CNX-20481"
                    className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-white text-xs focus:border-acid focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. TXN-UPI-88491"
                  className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-white text-xs focus:border-acid focus:outline-none"
                />
              </div>
            </div>

            {/* Problem Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-ink-200">Problem Description *</label>
                <span className="text-[11px] text-ink-400">AI automatically detects urgency &amp; safety</span>
              </div>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened in detail... (e.g. 'I booked charger 2, but when I arrived the charger was not working.')"
                className="w-full px-4 py-3 rounded-2xl bg-ink-900 border border-white/10 text-white text-sm focus:border-acid focus:outline-none placeholder:text-ink-500 resize-none"
              />
            </div>

            {/* Optional Screenshot / Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1.5">
                Upload Photo / Screenshot (Optional)
              </label>
              {uploadedImage ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-ink-900 border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-white">
                    <FileText className="w-4 h-4 text-acid" />
                    <span className="truncate max-w-xs">{uploadedImage.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="text-xs text-danger-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 bg-ink-900/40 hover:bg-white/5 transition-colors cursor-pointer text-xs text-ink-300">
                  <Upload className="w-4 h-4 text-acid" />
                  <span>Attach photo or screenshot (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Live AI Classification Preview Badge */}
            {liveClassification && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border ${
                  liveClassification.isSafetyConcern
                    ? 'bg-danger-500/15 border-danger-500/30'
                    : 'bg-acid/10 border-acid/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-acid" />
                    <span className="text-xs font-bold text-white">AI Real-Time Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        liveClassification.priority === 'CRITICAL'
                          ? 'bg-danger-500/30 text-danger-400'
                          : liveClassification.priority === 'HIGH'
                          ? 'bg-amber-500/30 text-amber-400'
                          : 'bg-acid/20 text-acid'
                      }`}
                    >
                      Priority: {liveClassification.priority}
                    </span>
                    <span className="text-[10px] font-mono text-ink-300">
                      SLA: {liveClassification.slaHours}h
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink-200">{liveClassification.aiClassificationExplanation}</p>

                {liveClassification.suggestedFirstAction && (
                  <p className="text-[11px] text-ink-300 mt-2 pt-2 border-t border-white/5">
                    <strong className="text-white">Suggested First Step:</strong>{' '}
                    {liveClassification.suggestedFirstAction}
                  </p>
                )}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="btn-primary text-xs flex items-center gap-2 px-6"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing &amp; Filing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Ticket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
