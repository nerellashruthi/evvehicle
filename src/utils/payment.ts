/**
 * Payment Service — Simulated gateway layer.
 *
 * ARCHITECTURE NOTE (Production):
 * ─────────────────────────────────────────────────────────────────────────────
 * In production, replace `simulatePaymentGateway` with a call to your
 * secure backend endpoint (e.g. POST /api/payments/initiate).
 *
 * The backend should:
 *  1. Create an order via Razorpay/Stripe SDK using the server-side secret key.
 *  2. Return an order_id / client_secret to the frontend.
 *  3. The frontend renders the Razorpay Checkout / Stripe Elements widget.
 *  4. On payment success, the gateway calls your webhook to confirm payment.
 *  5. Webhook updates the booking status in the database.
 *  6. Frontend polls / receives a real-time event confirming the booking.
 *
 * NEVER expose RAZORPAY_KEY_SECRET or STRIPE_SECRET_KEY in frontend code.
 * NEVER store CVV or raw card numbers anywhere.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ChargerType, PaymentBreakdown, PaymentMethod, PaymentRecord, PaymentStatus } from '@/types';

// ── Pricing constants (INR) ──────────────────────────────────────────────────
const PRICE_PER_KWH: Record<ChargerType, number> = {
  'Normal':     8,   // ₹8/kWh — slow AC charging
  'Fast':       12,  // ₹12/kWh — DC fast charging
  'Ultra-Fast': 18,  // ₹18/kWh — HPC ultra-fast
};

const SPEED_KW: Record<ChargerType, number> = {
  'Normal':     22,
  'Fast':       50,
  'Ultra-Fast': 150,
};

const SERVICE_FEE = 20;       // flat ₹20 platform convenience fee
const GST_RATE    = 0.18;     // 18% GST on service fee only

// Typical EV charges ~30 kWh per session (60% of 50 kWh battery)
const SESSION_KWH = 30;

/** Generates a unique transaction ID */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random    = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

/**
 * Calculates the full price breakdown for a charging session.
 */
export function calculateBreakdown(chargerType: ChargerType): PaymentBreakdown {
  const pricePerKwh  = PRICE_PER_KWH[chargerType];
  const speedKw      = SPEED_KW[chargerType];
  const chargingCost = Math.round(SESSION_KWH * pricePerKwh);
  const serviceFee   = SERVICE_FEE;
  const gst          = Math.round(serviceFee * GST_RATE);
  const total        = chargingCost + serviceFee + gst;
  // estimatedMinutes = (kWh / kW) * 60
  const estimatedMinutes = Math.round((SESSION_KWH / speedKw) * 60);

  return {
    chargingCost,
    serviceFee,
    gst,
    total,
    currency:         'INR',
    estimatedMinutes,
  };
}

/** UPI ID format: localpart@bank */
export function validateUpiId(upiId: string): string | null {
  const trimmed = upiId.trim();
  if (!trimmed) return 'Please enter your UPI ID.';
  if (!/^[\w.\-_+]+@[\w]+$/.test(trimmed))
    return 'Invalid UPI ID format. Example: yourname@upi';
  return null;
}

/** Basic card validations (client-side only — no storage) */
export function validateCard(fields: {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const digits = fields.number.replace(/\s/g, '');

  if (!digits || digits.length < 16)
    errors.number = 'Card number must be 16 digits.';
  else if (!/^\d+$/.test(digits))
    errors.number = 'Card number must contain only digits.';

  if (!fields.name.trim())
    errors.name = 'Cardholder name is required.';
  else if (fields.name.trim().length < 3)
    errors.name = 'Please enter the full name on the card.';

  if (!fields.expiry) {
    errors.expiry = 'Expiry date is required.';
  } else {
    const [mm, yy] = fields.expiry.split('/');
    const month    = parseInt(mm, 10);
    const year     = parseInt(`20${yy}`, 10);
    const now      = new Date();
    const exp      = new Date(year, month - 1);
    if (!mm || !yy || month < 1 || month > 12 || isNaN(year))
      errors.expiry = 'Invalid expiry format. Use MM/YY.';
    else if (exp < new Date(now.getFullYear(), now.getMonth()))
      errors.expiry = 'This card has expired.';
  }

  if (!fields.cvv || fields.cvv.length < 3)
    errors.cvv = 'CVV must be 3 or 4 digits.';
  else if (!/^\d+$/.test(fields.cvv))
    errors.cvv = 'CVV must contain only digits.';

  return errors;
}

export interface PaymentGatewayResult {
  success: boolean;
  transactionId?: string;
  failureReason?: string;
}

/**
 * Simulated payment gateway.
 * ─────────────────────────────────────────────────────────────────────────────
 * Replace this function body with a real gateway SDK call for production.
 * The function signature and return type should stay the same so the rest
 * of the app does not need to change.
 * ─────────────────────────────────────────────────────────────────────────────
 * @param _method      Payment method chosen by user
 * @param _amount      Amount in INR
 * @param _methodDetail Safe identifier (UPI ID / last-4 / bank name)
 */
export async function simulatePaymentGateway(
  _method:       PaymentMethod,
  _amount:       number,
  _methodDetail: string,
): Promise<PaymentGatewayResult> {
  void _method;
  void _amount;
  void _methodDetail;
  // Simulate realistic network latency (1.5 – 2.5 s)
  const delay = 1500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // 95% success rate for demo — real gateway handles actual success/failure
  const success = Math.random() > 0.05;

  if (success) {
    return { success: true, transactionId: generateTransactionId() };
  }
  return {
    success: false,
    failureReason:
      'Payment declined by bank. Please try a different method or check your balance.',
  };
}

/**
 * Builds a PaymentRecord from a successful gateway response.
 * Only safe, non-sensitive data is stored.
 */
export function buildPaymentRecord(
  transactionId: string,
  method:        PaymentMethod,
  methodDetail:  string,
  amount:        number,
  status:        PaymentStatus = 'success',
): PaymentRecord {
  return {
    transactionId,
    method,
    methodDetail,
    amount,
    status,
    paidAt:       new Date().toISOString(),
    refundStatus: 'not_applicable',
  };
}

/** Human-readable label for each payment method */
export const METHOD_LABELS: Record<PaymentMethod, string> = {
  ONLINE:         'Pay Online',
  PAY_ONLINE:     'Pay Online',
  PAY_AT_STATION: 'Pay at Station',
  upi:            'UPI (Online)',
  card:           'Credit / Debit Card (Online)',
  netbanking:     'Net Banking (Online)',
  wallet:         'Wallet (Online)',
  PAY_AT_COUNTER: 'Pay at Station',
  counter:        'Pay at Station',
};
