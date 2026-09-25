import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, Bot, User as UserIcon,
  Zap, Clock, MapPin, CheckCircle2, AlertTriangle, CreditCard,
  Shield, FileText, Eye
} from 'lucide-react';
import type { ChargerType } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  generateAIRecommendations,
  parseUserQuery,
  type StationRecommendation,
  type PreBookingSummary,
  initiatePayment,
  joinWaitlist,
} from '@/services/aiAgentService';
import { buildGoogleMapsDirectionsUrl, openGoogleMaps, getStationCoordinates } from '@/utils/navigation';
import type { SupportTicket } from '@/types';
import { classifyTicketWithAI, buildSupportTicket } from '@/services/ticketClassifierService';
import { calculateBookingTimeState } from '@/services/gracePeriodService';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  recommendations?: StationRecommendation[];
  preBookingSummary?: PreBookingSummary;
  waitlistNotice?: { stationName: string; chargerType: string };
  ticketNotice?: SupportTicket;
  suggestTicketPrompt?: {
    description: string;
    category: string;
    priority: string;
    department: string;
    suggestedAction: string;
    isSafety?: boolean;
  };
  isEmergency?: boolean;
  navStation?: { name: string; lat: number; lng: number };
}

export function AIAgentChatModal({
  isOpen,
  onClose,
  embedded = false,
}: {
  isOpen: boolean;
  onClose?: () => void;
  embedded?: boolean;
}) {
  const {
    user,
    liveStations,
    userLocation,
    setPendingBookingDetails,
    navigate,
    bookings,
    cancelPaidBooking,
    startChargingSession,
    graceConfig,
    addToWaitlist,
    activeSlotMonitoring,
    tickets,
    addTicket,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Hello${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm ChargeNix AI, your charging assistant. I continuously monitor live port availability, highway corridors, and your vehicle's telemetry to recommend optimal charging stops. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [currentRecs, setCurrentRecs] = useState<StationRecommendation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isDeliberating]);

  // Handle User Message
  const handleSendMessage = (textToSend?: string) => {
    const raw = (textToSend || inputText).trim();
    if (!raw) return;
    setInputText('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: raw,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsDeliberating(true);

    // AI Intent Execution Loop
    setTimeout(() => {
      const parsed = parseUserQuery(raw);
      const coords = userLocation || { lat: 17.3850, lng: 78.4867 };
      const currentBattery = parsed.batteryPercent ?? user?.batteryPercent ?? 18;

      let replyText = '';
      let recs: StationRecommendation[] | undefined;
      let preBooking: PreBookingSummary | undefined;
      let isEmergency = false;
      let navStation: { name: string; lat: number; lng: number } | undefined;
      let ticketNotice: SupportTicket | undefined;
      let suggestTicketPrompt: ChatMessage['suggestTicketPrompt'];

      switch (parsed.intent) {
        case 'cancel_booking': {
          const upcoming = bookings.find((b) => b.status === 'confirmed');
          if (upcoming) {
            cancelPaidBooking(upcoming.id);
            replyText = `I have cancelled your booking (${upcoming.id}) at ${upcoming.stationName}. The reserved slot has been released back to the live charging grid.`;
          } else {
            replyText = `You do not have any active upcoming reservations to cancel. You can check your completed history in My Bookings.`;
          }
          break;
        }

        case 'my_bookings': {
          const upcoming = bookings.filter((b) => b.status === 'confirmed');
          if (upcoming.length > 0) {
            replyText = `You have ${upcoming.length} active reservation:\n• ${upcoming[0].stationName} on ${upcoming[0].date} at ${upcoming[0].time} (${upcoming[0].chargerType} Charger, ID: ${upcoming[0].id}).`;
            const coords = getStationCoordinates({
              stationId: upcoming[0].stationId,
              stationName: upcoming[0].stationName,
              lat: upcoming[0].lat,
              lng: upcoming[0].lng,
            });
            if (coords) {
              navStation = { name: upcoming[0].stationName, lat: coords.lat, lng: coords.lng };
            }
          } else {
            replyText = `You currently have no upcoming bookings. Would you like me to find a convenient charging station for your route?`;
          }
          break;
        }

        case 'station_location': {
          const upcoming = bookings.find((b) => b.status === 'confirmed');
          const targetStation = upcoming
            ? liveStations.find((s) => s.id === upcoming.stationId)
            : liveStations[0];

          if (targetStation) {
            replyText = `${targetStation.name} is located at ${targetStation.location} (${targetStation.distanceKm} km from you). Click the navigation button below to launch Google Maps driving directions directly:`;
            navStation = {
              name: targetStation.name,
              lat: targetStation.lat,
              lng: targetStation.lng,
            };
          }
          break;
        }

        case 'cheaper': {
          const result = generateAIRecommendations(
            { currentBatteryPercent: currentBattery, destination: parsed.destination },
            liveStations,
            coords
          );
          recs = result.recommendations;
          setCurrentRecs(recs);
          const cheapest = recs.find((r) => r.tier === 'CHEAPEST') || recs[0];
          replyText = `Here are more economical charging options. ${cheapest.station.name} offers the lowest session rate at ₹${cheapest.estimatedCostInr} total.`;
          break;
        }

        case 'faster': {
          const result = generateAIRecommendations(
            { currentBatteryPercent: currentBattery, destination: parsed.destination },
            liveStations,
            coords
          );
          recs = result.recommendations;
          setCurrentRecs(recs);
          const fastest = recs.find((r) => r.tier === 'FASTEST') || recs[0];
          replyText = `Prioritizing maximum delivery speed: ${fastest.station.name} offers ${fastest.speedKw} kW ${fastest.chargerType} charging (~${fastest.estimatedTimeMin} min session).`;
          break;
        }

        case 'book_option': {
          const idx = parsed.selectedOptionIndex ?? 0;
          const targetRec = currentRecs[idx] || currentRecs[0];
          if (targetRec) {
            const today = new Date().toISOString().split('T')[0];
            preBooking = {
              stationId: targetRec.station.id,
              stationName: targetRec.station.name,
              stationLocation: targetRec.station.location,
              chargerType: targetRec.chargerType,
              date: today,
              dateLabel: 'Today',
              timeSlot: '02:30 PM',
              estimatedCost: targetRec.estimatedCostInr,
              estimatedMinutes: targetRec.estimatedTimeMin,
              lat: targetRec.station.lat,
              lng: targetRec.station.lng,
            };
            replyText = `I have staged your reservation for ${targetRec.station.name}. Please confirm the details below to proceed to the secure payment verification:`;
          } else {
            replyText = `Please select or search for a charging station option first so I can prepare your reservation.`;
          }
          break;
        }

        case 'emergency': {
          isEmergency = true;
          const result = generateAIRecommendations(
            { currentBatteryPercent: currentBattery, destination: parsed.destination },
            liveStations,
            coords
          );
          recs = result.recommendations;
          setCurrentRecs(recs);
          replyText = `⚠️ Emergency Low-Battery Mode Activated (${currentBattery}% remaining). ChargeNix prioritized reachable stations with immediate charger availability and zero queue delay:`;
          break;
        }

        default: {
          const result = generateAIRecommendations(
            { currentBatteryPercent: currentBattery, destination: parsed.destination },
            liveStations,
            coords
          );
          recs = result.recommendations;
          setCurrentRecs(recs);
          isEmergency = result.emergencyMode;

          if (parsed.destination) {
            replyText = `Based on your ${currentBattery}% battery level, route toward ${parsed.destination}, live port telemetry, and pricing, I found 3 tailored options for you:`;
          } else {
            replyText = `I analyzed nearby charging hubs based on your ${currentBattery}% battery level, live port availability, and turnaround times. Here are the 3 top recommendations:`;
          }
          break;
        }

        case 'check_ticket_status': {
          const tkt = tickets.find((t) => t.id.toLowerCase() === parsed.ticketId?.toLowerCase());
          if (tkt) {
            replyText = `Ticket ${tkt.id} is currently ${tkt.status.replace('_', ' ')}. Priority: ${tkt.priority}, Assigned to: ${tkt.assignedTo || 'Station Operations'}. Target SLA: ${tkt.slaHours} hours.`;
            ticketNotice = tkt;
          } else {
            replyText = `I could not locate ticket ${parsed.ticketId}. You can review all your filed tickets in the Help & Support center.`;
          }
          break;
        }

        case 'raise_ticket_confirmed': {
          const upcoming = bookings[0];
          const ticket = buildSupportTicket(
            {
              description: raw,
              stationName: upcoming?.stationName,
              stationId: upcoming?.stationId,
              bookingId: upcoming?.id,
              chargerType: upcoming?.chargerType,
            },
            {
              id: user?.id || 'usr-default',
              name: user?.name || 'EV Driver',
              email: user?.email || 'driver@chargenix.io',
            }
          );
          addTicket(ticket);
          ticketNotice = ticket;
          replyText = `✓ I have officially registered Support Ticket #${ticket.id} and routed it directly to ${ticket.department} (${ticket.priority} Priority). Suggested immediate step: ${ticket.suggestedFirstAction}`;
          break;
        }

        case 'grace_period_status': {
          const activeGrace = bookings.find((b) => b.status === 'GRACE_PERIOD');
          const upcoming = bookings.find((b) => b.status === 'RESERVED' || b.status === 'confirmed');
          if (activeGrace) {
            const state = calculateBookingTimeState(activeGrace, graceConfig.gracePeriodMinutes);
            replyText = `Your reservation at ${activeGrace.stationName} (${activeGrace.chargerNumber || 'Charger 2'}) is in its active grace period with ${state.countdownFormatted} remaining. Please arrive and plug in soon to keep your reservation. Would you like driving navigation?`;
            const coords = getStationCoordinates({
              stationId: activeGrace.stationId,
              stationName: activeGrace.stationName,
              lat: activeGrace.lat,
              lng: activeGrace.lng,
            }, liveStations);
            if (coords) {
              navStation = { name: activeGrace.stationName, lat: coords.lat, lng: coords.lng };
            }
          } else if (upcoming) {
            replyText = `Your upcoming reservation at ${upcoming.stationName} starts at ${upcoming.startTime || upcoming.time}. You will have a ${upcoming.gracePeriodMinutes || graceConfig.gracePeriodMinutes}-minute grace period once the slot starts to arrive and plug in.`;
          } else {
            replyText = `You do not have any active bookings in grace period right now. All confirmed reservations receive a ${graceConfig.gracePeriodMinutes}-minute arrival grace window.`;
          }
          break;
        }

        case 'start_charging': {
          const activeGrace = bookings.find((b) => b.status === 'GRACE_PERIOD');
          const upcoming = bookings.find((b) => b.status === 'RESERVED' || b.status === 'confirmed');
          const target = activeGrace || upcoming;
          if (target) {
            startChargingSession(target.id);
            replyText = `Charging session started successfully for booking ${target.id} at ${target.stationName} (${target.chargerNumber || 'Charger 2'}). The port is now marked OCCUPIED and grace countdown has stopped.`;
          } else {
            replyText = `No active or reserved slot was found to begin charging. Would you like me to find an available charger near you?`;
          }
          break;
        }

        case 'no_show_inquiry': {
          const activeOrRecent = bookings[0];
          const isPayAtStation = activeOrRecent && (
            activeOrRecent.payment.method === 'PAY_AT_STATION' ||
            activeOrRecent.payment.method === 'PAY_AT_COUNTER' ||
            activeOrRecent.payment.method === 'counter'
          );

          if (activeOrRecent) {
            if (isPayAtStation) {
              replyText = `For your Pay at Station booking (${activeOrRecent.id} at ${activeOrRecent.stationName}):\nIf you don't arrive within the ${activeOrRecent.gracePeriodMinutes || graceConfig.gracePeriodMinutes}-minute grace period, your booking will expire after the grace period. Since you haven't paid online, no refund is required, and the slot will be released back to the charging grid.`;
            } else {
              const origAmount = activeOrRecent.originalPaymentAmount || activeOrRecent.payment.amount || 300;
              const chargePct = graceConfig.noShowChargePercentage ?? 10;
              const chargeAmt = activeOrRecent.noShowCharge ?? Math.round((origAmount * chargePct) / 100);
              const refundAmt = activeOrRecent.refundAmount ?? (origAmount - chargeAmt);
              const refundStatus = activeOrRecent.refundStatus;

              if (activeOrRecent.status === 'NO_SHOW') {
                if (refundStatus === 'REFUNDED') {
                  replyText = `For your no-show booking (${activeOrRecent.id}): A 10% no-show charge (₹${chargeAmt}) was deducted from your original payment of ₹${origAmount}. A simulated refund of ₹${refundAmt} has been confirmed and processed.`;
                } else {
                  replyText = `For your no-show booking (${activeOrRecent.id}): A 10% no-show charge (₹${chargeAmt}) was deducted from your original payment of ₹${origAmount}. The remaining eligible refund amount of ₹${refundAmt} is currently processing.`;
                }
              } else {
                replyText = `If you don't start charging within the ${activeOrRecent.gracePeriodMinutes || graceConfig.gracePeriodMinutes}-minute grace period, your booking becomes a no-show. A configured no-show charge (${chargePct}%, e.g. ₹${chargeAmt} on ₹${origAmount}) is deducted and the remaining eligible amount (₹${refundAmt}) enters the refund process.`;
              }
            }
          } else {
            replyText = `Here is what happens if you don't show up:
• Pay Online: If you don't start charging within the ${graceConfig.gracePeriodMinutes}-minute grace period, your booking becomes a no-show. A configured no-show charge (${graceConfig.noShowChargePercentage ?? 10}%) is deducted and the remaining eligible amount enters the refund process (e.g., ₹300 payment → ₹30 charge → ₹270 refund).
• Pay at Station: If you don't arrive, your booking will expire after the grace period. Since you haven't paid online, no refund is required.`;
          }
          break;
        }

        case 'report_issue': {
          const upcoming = bookings[0];
          const classification = classifyTicketWithAI({
            description: raw,
            stationName: upcoming?.stationName,
            stationId: upcoming?.stationId,
            bookingId: upcoming?.id,
            chargerType: upcoming?.chargerType,
          });

          if (classification.isSafetyConcern) {
            isEmergency = true;
            replyText = `🚨 SAFETY ALERT: Please step back from the equipment immediately and do not touch damaged cables or broken connectors. Station Operations has been signaled to isolate power remotely. Would you like me to raise an urgent ticket?`;
          } else {
            replyText = `I analyzed your report. Suggested troubleshooting: ${classification.suggestedFirstAction}\n\nWould you like me to file an official support ticket with ${classification.department} (${classification.priority} Priority)?`;
          }

          suggestTicketPrompt = {
            description: raw,
            category: classification.category.replace('_', ' ').toUpperCase(),
            priority: classification.priority,
            department: classification.department,
            suggestedAction: classification.suggestedFirstAction,
            isSafety: classification.isSafetyConcern,
          };
          break;
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: recs,
        preBookingSummary: preBooking,
        isEmergency,
        navStation,
        ticketNotice,
        suggestTicketPrompt,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsDeliberating(false);
    }, 700);
  };

  const handleBookFromCard = (rec: StationRecommendation) => {
    const today = new Date().toISOString().split('T')[0];
    const summary: PreBookingSummary = {
      stationId: rec.station.id,
      stationName: rec.station.name,
      stationLocation: rec.station.location,
      chargerType: rec.chargerType,
      date: today,
      dateLabel: 'Today',
      timeSlot: '03:00 PM',
      estimatedCost: rec.estimatedCostInr,
      estimatedMinutes: rec.estimatedTimeMin,
      lat: rec.station.lat,
      lng: rec.station.lng,
    };

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `Review your slot selection for ${rec.station.name}:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      preBookingSummary: summary,
    };

    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleExecuteBooking = (summary: PreBookingSummary) => {
    initiatePayment(summary, setPendingBookingDetails, navigate);
    if (onClose) onClose();
  };

  const handleJoinWaitlistAction = (stationName: string, stationId: string, chargerType: string) => {
    const entry = joinWaitlist(stationId, stationName, chargerType as ChargerType);
    addToWaitlist(entry);

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `✓ You have joined the virtual waitlist for ${chargerType} charger at ${stationName}. The instant a vehicle disconnects and frees up this port, I will alert you so you can confirm and claim it.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleCreateTicketDirectly = (issueDesc: string) => {
    const upcoming = bookings[0];
    const ticket = buildSupportTicket(
      {
        description: issueDesc,
        stationName: upcoming?.stationName,
        stationId: upcoming?.stationId,
        bookingId: upcoming?.id,
        chargerType: upcoming?.chargerType,
      },
      {
        id: user?.id || 'usr-default',
        name: user?.name || 'EV Driver',
        email: user?.email || 'driver@chargenix.io',
      }
    );
    addTicket(ticket);

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `✓ I have officially registered Support Ticket #${ticket.id} and routed it directly to ${ticket.department} (${ticket.priority} Priority). Our operations team has been notified.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ticketNotice: ticket,
    };
    setMessages((prev) => [...prev, aiMsg]);
  };

  if (!isOpen && !embedded) return null;

  const content = (
    <div className={`flex flex-col h-full bg-ink-950/95 text-ink-100 ${embedded ? 'rounded-3xl border border-white/10 shadow-2xl' : ''}`}>
      {/* Modal / Card Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-ink-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-acid/15 border border-acid/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-acid" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-white">ChargeNix AI Agent</h3>
              <span className="w-2 h-2 rounded-full bg-acid animate-pulse" />
            </div>
            <p className="text-xs text-ink-400">Autonomous EV Routing &amp; Slot Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSlotMonitoring && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-acid/10 border border-acid/30 text-[11px] text-acid font-medium">
              <Clock className="w-3 h-3" />
              <span>Monitoring Slot: {activeSlotMonitoring.stationName}</span>
            </div>
          )}
          {!embedded && onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-ink-800 text-ink-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-acid/15 border border-acid/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-acid" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-acid text-ink-950 font-medium rounded-tr-sm shadow-md shadow-acid/10'
                  : 'glass text-ink-200 rounded-tl-sm border border-white/5 space-y-3'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Emergency Banner */}
              {msg.isEmergency && (
                <div className="p-2.5 rounded-xl bg-danger-500/15 border border-danger-500/30 text-xs text-danger-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger-400 shrink-0" />
                  <span>Prioritizing immediate reachable ports under 15 km</span>
                </div>
              )}

              {/* Interactive Recommendations Cards (Section 3 & 4) */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  {msg.recommendations.map((rec) => (
                    <div
                      key={rec.tier}
                      className="p-3.5 rounded-xl bg-ink-900/80 border border-white/10 hover:border-acid/30 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.tier === 'FASTEST' ? 'bg-sky-500/20 text-sky-300' :
                            rec.tier === 'CHEAPEST' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-acid/20 text-acid'
                          }`}>
                            {rec.tier}
                          </span>
                          <span className="font-semibold text-white text-xs sm:text-sm">{rec.station.name}</span>
                        </div>
                        <span className="font-display font-bold text-acid text-sm">₹{rec.estimatedCostInr}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-400">
                        <span>📍 {rec.distanceKm} km</span>
                        <span>⚡ {rec.speedKw} kW ({rec.chargerType})</span>
                        <span>⏱️ ~{rec.estimatedTimeMin}m</span>
                        <span className={rec.availablePorts > 0 ? 'text-acid' : 'text-danger-400'}>
                          {rec.availablePorts > 0 ? `${rec.availablePorts} ports open` : 'Occupied'}
                        </span>
                      </div>

                      {/* Plain-English Reasons */}
                      <div className="pt-1 text-[11px] text-ink-300 space-y-0.5">
                        {rec.reasons.slice(0, 2).map((r, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-acid shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1.5 flex gap-2">
                        {rec.availablePorts > 0 ? (
                          <button
                            onClick={() => handleBookFromCard(rec)}
                            className="btn-primary py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm shadow-acid/15"
                          >
                            <Zap className="w-3 h-3 fill-current" />
                            <span>Select Option</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinWaitlistAction(rec.station.name, rec.station.id, rec.chargerType)}
                            className="py-1.5 px-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/20 transition-all cursor-pointer"
                          >
                            Join Waitlist
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pre-Booking Confirmation Card (Section 5) */}
              {msg.preBookingSummary && (
                <div className="p-4 rounded-xl bg-ink-900 border border-acid/30 space-y-3 mt-2 shadow-lg">
                  <div className="flex items-center gap-2 text-acid font-semibold text-xs uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Booking Confirmation Required</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-ink-300">
                    <div className="flex justify-between">
                      <span className="text-ink-400">Station:</span>
                      <span className="text-white font-semibold">{msg.preBookingSummary.stationName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-400">Charger:</span>
                      <span className="text-acid">{msg.preBookingSummary.chargerType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-400">Time:</span>
                      <span className="text-white">{msg.preBookingSummary.timeSlot} ({msg.preBookingSummary.dateLabel})</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-white/5 font-semibold">
                      <span className="text-white">Estimated Cost:</span>
                      <span className="text-acid font-display font-bold text-sm">₹{msg.preBookingSummary.estimatedCost}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-ink-400">Would you like to book this slot?</p>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleExecuteBooking(msg.preBookingSummary!)}
                      className="btn-primary py-2 px-3 text-xs font-bold rounded-xl flex-1 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-acid/20"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Book</span>
                    </button>
                    <button
                      onClick={() => handleSendMessage('Show cheaper options')}
                      className="btn-secondary py-2 px-3 text-xs font-medium rounded-xl cursor-pointer"
                    >
                      Choose Another
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Action Button (Section 7) */}
              {msg.navStation && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const url = buildGoogleMapsDirectionsUrl(
                        { lat: msg.navStation!.lat, lng: msg.navStation!.lng },
                        userLocation
                      );
                      openGoogleMaps(url);
                    }}
                    className="btn-primary py-2 px-4 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-acid/20 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 fill-current" />
                    <span>📍 Navigate to Station</span>
                  </button>
                </div>
              )}

              {/* Issue Troubleshooting & Ticket Creation Card (Section 16 & 22) */}
              {msg.suggestTicketPrompt && (
                <div className="p-3.5 rounded-2xl bg-ink-900/90 border border-white/10 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">
                      {msg.suggestTicketPrompt.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        msg.suggestTicketPrompt.priority === 'CRITICAL'
                          ? 'bg-danger-500/20 text-danger-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      Priority: {msg.suggestTicketPrompt.priority}
                    </span>
                  </div>

                  <p className="text-[11px] text-ink-300 leading-relaxed bg-ink-950/60 p-2.5 rounded-xl border border-white/5">
                    <strong className="text-white">Recommended Action:</strong>{' '}
                    {msg.suggestTicketPrompt.suggestedAction}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={() => handleCreateTicketDirectly(msg.suggestTicketPrompt!.description)}
                      className="btn-primary py-2 px-3 text-xs font-bold rounded-xl flex-1 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-acid/20"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Raise Support Ticket</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onClose) onClose();
                        navigate('support');
                      }}
                      className="btn-secondary py-2 px-3 text-xs font-medium rounded-xl cursor-pointer"
                    >
                      View Support Center
                    </button>
                  </div>
                </div>
              )}

              {/* Official Ticket Confirmation Card (Section 7) */}
              {msg.ticketNotice && (
                <div className="p-3.5 rounded-2xl bg-acid/10 border border-acid/30 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-acid">{msg.ticketNotice.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-acid/20 text-acid font-bold">
                      {msg.ticketNotice.status}
                    </span>
                  </div>

                  <p className="font-semibold text-white text-xs">{msg.ticketNotice.subject}</p>
                  <p className="text-[11px] text-ink-300">
                    Department: {msg.ticketNotice.department} · SLA Target: {msg.ticketNotice.slaHours} hours
                  </p>

                  <button
                    onClick={() => {
                      if (onClose) onClose();
                      navigate('support');
                    }}
                    className="btn-primary py-2 px-3 text-xs font-bold rounded-xl w-full flex items-center justify-center gap-1.5 shadow-md shadow-acid/20 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Track in Help &amp; Support</span>
                  </button>
                </div>
              )}

              <span className={`text-[10px] block text-right mt-1 ${msg.sender === 'user' ? 'text-ink-800' : 'text-ink-500'}`}>
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-ink-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <UserIcon className="w-4 h-4 text-ink-300" />
              </div>
            )}
          </div>
        ))}

        {isDeliberating && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-xl bg-acid/15 border border-acid/30 flex items-center justify-center shrink-0 animate-spin">
              <Sparkles className="w-4 h-4 text-acid" />
            </div>
            <div className="glass px-4 py-2.5 rounded-2xl text-xs text-ink-400 flex items-center gap-2 border border-white/5">
              <div className="w-3 h-3 border-2 border-acid border-t-transparent rounded-full animate-spin" />
              <span>Analyzing live telemetry &amp; calculating optimal options...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips (Section 11) */}
      <div className="px-4 py-2 bg-ink-900/40 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {[
          'What is my grace period status?',
          'Start charging session',
          'Find a charger nearby',
          'I have 15% battery and need to reach the airport',
          'Report an issue with charger',
          'What is the no-show policy?',
          'Show cheaper options',
          'Find a faster charger',
          'Where is my charging station?',
          'Cancel my booking',
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-ink-800/80 border border-white/5 text-ink-300 hover:text-white hover:border-acid/30 transition-all cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-ink-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-ink-950 rounded-2xl border border-white/10 p-2 focus-within:border-acid/50 transition-all"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask ChargeNix AI anything (e.g. 'I have 18% battery and need to reach Warangal')..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-ink-500 focus:outline-none px-2"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isDeliberating}
            className="w-9 h-9 rounded-xl bg-acid text-ink-950 flex items-center justify-center hover:bg-acid-400 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-acid/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-950/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          className="w-full max-w-2xl h-[85vh] max-h-[720px] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        >
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Floating AI Trigger Button ──────────────────────────────────────────────
export function FloatingAIButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 p-3.5 sm:px-4 sm:py-3.5 rounded-full bg-acid text-ink-950 font-display font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl shadow-acid/30 hover:bg-acid-400 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group border border-white/20"
      title="Open ChargeNix AI Assistant"
    >
      <div className="relative">
        <Sparkles className="w-5 h-5 text-ink-950 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-ink-950 animate-ping" />
      </div>
      <span className="hidden sm:inline">Ask AI Agent</span>
    </button>
  );
}
