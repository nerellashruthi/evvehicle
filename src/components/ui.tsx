import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="section-label">{children}</span>;
}

export function SectionHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white text-balance ${className}`}>
      {children}
    </h2>
  );
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StatusBadge({ status }: { status: 'Available' | 'Occupied' | 'Limited' }) {
  const config = {
    Available: { color: 'text-electric-400', bg: 'bg-electric-500/10', border: 'border-electric-500/30', dot: 'bg-electric-400' },
    Occupied: { color: 'text-danger-400', bg: 'bg-danger-500/10', border: 'border-danger-500/30', dot: 'bg-danger-400' },
    Limited: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  };
  const c = config[status];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.border} border ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {status}
    </div>
  );
}

export function PageHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="pt-28 pb-8">
      <Reveal>
        <SectionLabel>{label}</SectionLabel>
      </Reveal>
      <Reveal delay={0.1}>
        <SectionHeading className="mt-4">{title}</SectionHeading>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.2}>
          <p className="mt-4 text-ink-300 text-lg max-w-2xl">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}
