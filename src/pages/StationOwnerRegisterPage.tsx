import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, User, Mail, Phone, Lock, MapPin, FileText, Zap,
  CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/Logo';
import type { Station } from '@/types';

export function StationOwnerRegisterPage() {
  const { login, navigate, addStation } = useApp();

  // Required fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Optional fields
  const [businessAddress, setBusinessAddress] = useState('');
  const [gstId, setGstId] = useState('');
  const [initialStationName, setInitialStationName] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim() || !businessName.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      const ownerId = `owner-${Date.now()}`;

      // Create owner account with role = STATION_OWNER
      const newOwner = {
        id: ownerId,
        name: fullName,
        email: email,
        phone: phone,
        businessName: businessName,
        businessAddress: businessAddress || undefined,
        gstId: gstId || undefined,
        role: 'STATION_OWNER' as const,
      };

      // If initial station name was provided, create an initial station
      if (initialStationName.trim()) {
        const newStation: Station = {
          id: `stn-${Date.now()}`,
          name: initialStationName.trim(),
          location: businessAddress || 'Hyderabad, Telangana',
          distanceKm: 4.5,
          lat: 17.4485,
          lng: 78.3908,
          mapX: 50,
          mapY: 40,
          chargers: [
            { type: 'Fast', totalPorts: 4, availablePorts: 4, speedKW: 60 },
            { type: 'Normal', totalPorts: 2, availablePorts: 2, speedKW: 22 },
          ],
          status: 'Available',
          operationalStatus: 'OPEN',
          rating: 5.0,
          open24Hours: true,
          operatingHours: '24/7 (All Days)',
          contactNumber: phone,
          description: `Managed by ${businessName}. Fast EV charging network.`,
          amenities: ['WiFi', 'Restroom', 'Parking'],
          ownerId: ownerId,
        };
        addStation(newStation);
      }

      setSuccess(true);
      setLoading(false);

      // Perform login and redirect
      setTimeout(() => {
        login(newOwner);
        navigate('station-owner-dashboard');
      }, 1200);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-acid/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-acid/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-xl"
      >
        <div className="glass-strong p-8 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-xs text-ink-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
            <Logo size="sm" />
          </div>

          <div className="mb-6">
            <span className="text-[11px] font-semibold text-acid uppercase tracking-wider bg-acid/10 border border-acid/20 px-2.5 py-1 rounded-full inline-block mb-2">
              Station Operator Registration
            </span>
            <h1 className="text-2xl font-display font-bold text-white">
              Register Your EV Charging Business
            </h1>
            <p className="text-xs text-ink-400 mt-1">
              Join the ChargeNix host network. Manage dispensers, counter billing, real-time telemetry, and earnings.
            </p>
          </div>

          {/* Success Banner */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 mb-6 rounded-xl bg-acid/15 border border-acid/30 text-white flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-acid shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-acid">Station Owner account created successfully.</h4>
                  <p className="text-xs text-ink-200 mt-0.5">
                    Redirecting you to your Station Owner Dashboard...
                  </p>
                  <span className="text-[10px] text-ink-400 mt-1.5 block">
                    (Note: Hackathon MVP simulation active — instant sandbox provisioning)
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                  Full Name <span className="text-acid">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Vikramaditya Rao"
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                  Business / Company Name <span className="text-acid">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. VoltPulse Power Ltd"
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                  Email Address <span className="text-acid">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@company.com"
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                  Phone Number <span className="text-acid">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98490 12345"
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                  Password <span className="text-acid">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                  Confirm Password <span className="text-acid">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Optional Station Details Section */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <span className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider block">
                Station & Business Details (Optional)
              </span>

              <div>
                <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                  Primary Station Name
                </label>
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    value={initialStationName}
                    onChange={(e) => setInitialStationName(e.target.value)}
                    placeholder="e.g. Cyber Towers EV Charging Hub"
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                    Business Address / Station Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="text"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="e.g. Phase 2, Madhapur, Hyderabad"
                      className="input-field pl-10 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                    GST / Business Registration ID
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="text"
                      value={gstId}
                      onChange={(e) => setGstId(e.target.value)}
                      placeholder="e.g. 36AAACH7789F1Z5"
                      className="input-field pl-10 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-xs text-danger-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                  Creating Station Owner Account...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Complete Station Owner Registration
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-xs text-ink-400">
              Already registered as a Station Owner?{' '}
              <button
                type="button"
                onClick={() => navigate('login')}
                className="text-acid font-semibold hover:underline"
              >
                Sign In here
              </button>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
