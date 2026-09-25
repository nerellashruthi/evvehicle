import {
  Search, CheckCircle2, CalendarCheck, Map, ArrowRight,
  Zap, BatteryCharging, Navigation, Clock, Route, Sparkles,
  Brain, CreditCard, Radio, UserCheck,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Reveal, SectionLabel, SectionHeading } from '@/components/ui';
import { problemCards, benefits, futureFeatures } from '@/data/stations';
import { MapMock } from '@/components/MapMock';
import { Hero } from '@/components/landing/Hero';

const moduleIcons = { FIND: Search, CHECK: CheckCircle2, RESERVE: CalendarCheck, PLAN: Map };
const moduleLabels = {
  FIND: 'FIND',
  CHECK: 'CHECK',
  RESERVE: 'RESERVE',
  PLAN: 'PLAN',
};

const problemIconMap: Record<string, typeof Search> = {
  SearchX: Search,
  HelpCircle: CheckCircle2,
  Clock: Clock,
  BatteryWarning: BatteryCharging,
};

const benefitIconMap: Record<string, typeof Search> = {
  Clock: Clock,
  Route: Route,
  BatteryCharging: BatteryCharging,
  Sparkles: Sparkles,
};

const futureIconMap: Record<string, typeof Search> = {
  Brain: Brain,
  CreditCard: CreditCard,
  Radio: Radio,
  UserCheck: UserCheck,
};

