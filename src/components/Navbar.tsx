import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/Logo';
import type { PageName } from '@/types';

const navItems: { label: string; page: PageName; badge?: string }[] = [
  { label: 'Home',        page: 'home' },
  { label: 'AI Agent',    page: 'ai-agent', badge: 'AI' },
  { label: 'Stations',    page: 'stations' },
  { label: 'Reserve',     page: 'reserve' },
  { label: 'Trip Planner', page: 'trip-planner' },
  { label: 'Support',     page: 'support' },
  { label: 'My Bookings', page: 'my-bookings' },
];

export function Navbar() {
  const { page, navigate, user, logout } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (p: PageName) => {
    navigate(p);
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'bg-ink-950/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <button onClick={() => handleNav('home')} className="shrink-0">
            <Logo />
          </button>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center gap-1.5 ${
                  page === item.page
                    ? 'text-acid bg-acid/10'
                    : 'text-ink-300 hover:text-ink-100 hover:bg-white/5'
                }`}
              >
                {item.badge && <Sparkles className="w-3.5 h-3.5 text-acid animate-pulse" />}
                {item.label}
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-acid/20 text-acid border border-acid/30">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'STATION_OWNER' ? (
                  <button
                    onClick={() => handleNav('station-owner-dashboard')}
                    className="btn-secondary text-xs"
                  >
                    Station Owner Portal
                  </button>
                ) : (
                  <button
                    onClick={() => handleNav('dashboard')}
                    className={`btn-ghost ${page === 'dashboard' ? 'text-acid' : ''}`}
                  >
                    Dashboard
                  </button>
                )}
                <button onClick={logout} className="btn-ghost">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleNav('login')} className="btn-ghost">
                  Login
                </button>
                <button
                  onClick={() => handleNav('login')}
                  className="btn-primary"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-ink-200 hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleNav(item.page)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                      page === item.page
                        ? 'text-acid bg-acid/10'
                        : 'text-ink-300 hover:text-ink-100 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.badge && <Sparkles className="w-4 h-4 text-acid" />}
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-acid/20 text-acid border border-acid/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
                <div className="pt-3 border-t border-white/5 space-y-2">
                  {user ? (
                    <>
                      {user.role === 'STATION_OWNER' ? (
                        <button
                          onClick={() => { handleNav('station-owner-dashboard'); setMobileOpen(false); }}
                          className="btn-secondary w-full"
                        >
                          Station Owner Portal
                        </button>
                      ) : (
                        <button
                          onClick={() => { handleNav('dashboard'); setMobileOpen(false); }}
                          className="btn-secondary w-full"
                        >
                          EV Driver Dashboard
                        </button>
                      )}
                      <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-ghost w-full">
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleNav('login')} className="btn-secondary w-full">
                        Login
                      </button>
                      <button onClick={() => handleNav('login')} className="btn-primary w-full">
                        Get Started
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
