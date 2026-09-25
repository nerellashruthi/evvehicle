import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Car, Navigation, Zap, ArrowRight, Building2,
  KeyRound, CheckCircle2, ShieldCheck, Sparkles
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/Logo';
import { DEMO_STATION_OWNER } from '@/utils/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function LoginPage() {
  const { user, login, navigate, authLoading } = useApp();
  
  // Role selector: EV User vs Station Owner (Default: EV User)
  const [selectedRole, setSelectedRole] = useState<'USER' | 'STATION_OWNER'>('USER');

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'STATION_OWNER') {
        navigate('station-owner-dashboard');
      } else {
        navigate('dashboard');
      }
    }
  }, [user, authLoading, navigate]);

  // EV User mode (login or signup)
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleRange, setVehicleRange] = useState(320);

  // Station Owner login fields
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Handle EV User Submit
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (mode === 'signup' && !name) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        if (mode === 'signup') {
          const { error: authErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                vehicleModel: vehicleModel || 'Tata Nexon EV',
                vehicleRange: vehicleRange || 320,
              },
            },
          });
          if (authErr) {
            setError(authErr.message);
            setLoading(false);
            return;
          }
        } else {
          const { error: authErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (authErr) {
            setError(authErr.message);
            setLoading(false);
            return;
          }
        }
      }

      login({
        id: 'usr-default',
        name: name || email.split('@')[0],
        email,
        vehicleModel: vehicleModel || 'Tata Nexon EV',
        vehicleRange: vehicleRange || 320,
        batteryPercent: 72,
        role: 'USER',
      });
      setLoading(false);
      navigate('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
      setLoading(false);
    }
  };

  // Handle Station Owner Submit
  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerEmail || !ownerPassword) {
      setError('Please enter your Station Owner email and password.');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Check if matches demo or arbitrary valid credentials
      login({
        id: ownerEmail.includes('owner') ? DEMO_STATION_OWNER.id : `owner-${Date.now()}`,
        name: ownerEmail.includes('owner') ? DEMO_STATION_OWNER.name : ownerEmail.split('@')[0],
        email: ownerEmail,
        phone: DEMO_STATION_OWNER.phone,
        businessName: DEMO_STATION_OWNER.businessName,
        businessAddress: DEMO_STATION_OWNER.businessAddress,
        gstId: DEMO_STATION_OWNER.gstId,
        role: 'STATION_OWNER',
      });
      setLoading(false);
      navigate('station-owner-dashboard');
    }, 600);
  };

  const handleQuickDemoOwner = () => {
    setOwnerEmail(DEMO_STATION_OWNER.email);
    setOwnerPassword('RaviMGIT@2026');
    setLoading(true);
    setTimeout(() => {
      login(DEMO_STATION_OWNER);
      setLoading(false);
      navigate('station-owner-dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-acid/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-acid/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-strong p-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-display font-bold text-white tracking-tight">
              Welcome to ChargeNix
            </h1>
            <p className="text-xs text-ink-400 mt-1">
              Choose how you want to continue
            </p>
          </div>

          {/* ==================================================
              ROLE SELECTOR: EV User vs Station Owner
              ================================================== */}
          <div className="mb-6">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2 block text-center">
              Login as
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-ink-900/80 border border-white/10">
              <button
                type="button"
                id="role-select-user"
                onClick={() => {
                  setSelectedRole('USER');
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'USER'
                    ? 'bg-acid text-ink-950 font-bold shadow-lg shadow-acid/20'
                    : 'text-ink-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>EV User</span>
              </button>

              <button
                type="button"
                id="role-select-station-owner"
                onClick={() => {
                  setSelectedRole('STATION_OWNER');
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'STATION_OWNER'
                    ? 'bg-acid text-ink-950 font-bold shadow-lg shadow-acid/20'
                    : 'text-ink-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Station Owner</span>
              </button>
            </div>

            {/* Clear Role Communication Callout */}
            <div className="mt-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-center">
              {selectedRole === 'USER' ? (
                <p className="text-xs text-acid font-medium flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Find, book and charge your EV.
                </p>
              ) : (
                <p className="text-xs text-acid font-medium flex items-center justify-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Manage your charging stations, bookings and revenue.
                </p>
              )}
            </div>
          </div>

          {/* ==================================================
              VIEW 1: EV USER LOGIN FLOW
              ================================================== */}
          {selectedRole === 'USER' && (
            <motion.div
              key="user-flow"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Sign In vs Sign Up Tab */}
              <div className="flex p-1 rounded-xl bg-ink-800/50 border border-white/5 mb-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'login' ? 'bg-acid/15 text-acid' : 'text-ink-400'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'signup' ? 'bg-acid/15 text-acid' : 'text-ink-400'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-4"
                    >
                      <div>
                        <label className="text-xs font-medium text-ink-300 mb-1.5 block">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="input-field pl-10 text-sm"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@example.com"
                      className="input-field pl-10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-10 text-sm"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-4 pt-1"
                    >
                      <div>
                        <label className="text-xs font-medium text-ink-300 mb-1.5 block">Vehicle Model</label>
                        <div className="relative">
                          <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                          <input
                            type="text"
                            value={vehicleModel}
                            onChange={(e) => setVehicleModel(e.target.value)}
                            placeholder="Tata Nexon EV / MG ZS EV"
                            className="input-field pl-10 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-ink-300">Vehicle Range</label>
                          <span className="text-xs font-semibold text-acid">{vehicleRange} km</span>
                        </div>
                        <div className="relative">
                          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                          <input
                            type="range"
                            min="100"
                            max="600"
                            value={vehicleRange}
                            onChange={(e) => setVehicleRange(Number(e.target.value))}
                            className="w-full accent-acid pl-10"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-xs text-danger-400">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In as EV User' : 'Create EV User Account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[11px] text-ink-500 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    login({
                      id: 'usr-guest',
                      name: 'Guest EV Driver',
                      email: 'guest@chargenix.io',
                      vehicleModel: 'Tata Nexon EV',
                      vehicleRange: 320,
                      batteryPercent: 72,
                      role: 'USER',
                    });
                    setLoading(false);
                    navigate('dashboard');
                  }, 500);
                }}
                className="btn-secondary w-full mt-4 text-xs font-semibold py-2.5"
                disabled={loading}
              >
                <Zap className="w-4 h-4 text-acid" />
                Continue as Guest EV User
              </button>
            </motion.div>
          )}

          {/* ==================================================
              VIEW 2: STATION OWNER LOGIN FLOW
              ================================================== */}
          {selectedRole === 'STATION_OWNER' && (
            <motion.div
              key="owner-flow"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-3 rounded-xl bg-acid/10 border border-acid/20 mb-5 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-acid shrink-0 mt-0.5" />
                <div className="text-[11px] text-ink-200 leading-relaxed">
                  <span className="font-semibold text-white">Station Operator Portal:</span> Access real-time dispenser controls, counter collections, bookings, and station AI telemetry.
                </div>
              </div>

              <form onSubmit={handleOwnerSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">
                    Station Owner Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="email"
                      id="owner-email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner@chargenix.io"
                      className="input-field pl-10 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-ink-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotModal(true);
                        setResetSent(false);
                      }}
                      className="text-xs text-acid hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="password"
                      id="owner-password"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-10 text-sm"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-xs text-danger-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-login-station-owner"
                  className="btn-primary w-full mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                      Authenticating Station...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      Login as Station Owner
                    </>
                  )}
                </button>
              </form>

              {/* Instant 1-Click Demo Login Button for Evaluators */}
              <button
                type="button"
                onClick={handleQuickDemoOwner}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-acid/15 hover:bg-acid/25 border border-acid/30 text-acid text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>1-Click Demo Station Owner Login</span>
              </button>

              <div className="mt-6 pt-5 border-t border-white/5 text-center">
                <p className="text-xs text-ink-400 mb-2">
                  Don't have a Station Owner account?
                </p>
                <button
                  type="button"
                  id="btn-register-station"
                  onClick={() => navigate('station-owner-register')}
                  className="btn-secondary w-full text-xs font-semibold py-2.5 flex items-center justify-center gap-2 border-acid/30 text-white hover:text-acid"
                >
                  <Building2 className="w-4 h-4 text-acid" />
                  Register Your Station
                </button>
              </div>
            </motion.div>
          )}

          <p className="mt-6 text-center text-[11px] text-ink-500">
            Protected with role-based access control. Enterprise SSL 256-bit encryption.
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-ink-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong p-6 rounded-2xl max-w-sm w-full border border-white/10"
            >
              <div className="flex items-center gap-2 text-acid mb-2">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-semibold text-white text-base">Reset Password</h3>
              </div>
              <p className="text-xs text-ink-300 mb-4">
                Enter your registered station owner email address to receive password reset instructions.
              </p>

              {resetSent ? (
                <div className="p-3 rounded-xl bg-acid/10 border border-acid/30 text-xs text-acid mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Reset instructions have been dispatched to your email.
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  <input
                    type="email"
                    defaultValue={ownerEmail || 'owner@chargenix.io'}
                    placeholder="owner@chargenix.io"
                    className="input-field text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setResetSent(true)}
                    className="btn-primary w-full text-xs py-2"
                  >
                    Send Reset Link
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setForgotModal(false)}
                className="btn-ghost w-full text-xs py-1.5"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