export function LandingPage() {
  const { navigate, liveStations, lastUpdated } = useApp();

  return (
    <div>
      {/* HERO */}
      <Hero />

      {/* PROBLEM */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionLabel>The Problem</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading className="mt-4 mb-12">
              EV travel shouldn't be a guessing game.
            </SectionHeading>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {problemCards.map((card, i) => {
              const Icon = problemIconMap[card.icon] || Search;
              return (
                <Reveal key={card.title} delay={i * 0.1}>
                  <div className="glass p-6 h-full hover:border-white/15 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-acid/10 border border-acid/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-acid" />
                    </div>
                    <h3 className="font-display font-semibold text-white text-base mb-2">{card.title}</h3>
                    <p className="text-sm text-ink-400 leading-relaxed">{card.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-acid/5 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Reveal>
            <SectionLabel>The Solution</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading className="mt-4 mb-6">
              One platform. Every charging decision.
            </SectionHeading>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-ink-300 text-lg max-w-2xl mb-12">
              Chargenix connects the entire EV charging journey through four powerful modules.
            </p>
          </Reveal>

          {/* Module flow */}
          <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-16">
            {(['FIND', 'CHECK', 'RESERVE', 'PLAN'] as const).map((mod, i) => {
              const Icon = moduleIcons[mod];
              return (
                <Reveal key={mod} delay={i * 0.1} className="flex-1">
                  <div className="glass p-6 h-full relative group hover:border-acid/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-acid/10 border border-acid/20 flex items-center justify-center group-hover:shadow-glow transition-all">
                        <Icon className="w-6 h-6 text-acid" />
                      </div>
                      <span className="text-3xl font-display font-medium text-ink-700">0{i + 1}</span>
                    </div>
                    <h3 className="font-display font-medium text-white text-lg mb-1">{moduleLabels[mod]}</h3>
                    <p className="text-sm text-ink-400">
                      {mod === 'FIND' && 'Discover nearby EV charging stations with filters and map view.'}
                      {mod === 'CHECK' && 'See real-time charger availability before you travel.'}
                      {mod === 'RESERVE' && 'Book a charging slot so you never wait in line.'}
                      {mod === 'PLAN' && 'Plan your entire trip around battery and charging needs.'}
                    </p>
                    {i < 3 && (
                      <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-ink-800 border border-white/10 items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-acid" />
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Module 1 preview — FIND */}
          <ModulePreview
            number="01"
            icon={Search}
            label="MODULE 1 — FIND"
            title="Charging Station Finder"
            description="Find nearby EV charging stations with detailed information on charger types, speeds, and availability."
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass p-4 space-y-3">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-ink-800/80 border border-white/10">
                  <Search className="w-4 h-4 text-ink-400" />
                  <span className="text-sm text-ink-400">Search charging stations...</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Distance', 'Charger Type', 'Speed', 'Available Only'].map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-ink-300">
                      {f}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {liveStations.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-ink-800/50 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-ink-100">{s.name}</p>
                        <p className="text-xs text-ink-400">{s.distanceKm} km · {s.chargers[0].type}</p>
                      </div>
                      <span className={`text-xs font-medium ${s.status === 'Available' ? 'text-acid' : s.status === 'Limited' ? 'text-amber-400' : 'text-danger-400'}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <MapMock stations={liveStations.slice(0, 5)} height="320px" />
            </div>
          </ModulePreview>

          {/* Module 2 preview — CHECK */}
          <ModulePreview
            number="02"
            icon={CheckCircle2}
            label="MODULE 2 — CHECK"
            title="Live Availability"
            description="See real-time charging availability with clear visual indicators for each station."
          >
            <div className="glass p-6 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-display font-semibold text-white">GreenVolt Hub</h4>
                  <p className="text-xs text-ink-400">2.4 km · Banjara Hills</p>
                </div>
                <span className="text-xs text-ink-400">Last updated: {lastUpdated}</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ink-200">Fast Chargers</span>
                    <span className="text-sm font-semibold text-acid">3 / 6 Available</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={`flex-1 h-2 rounded-full ${i < 3 ? 'bg-acid' : 'bg-ink-600'}`} />
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ink-200">Normal Chargers</span>
                    <span className="text-sm font-semibold text-acid">2 / 4 Available</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex-1 h-2 rounded-full ${i < 2 ? 'bg-acid' : 'bg-ink-600'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ModulePreview>

          {/* Module 3 preview — RESERVE */}
          <ModulePreview
            number="03"
            icon={CalendarCheck}
            label="MODULE 3 — RESERVE"
            title="Slot Reservation"
            description="Select a station and reserve a charging slot in just a few taps."
          >
            <div className="glass p-6 max-w-md mx-auto">
              <h4 className="font-display font-semibold text-white mb-4">Available Time Slots</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'].map((slot, i) => (
                  <div
                    key={slot}
                    className={`px-3 py-2.5 rounded-xl text-center text-sm font-medium transition-all ${
                      i === 2
                        ? 'bg-acid text-ink-950'
                        : i === 5
                        ? 'bg-ink-700 text-ink-500 line-through cursor-not-allowed'
                        : 'bg-ink-800/50 border border-white/10 text-ink-200 hover:border-acid/30'
                    }`}
                  >
                    {slot}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-acid/10 border border-acid/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-acid" />
                  <span className="text-sm font-medium text-acid">Reservation Confirmed</span>
                </div>
                <p className="text-xs text-ink-400 mt-1.5">GreenVolt Hub · 10:00 AM · CGX-K7M3XP</p>
              </div>
            </div>
          </ModulePreview>

          {/* Module 4 preview — PLAN */}
          <ModulePreview
            number="04"
            icon={Map}
            label="MODULE 4 — PLAN"
            title="Smart Trip Planner"
            description="Plan your entire journey with intelligent charging stop recommendations based on your battery and range."
          >
            <div className="glass p-6 max-w-lg mx-auto">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Distance', value: '320 km', icon: Route },
                  { label: 'Est. Time', value: '5h 45m', icon: Clock },
                  { label: 'Charging Stops', value: '2', icon: Zap },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <stat.icon className="w-5 h-5 text-acid mx-auto mb-1.5" />
                    <p className="font-display font-medium text-white text-lg">{stat.value}</p>
                    <p className="text-xs text-ink-400">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <TimelineItem label="Start — Hyderabad" type="start" />
                <TimelineConnector />
                <TimelineItem label="Drive 105 km" type="drive" />
                <TimelineConnector />
                <TimelineItem label="Charging Stop 1 — GreenVolt Hub" type="charge" sub="35 min · Fast Charger" />
                <TimelineConnector />
                <TimelineItem label="Drive 120 km" type="drive" />
                <TimelineConnector />
                <TimelineItem label="Charging Stop 2 — Tata Power EV" type="charge" sub="20 min · Ultra-Fast" />
                <TimelineConnector />
                <TimelineItem label="Destination — Vijayawada" type="destination" />
              </div>
            </div>
          </ModulePreview>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionLabel>How It Works</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading className="mt-4 mb-16">Four steps to a smarter journey.</SectionHeading>
          </Reveal>

          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-acid/30 to-transparent" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { num: '01', icon: Search, title: 'FIND', desc: 'Find nearby charging stations.' },
                { num: '02', icon: CheckCircle2, title: 'CHECK', desc: 'Check charger availability before travelling.' },
                { num: '03', icon: CalendarCheck, title: 'RESERVE', desc: 'Reserve an available charging slot.' },
                { num: '04', icon: Map, title: 'PLAN', desc: 'Plan your entire trip around your battery and charging needs.' },
              ].map((step, i) => (
                <Reveal key={step.num} delay={i * 0.15}>
                  <div className="text-center relative">
                    <div className="relative inline-flex">
                      <div className="w-24 h-24 rounded-full bg-ink-850 border border-white/10 flex items-center justify-center mx-auto relative z-10">
                        <step.icon className="w-8 h-8 text-acid" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-acid/10 blur-xl animate-pulse-glow" />
                    </div>
                    <div className="mt-4 text-3xl font-display font-medium text-ink-700">{step.num}</div>
                    <h3 className="mt-1 font-display font-medium text-white text-lg">{step.title}</h3>
                    <p className="mt-2 text-sm text-ink-400 max-w-[200px] mx-auto">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionLabel>Benefits</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading className="mt-4 mb-12">Built to make EV travel easier.</SectionHeading>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((benefit, i) => {
              const Icon = benefitIconMap[benefit.icon] || Sparkles;
              return (
                <Reveal key={benefit.title} delay={i * 0.1}>
                  <div className="glass p-6 h-full hover:border-acid/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-acid/10 border border-acid/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-acid" />
                    </div>
                    <h3 className="font-display font-semibold text-white text-base mb-2">{benefit.title}</h3>
                    <p className="text-sm text-ink-400 leading-relaxed">{benefit.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FUTURE FEATURES */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionLabel>What's Next</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading className="mt-4 mb-12">What's next for Chargenix?</SectionHeading>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {futureFeatures.map((feature, i) => {
              const Icon = futureIconMap[feature.icon] || Sparkles;
              return (
                <Reveal key={feature.title} delay={i * 0.1}>
                  <div className="glass p-6 h-full hover:border-acid/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-acid/10 border border-acid/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-acid" />
                    </div>
                    <h3 className="font-display font-semibold text-white text-base mb-2">{feature.title}</h3>
                    <p className="text-sm text-ink-400 leading-relaxed">{feature.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative glass-strong p-12 lg:p-16 text-center overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-acid/10 rounded-full blur-[100px]" />
              <div className="relative">
                <h2 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl text-white text-balance">
                  Find the right charger.{' '}
                  <span className="text-acid">At the right time.</span>
                </h2>
                <p className="mt-6 text-lg text-ink-300 max-w-2xl mx-auto">
                  Chargenix helps EV users plan, charge, and travel with confidence.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => navigate('stations')} className="btn-primary text-base px-8 py-4">
                    <Search className="w-5 h-5" />
                    Find a Charger
                  </button>
                  <button onClick={() => navigate('trip-planner')} className="btn-secondary text-base px-8 py-4">
                    <Navigation className="w-5 h-5" />
                    Plan Your Trip
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function ModulePreview({
  number,
  icon: Icon,
  label,
  title,
  description,
  children,
}: {
  number: string;
  icon: typeof Search;
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-16">
      <Reveal>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-acid/10 border border-acid/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-acid" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-acid">Module {number} · {label}</span>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <h3 className="font-display font-medium text-2xl text-white mb-2">{title}</h3>
        <p className="text-ink-400 max-w-2xl mb-6">{description}</p>
      </Reveal>
      <Reveal delay={0.2}>{children}</Reveal>
    </div>
  );
}

function TimelineItem({ label, type, sub }: { label: string; type: 'start' | 'drive' | 'charge' | 'destination'; sub?: string }) {
  const config = {
    start: { icon: Navigation, color: 'text-acid', bg: 'bg-acid/10 border-acid/20' },
    drive: { icon: Route, color: 'text-ink-300', bg: 'bg-ink-800/50 border-white/5' },
    charge: { icon: Zap, color: 'text-acid', bg: 'bg-acid/10 border-acid/20' },
    destination: { icon: Map, color: 'text-acid', bg: 'bg-acid/10 border-acid/20' },
  };
  const c = config[type];
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg}`}>
      <c.icon className={`w-5 h-5 ${c.color} shrink-0`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-100 truncate">{label}</p>
        {sub && <p className="text-xs text-ink-400">{sub}</p>}
      </div>
    </div>
  );
}

function TimelineConnector() {
  return (
    <div className="flex justify-center">
      <div className="w-px h-4 bg-acid/30" />
    </div>
  );
}
