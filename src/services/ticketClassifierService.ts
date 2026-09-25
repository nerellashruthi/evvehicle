import type {
  TicketIssueCategory,
  TicketPriority,
  SupportDepartment,
  SupportTicket,
  ChargerType,
} from '@/types';
import { stations as defaultStations } from '@/data/stations';

export interface ClassificationInput {
  description: string;
  category?: TicketIssueCategory;
  subcategory?: string;
  stationName?: string;
  stationId?: string;
  chargerNumber?: string;
  chargerType?: ChargerType;
  bookingId?: string;
  transactionId?: string;
}

export interface AIClassificationResult {
  category: TicketIssueCategory;
  subcategory: string;
  priority: TicketPriority;
  department: SupportDepartment;
  stationName?: string;
  stationId?: string;
  chargerNumber?: string;
  chargerType?: ChargerType;
  bookingId?: string;
  transactionId?: string;
  suggestedFirstAction: string;
  aiClassificationExplanation: string;
  isSafetyConcern: boolean;
  slaHours: number;
}

// ── Common Pre-set Issues ───────────────────────────────────────────────────

export const COMMON_STATION_ISSUES = [
  'Charger not working',
  'Charging failed',
  'Charger unavailable despite showing available',
  'Slot already occupied',
  'Payment deducted but charging did not start',
  'Charging stopped unexpectedly',
  'Damaged connector/cable',
  'Station inaccessible',
  'Incorrect charger information',
  'Other',
] as const;

export const COMMON_APP_ISSUES = [
  'Login problem',
  'Booking problem',
  'Payment problem',
  'Map/location problem',
  'Navigation problem',
  'App crash/bug',
  'Incorrect station information',
  'Notification problem',
  'Other',
] as const;

export const SLA_TARGETS_HOURS: Record<TicketPriority, number> = {
  CRITICAL: 1,
  HIGH: 4,
  MEDIUM: 12,
  LOW: 24,
};

// ── Safety Trigger Patterns ─────────────────────────────────────────────────
const SAFETY_PATTERNS = [
  /\b(smoke|smoking|burnt|burning|fire|flame)\b/i,
  /\b(spark|sparking|arc|explosion|blast)\b/i,
  /\b(shock|electric shock|current leak)\b/i,
  /\b(exposed wire|wire sheath|cut cable|bare wire|frayed cable)\b/i,
  /\b(water leak near charger|submerged|flooded)\b/i,
  /\b(overheating|melting|hot connector)\b/i,
];

/**
 * Generates a unique ChargeNix ticket identifier (e.g. CNX-TKT-10452)
 */
