import { motion } from 'framer-motion';
import { Zap, MapPin, Navigation, BatteryCharging, Search, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Hero() {
  const { navigate } = useApp();

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_075824_7c8a2ef3-826c-43ca-81a1-162429faa306.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/70 to-ink-950" />
      <div className="absolute inset-0 grid-pattern opacity-20 mask-fade-b" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-acid/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-acid/5 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-acid/10 border border-acid/20 text-acid text-xs font-medium uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-acid animate-pulse" />
              EV Charging, Reimagined
            </div>

            <h1 className="font-display font-medium text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] text-balance">
              Charge Smart.{' '}
              <span className="text-acid glow-text">Travel Further.</span>
            </h1>

            <p className="mt-6 text-lg text-ink-300 max-w-xl leading-relaxed">
              Find the right charger, check availability, reserve your slot, and plan your EV journey — all in one place.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate('stations')} className="btn-primary text-base px-8 py-4">
                <Search className="w-5 h-5" />
                Find a Charger
              </button>
              <button onClick={() => navigate('trip-planner')} className="btn-secondary text-base px-8 py-4">
                <Navigation className="w-5 h-5" />
                Plan My Trip
              </button>
            </div>

            <div className="mt-12 flex items-center gap-8">
              {[
                { icon: MapPin, label: '7+ Stations' },
                { icon: Zap, label: '150kW Max Speed' },
                { icon: Clock, label: '24h Available' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 text-sm text-ink-400">
                  <stat.icon className="w-4 h-4 text-acid" />
                  {stat.label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-ink-500 flex items-start justify-center p-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-acid" />
        </motion.div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      <div className="absolute inset-0 rounded-full bg-acid/5 blur-3xl" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="180" stroke="rgba(237, 255, 57, 0.1)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
          <circle cx="200" cy="200" r="140" stroke="rgba(237, 255, 57, 0.08)" strokeWidth="1" fill="none" />
          <circle cx="200" cy="200" r="100" stroke="rgba(237, 255, 57, 0.06)" strokeWidth="1" fill="none" strokeDasharray="2 4" />
        </svg>
      </motion.div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-40 h-40 rounded-full bg-acid/10 border-2 border-acid/30 flex items-center justify-center"
          >
            <div className="w-28 h-28 rounded-full bg-acid/15 border border-acid/40 flex items-center justify-center">
              <Zap className="w-14 h-14 text-acid" fill="currentColor" />
            </div>
          </motion.div>
          <div className="absolute inset-0 rounded-full bg-acid/20 blur-2xl animate-pulse-glow" />
        </div>
      </div>

      {[
        { icon: MapPin, x: '10%', y: '20%', delay: 0 },
        { icon: BatteryCharging, x: '80%', y: '15%', delay: 0.5 },
        { icon: Zap, x: '15%', y: '75%', delay: 1 },
        { icon: Navigation, x: '75%', y: '70%', delay: 1.5 },
      ].map((item, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: item.delay }}
          className="absolute"
          style={{ left: item.x, top: item.y }}
        >
          <div className="w-12 h-12 rounded-xl glass-strong flex items-center justify-center">
            <item.icon className="w-5 h-5 text-acid" />
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-strong px-4 py-3 flex items-center gap-3"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-acid animate-pulse" />
          <span className="text-xs text-ink-200 font-medium">3 stations nearby</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-1.5 text-xs text-ink-400">
          <BatteryCharging className="w-3.5 h-3.5 text-acid" />
          12 ports available
        </div>
      </motion.div>
    </div>
  );
}
