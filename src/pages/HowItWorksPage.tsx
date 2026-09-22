import { motion } from 'framer-motion';
import { Search, CheckCircle2, CalendarCheck, Map, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Reveal, SectionLabel, SectionHeading } from '@/components/ui';

export function HowItWorksPage() {
  const { navigate } = useApp();

  const steps = [
    {
      num: '01',
      icon: Search,
      title: 'FIND',
      label: 'Find nearby charging stations',
      description: 'Search for EV charging stations near you with detailed filters. Sort by distance, charger type, speed, and availability. View stations on an interactive map with live status indicators.',
      action: { label: 'Find a Charger', page: 'stations' as const },
    },
    {
      num: '02',
      icon: CheckCircle2,
      title: 'CHECK',
      label: 'Check charger availability',
      description: 'See real-time availability for every charger at a station. Know exactly how many fast and normal chargers are available before you start driving. No more arriving to find all ports occupied.',
      action: { label: 'Check Availability', page: 'stations' as const },
    },
    {
      num: '03',
      icon: CalendarCheck,
      title: 'RESERVE',
      label: 'Reserve a charging slot',
      description: 'Select your station, choose a charger type, pick a date and time slot, and confirm your reservation. Get a reservation ID and never wait in line again.',
      action: { label: 'Reserve a Slot', page: 'reserve' as const },
    },
    {
      num: '04',
      icon: Map,
      title: 'PLAN',
      label: 'Plan your entire trip',
      description: 'Enter your starting point, destination, battery level, and vehicle range. Chargenix calculates your journey, recommends charging stops, and shows a detailed timeline with battery estimates at each point.',
      action: { label: 'Plan a Trip', page: 'trip-planner' as const },
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-28 pb-12">
          <Reveal>
            <SectionLabel>How It Works</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading className="mt-4">Four steps to a smarter EV journey.</SectionHeading>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-ink-300 text-lg max-w-2xl">
              Chargenix connects the entire EV charging experience — from finding a station to planning a long-distance trip — through four simple modules.
            </p>
          </Reveal>
        </div>

        <div className="space-y-6 pb-20">
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.1}>
              <div className={`glass p-8 lg:p-10 ${i % 2 === 1 ? 'lg:ml-12' : 'lg:mr-12'}`}>
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-electric-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ink-800 border border-white/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-electric-400">{step.num}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-2xl text-white">{step.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-electric-500/10 border border-electric-500/20 text-xs text-electric-400 font-medium">
                        Module {i + 1}
                      </span>
                    </div>
                    <p className="text-ink-300 text-base mb-2">{step.label}</p>
                    <p className="text-ink-400 text-sm leading-relaxed max-w-2xl">{step.description}</p>

                    <button
                      onClick={() => navigate(step.action.page)}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-electric-400 hover:gap-3 transition-all"
                    >
                      {step.action.label}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {i < steps.length - 1 && (
                    <div className="hidden lg:flex absolute" />
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Flow summary */}
        <Reveal>
          <div className="glass-strong p-8 lg:p-12 mb-20">
            <h3 className="font-display font-bold text-xl text-white text-center mb-8">The Complete Journey</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2">
              {['FIND', 'CHECK', 'RESERVE', 'PLAN'].map((mod, i) => (
                <div key={mod} className="flex items-center gap-2 sm:gap-4">
                  <div className="px-5 py-3 rounded-xl bg-electric-500/10 border border-electric-500/20">
                    <span className="font-display font-bold text-electric-400 text-sm">{mod}</span>
                  </div>
                  {i < 3 && <ArrowRight className="w-5 h-5 text-ink-500 hidden sm:block" />}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-ink-400 mt-6">
              Chargenix doesn't just help you find a charging station. It helps you decide where to charge, when to charge, reserve the charger, and plan the entire journey around your battery.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