export function generateTicketId(): string {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CNX-TKT-${rand}`;
}

/**
 * Intelligent AI Ticket Classification Engine
 * Analyzes ticket description & context to assign category, priority, department,
 * safe first troubleshooting action, and SLA targets.
 */
export function classifyTicketWithAI(input: ClassificationInput): AIClassificationResult {
  const text = (input.description || '').toLowerCase();

  // 1. Safety hazard detection
  const isSafety = SAFETY_PATTERNS.some((p) => p.test(text));

  // 2. Identify Category
  let category: TicketIssueCategory = input.category || 'other';

  if (!input.category || input.category === 'other') {
    if (isSafety || /charger|gun|connector|kwh|dispenser|plug|socket|voltage|relay|handshake|power/i.test(text)) {
      category = 'charging_station';
    } else if (/payment|deducted|debited|refund|upi|transaction|money|bill|receipt|double charg/i.test(text)) {
      category = 'payment';
    } else if (/book|slot|reservation|reserved|cancel|reschedule|occupied|already parked/i.test(text)) {
      category = 'booking';
    } else if (/navigat|google maps|gps|direction|location|route|waypoint|map pin/i.test(text)) {
      category = 'navigation';
    } else if (/login|otp|password|account|sign in|profile|email/i.test(text)) {
      category = 'account';
    } else if (/crash|slow|bug|glitch|freeze|blank screen|notification/i.test(text)) {
      category = 'app';
    }
  }

  // 3. Extract or Match Station
  let stationName = input.stationName;
  let stationId = input.stationId;

  if (!stationName) {
    for (const st of defaultStations) {
      if (text.includes(st.name.toLowerCase()) || text.includes(st.location.toLowerCase())) {
        stationName = st.name;
        stationId = st.id;
        break;
      }
    }
  }

  // 4. Extract Charger / Gun
  let chargerNumber = input.chargerNumber;
  if (!chargerNumber) {
    const chargerMatch = text.match(/\b(charger\s*\d+|gun\s*[a-z0-9]+|port\s*\d+)\b/i);
    if (chargerMatch) {
      chargerNumber = chargerMatch[0].toUpperCase();
    }
  }

  // 5. Extract Booking ID
  let bookingId = input.bookingId;
  if (!bookingId) {
    const bMatch = text.match(/\b(cnx-\d{4,6}|bkg-[a-z0-9]+)\b/i);
    if (bMatch) {
      bookingId = bMatch[0].toUpperCase();
    }
  }

  // 6. Extract Transaction ID
  let transactionId = input.transactionId;
  if (!transactionId) {
    const txMatch = text.match(/\b(txn-[a-z0-9-]+|[0-9]{12})\b/i);
    if (txMatch) {
      transactionId = txMatch[0].toUpperCase();
    }
  }

  // 7. Determine Priority
  let priority: TicketPriority = 'MEDIUM';

  if (isSafety) {
    priority = 'CRITICAL';
  } else if (
    /deducted|charged twice|paid but|charger not working|failed to charge|multiple chargers|offline/i.test(text) ||
    category === 'payment'
  ) {
    priority = 'HIGH';
  } else if (/slot already occupied|booking failure|reservation cancel|navigation error/i.test(text)) {
    priority = 'MEDIUM';
  } else if (/ui|typo|color|suggestion|feedback|info correction/i.test(text)) {
    priority = 'LOW';
  }

  // 8. Assign Subcategory
  let subcategory = input.subcategory;
  if (!subcategory) {
    if (isSafety) {
      subcategory = 'Damaged connector/cable';
    } else if (/not working|fails? to start|won't start/i.test(text)) {
      subcategory = 'Charger not working';
    } else if (/deducted|debited/i.test(text) && /not start|failed/i.test(text)) {
      subcategory = 'Payment deducted but charging did not start';
    } else if (/occupied|someone else/i.test(text)) {
      subcategory = 'Slot already occupied';
    } else if (/stopped|interrupted|cut off/i.test(text)) {
      subcategory = 'Charging stopped unexpectedly';
    } else if (category === 'payment') {
      subcategory = 'Payment verification query';
    } else if (category === 'booking') {
      subcategory = 'Booking slot issue';
    } else {
      subcategory = 'General issue';
    }
  }

  // 9. Automated Routing to Department
  let department: SupportDepartment = 'General Support';
  switch (category) {
    case 'charging_station':
      department = 'Station Operations';
      break;
    case 'payment':
      department = 'Payment Support';
      break;
    case 'booking':
      department = 'Station Operations';
      break;
    case 'navigation':
      department = 'Maps Support';
      break;
    case 'account':
      department = 'Account Support';
      break;
    case 'app':
      department = 'Technical Support';
      break;
    default:
      department = 'General Support';
  }

  // 10. Suggested First Troubleshooting Action (Safe steps only)
  let suggestedFirstAction = '';
  if (isSafety) {
    suggestedFirstAction =
      '⚠️ URGENT: Step back from the charger immediately. Do NOT touch any broken connectors or frayed cables. Station Operations has been signaled to isolate power remotely.';
  } else if (category === 'charging_station') {
    suggestedFirstAction =
      'Verify the emergency stop button is not engaged, ensure connector is firmly locked until you hear the mechanical latch click, and wait 30 seconds for handshake.';
  } else if (category === 'payment') {
    suggestedFirstAction =
      'Check your banking app for a reversal SMS. If debited without charging initiation, our payment ledger reconciles automatically within 2 hours. Do NOT retry repeatedly.';
  } else if (category === 'booking') {
    suggestedFirstAction =
      'Check My Bookings to confirm slot window. If an unauthorized vehicle is occupying your slot, Station Operations can reassign you to an adjacent open charger.';
  } else if (category === 'navigation') {
    suggestedFirstAction =
      'Open the Google Maps link directly from your booking card to use verified GPS coordinates for the station.';
  } else {
    suggestedFirstAction =
      'Our support specialist will review your description and reply directly in this ticket thread.';
  }

  // 11. Short explanation of classification (NO hidden chain-of-thought)
  const aiClassificationExplanation = isSafety
    ? 'CRITICAL SAFETY HAZARD identified. Escalated to Station Operations with emergency hardware quarantine.'
    : `Classified as ${priority} Priority ${department} ticket based on reported ${subcategory.toLowerCase()}.`;

  const slaHours = SLA_TARGETS_HOURS[priority];

  return {
    category,
    subcategory,
    priority,
    department,
    stationName,
    stationId,
    chargerNumber,
    chargerType: input.chargerType,
    bookingId,
    transactionId,
    suggestedFirstAction,
    aiClassificationExplanation,
    isSafetyConcern: isSafety,
    slaHours,
  };
}

/**
 * Creates a complete SupportTicket object ready to be persisted
 */
export function buildSupportTicket(
  input: ClassificationInput,
  user: { id?: string; name: string; email: string },
  attachments?: { name?: string; url?: string }
): SupportTicket {
  const classification = classifyTicketWithAI(input);
  const ticketId = generateTicketId();
  const now = new Date();
  const slaTargetTime = new Date(now.getTime() + classification.slaHours * 3600000).toISOString();

  const initialMessage = {
    id: `msg-${Date.now()}-user`,
    sender: 'user' as const,
    senderName: user.name || 'User',
    message: input.description,
    timestamp: now.toISOString(),
  };

  const autoSystemReply = {
    id: `msg-${Date.now()}-sys`,
    sender: 'ai_system' as const,
    senderName: 'ChargeNix Support AI',
    message: classification.isSafetyConcern
      ? `🚨 ${classification.suggestedFirstAction}`
      : `Ticket ${ticketId} registered with ${classification.department}. Suggested First Action: ${classification.suggestedFirstAction}`,
    timestamp: new Date(now.getTime() + 1000).toISOString(),
  };

  return {
    id: ticketId,
    userId: user.id || 'usr-default',
    userName: user.name || 'EV Driver',
    userEmail: user.email || 'support@chargenix.io',
    category: classification.category,
    subcategory: classification.subcategory,
    subject: `${classification.subcategory} at ${classification.stationName || 'ChargeNix Network'}`,
    description: input.description,
    stationId: classification.stationId,
    stationName: classification.stationName,
    chargerNumber: classification.chargerNumber,
    chargerType: classification.chargerType,
    bookingId: classification.bookingId,
    transactionId: classification.transactionId,
    priority: classification.priority,
    status: 'OPEN',
    department: classification.department,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    slaHours: classification.slaHours,
    slaTargetTime,
    isSlaAtRisk: false,
    isEscalated: classification.priority === 'CRITICAL',
    isSafetyConcern: classification.isSafetyConcern,
    attachmentName: attachments?.name,
    attachmentUrl: attachments?.url,
    suggestedFirstAction: classification.suggestedFirstAction,
    aiClassificationExplanation: classification.aiClassificationExplanation,
    messages: [initialMessage, autoSystemReply],
  };
}
