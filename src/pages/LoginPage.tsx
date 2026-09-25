import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Car, Navigation, Zap, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/Logo';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function LoginPage() {
  const { login, navigate } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleRange, setVehicleRange] = useState(320);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
        name: name || email.split('@')[0],
        email,
        vehicleModel: vehicleModel || 'Tata Nexon EV',
        vehicleRange: vehicleRange || 320,
        batteryPercent: 72,
      });
      setLoading(false);
      navigate('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-acid/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-acid/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-strong p-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          <div className="flex p-1 rounded-xl bg-ink-800/50 border border-white/5 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-acid/15 text-acid' : 'text-ink-400'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-acid/15 text-acid' : 'text-ink-400'
              }`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="font-display font-medium text-2xl text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-ink-400 mb-6">
            {mode === 'login' ? 'Sign in to access your dashboard' : 'Start your smart EV journey today'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="text-xs font-medium text-ink-300 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="input-field pl-10"
                    />
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
                  placeholder="you@example.com"
                  className="input-field pl-10"
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
                  className="input-field pl-10"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  <div>
                    <label className="text-xs font-medium text-ink-300 mb-1.5 block">Vehicle Model</label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Tata Nexon EV"
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-ink-300">Vehicle Range</label>
                      <span className="text-sm font-semibold text-acid">{vehicleRange} km</span>
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
              <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-sm text-danger-400">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-ink-500">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                login({
                  name: 'Guest User',
                  email: 'guest@chargenix.com',
                  vehicleModel: 'Tata Nexon EV',
                  vehicleRange: 320,
                  batteryPercent: 72,
                });
                setLoading(false);
                navigate('dashboard');
              }, 800);
            }}
            className="btn-secondary w-full mt-4"
            disabled={loading}
          >
            <Zap className="w-4 h-4 text-acid" />
            Continue as Guest
          </button>

          <p className="mt-6 text-center text-xs text-ink-500">
            Secure session authentication with optional Supabase cloud synchronization.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
