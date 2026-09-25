import { Logo } from '@/components/Logo';
import { useApp } from '@/context/AppContext';
import type { PageName } from '@/types';

const footerNav: { label: string; page: PageName }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Stations', page: 'stations' },
  { label: 'Reserve', page: 'reserve' },
  { label: 'Trip Planner', page: 'trip-planner' },
  { label: 'How It Works', page: 'how-it-works' },
];

export function Footer() {
  const { navigate } = useApp();

  return (
    <footer className="relative border-t border-white/5 bg-ink-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-ink-400 leading-relaxed max-w-xs">
              Smart EV charging and journey planning for a more convenient electric future.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-ink-200 mb-4">Navigation</h4>
            <ul className="space-y-2">
              {footerNav.map((item) => (
                <li key={item.page}>
                  <button
                    onClick={() => navigate(item.page)}
                    className="text-sm text-ink-400 hover:text-acid transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-ink-200 mb-4">The Four Modules</h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li>📍 Find — Discover nearby charging stations</li>
              <li>⚡ Check — Real-time charger availability</li>
              <li>🔌 Reserve — Book your charging slot</li>
              <li>🗺️ Plan — Smart trip planning with battery range</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ink-400">© 2026 Chargenix. All rights reserved.</p>
          <p className="text-xs text-ink-500">Built for the electric future.</p>
        </div>
      </div>
    </footer>
  );
}
