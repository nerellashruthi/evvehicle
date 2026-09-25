import { motion } from 'framer-motion';
import { Zap, MapPin, Navigation, BatteryCharging, Search, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Hero() {
  const { navigate } = useApp();

  return (
    /**
     * ROOT CAUSE FIX — "Stuck loading / blank hero screen"
     * ─────────────────────────────────────────────────────────────────────────
     * The original code had the video element at z-index: auto (default) while
     * the content div had no explicit z-index. In some browsers, when the remote
     * CDN video is slow to respond or unavailable:
     *   1. The <video> element renders as an opaque native block (grey / black)
     *      that visually covers the content beneath it.
     *   2. No poster was set, so there was no visual fallback during buffering.
     *   3. The dark overlay div (bg-ink-950/40) was mixed into the same stacking
     *      context without explicit z-index values, so ordering was fragile.
     *
     * Fix strategy:
     *   • Explicit stacking layers:  video → z-0, overlay → z-10, content → z-20
     *   • Hard dark bg (#0d1b26) on the section so it's never empty/transparent.
     *   • poster="data:…" transparent GIF: stops the native grey video placeholder.
     *   • onError: hides the video element if the source 404s / network fails.
     *   • None of this removes the video when it works — it plays exactly as before.
     * ─────────────────────────────────────────────────────────────────────────
     */
    <section
      className="relative min-h-screen flex items-center pt-20 overflow-hidden"
      style={{ background: '#0d1b26' }}
    >
      {/*
        VIDEO — z-0 (bottom of stack)
        • poster: 1×1 transparent GIF prevents native video loading placeholder.
        • onError: gracefully hides video on CDN failure; dark bg becomes fallback.
        • aria-hidden: decorative, no semantic content.
      */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        className="absolute inset-0 w-full h-full object-cover z-0"
        aria-hidden="true"
        onError={(e) => {
          (e.currentTarget as HTMLVideoElement).style.display = 'none';
        }}
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_075824_7c8a2ef3-826c-43ca-81a1-162429faa306.mp4"
          type="video/mp4"
        />
      </video>

      {/* OVERLAY — z-10 (above video, below content) */}
      <div className="absolute inset-0 bg-ink-950/40 z-10" aria-hidden="true" />

      {/*
        CONTENT — z-20 (always topmost)
        This guarantees the headline, CTA buttons, and stats are ALWAYS visible
        regardless of video load state, network speed, or CDN availability.
      */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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
              <button
                id="hero-find-charger-btn"
                onClick={() => navigate('stations')}
                className="btn-primary text-base px-8 py-4"
              >
                <Search className="w-5 h-5" />
                Find a Charger
              </button>
              <button
                id="hero-plan-trip-btn"
                onClick={() => navigate('trip-planner')}
                className="btn-secondary text-base px-8 py-4"
              >
                <Navigation className="w-5 h-5" />
                Plan My Trip
              </button>
            </div>

            <div className="mt-12 flex items-center gap-8">
              {[
                { icon: MapPin,          label: '7+ Stations' },
                { icon: Zap,            label: '150kW Max Speed' },
                { icon: Clock,          label: '24h Available' },
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

      {/* Scroll indicator — z-20 so always visible */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
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

// ─── HeroVisual — unchanged, purely decorative ──────────────────────────────
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
        { icon: MapPin,          x: '10%', y: '20%', delay: 0   },
        { icon: BatteryCharging, x: '80%', y: '15%', delay: 0.5 },
        { icon: Zap,             x: '15%', y: '75%', delay: 1   },
        { icon: Navigation,      x: '75%', y: '70%', delay: 1.5 },
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
